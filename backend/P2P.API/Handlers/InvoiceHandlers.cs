using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using P2P.Application.Common;
using P2P.Application.Features.Invoices.Commands;
using P2P.Application.Features.Invoices.Queries;
using P2P.Application.Interfaces;
using P2P.Domain.Entities;
using P2P.Domain.Enums;
using P2P.Infrastructure.Data;
using P2P.Infrastructure.Services;

namespace P2P.API.Handlers;

public class SubmitInvoiceHandler(ApplicationDbContext db, ICurrentUser currentUser, INumberGenerator numGen, ThreeWayMatchService matchService)
    : IRequestHandler<SubmitInvoiceCommand, BaseResponse<string>>
{
    public async Task<BaseResponse<string>> Handle(SubmitInvoiceCommand req, CancellationToken ct)
    {
        if (!currentUser.IsSupplier) return BaseResponse<string>.Fail("Only suppliers can submit invoices");

        // Validate invoice quantities against received (accepted GR) qty and already-invoiced qty
        var poLineIds = req.Lines.Select(l => l.POLineId).ToList();
        var poLines = await db.POLines
            .Where(pl => poLineIds.Contains(pl.Id))
            .ToDictionaryAsync(pl => pl.Id, ct);

        var alreadyInvoiced = await db.InvoiceLines
            .Where(il => poLineIds.Contains(il.POLineId) && il.Invoice.Status != InvoiceStatus.Rejected)
            .GroupBy(il => il.POLineId)
            .Select(g => new { POLineId = g.Key, Qty = g.Sum(x => x.Quantity) })
            .ToDictionaryAsync(x => x.POLineId, x => x.Qty, ct);

        foreach (var l in req.Lines)
        {
            if (!poLines.TryGetValue(l.POLineId, out var poLine))
                return BaseResponse<string>.Fail($"Invalid PO line in invoice.");

            var received = poLine.ReceivedQuantity;
            var invoiced = alreadyInvoiced.TryGetValue(l.POLineId, out var q) ? q : 0;
            var available = received - invoiced;

            if (received <= 0)
                return BaseResponse<string>.Fail($"'{poLine.Description}' has not been received yet (no verified goods receipt). Cannot invoice.");

            if (l.Quantity > available)
                return BaseResponse<string>.Fail(
                    $"'{poLine.Description}': cannot invoice {l.Quantity}. Received qty is {received}, already invoiced {invoiced}, only {available} available to invoice.");
        }

        var lines = req.Lines.Select(l => new InvoiceLine
        {
            POLineId = l.POLineId, GRLineId = l.GRLineId, Description = l.Description,
            Quantity = l.Quantity, UnitPrice = l.UnitPrice,
            TotalPrice = l.Quantity * l.UnitPrice,
            TaxRate = l.TaxRate, TaxAmount = Math.Round(l.Quantity * l.UnitPrice * l.TaxRate / 100, 2)
        }).ToList();

        var subTotal = lines.Sum(l => l.TotalPrice);
        var taxAmount = lines.Sum(l => l.TaxAmount);

        var invoice = new Invoice
        {
            InvoiceNumber = await numGen.GenerateInvoiceNumberAsync(ct),
            VendorInvoiceNumber = req.VendorInvoiceNumber,
            POId = req.POId, GRId = req.GRId,
            SupplierId = currentUser.SupplierId!,
            InvoiceDate = req.InvoiceDate, DueDate = req.DueDate,
            SubTotal = subTotal, TaxAmount = taxAmount, TotalAmount = subTotal + taxAmount,
            BlobUrl = req.BlobUrl, Status = InvoiceStatus.Submitted,
            SubmittedAt = DateTime.UtcNow, Lines = lines
        };

        db.Invoices.Add(invoice);
        await db.SaveChangesAsync(ct);

        // Auto-run 3-way match
        var (matchStatus, matchNotes, _) = await matchService.MatchAsync(invoice.Id, ct);
        invoice.MatchStatus = matchStatus;
        invoice.MatchNotes = matchNotes;
        if (matchStatus == MatchStatus.Matched) invoice.Status = InvoiceStatus.Matched;
        await db.SaveChangesAsync(ct);

        return BaseResponse<string>.Ok(invoice.Id, "Invoice submitted");
    }
}

public class RunThreeWayMatchHandler(ThreeWayMatchService matchService, ApplicationDbContext db)
    : IRequestHandler<RunThreeWayMatchCommand, BaseResponse<MatchResultDto>>
{
    public async Task<BaseResponse<MatchResultDto>> Handle(RunThreeWayMatchCommand req, CancellationToken ct)
    {
        var (matchStatus, matchNotes, result) = await matchService.MatchAsync(req.InvoiceId, ct);
        var invoice = await db.Invoices.FindAsync([req.InvoiceId], ct);
        if (invoice != null)
        {
            invoice.MatchStatus = matchStatus;
            invoice.MatchNotes = matchNotes;
            await db.SaveChangesAsync(ct);
        }
        return BaseResponse<MatchResultDto>.Ok(result);
    }
}

public class GetAllInvoicesHandler(ApplicationDbContext db, ICurrentUser currentUser, IMapper mapper)
    : IRequestHandler<GetAllInvoicesQuery, BaseResponse<PagedResult<InvoiceDto>>>
{
    public async Task<BaseResponse<PagedResult<InvoiceDto>>> Handle(GetAllInvoicesQuery req, CancellationToken ct)
    {
        var query = db.Invoices.Include(i => i.Supplier).Include(i => i.PurchaseOrder).Include(i => i.Lines).AsQueryable();
        if (currentUser.IsSupplier) query = query.Where(i => i.SupplierId == currentUser.SupplierId);
        if (req.Status.HasValue) query = query.Where(i => i.Status == req.Status.Value);
        if (!string.IsNullOrEmpty(req.SupplierId)) query = query.Where(i => i.SupplierId == req.SupplierId);
        if (!string.IsNullOrEmpty(req.Search)) query = query.Where(i => i.InvoiceNumber.Contains(req.Search));
        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(i => i.CreatedAt).Skip((req.Page - 1) * req.PageSize).Take(req.PageSize).ToListAsync(ct);
        return BaseResponse<PagedResult<InvoiceDto>>.Ok(new PagedResult<InvoiceDto> { Items = mapper.Map<List<InvoiceDto>>(items), TotalCount = total, Page = req.Page, PageSize = req.PageSize });
    }
}

public class GetInvoiceByIdHandler(ApplicationDbContext db, IMapper mapper)
    : IRequestHandler<GetInvoiceByIdQuery, BaseResponse<InvoiceDto>>
{
    public async Task<BaseResponse<InvoiceDto>> Handle(GetInvoiceByIdQuery req, CancellationToken ct)
    {
        var inv = await db.Invoices.Include(i => i.Supplier).Include(i => i.PurchaseOrder).Include(i => i.Lines).ThenInclude(l => l.POLine)
            .FirstOrDefaultAsync(i => i.Id == req.Id, ct);
        if (inv == null) return BaseResponse<InvoiceDto>.Fail("Invoice not found");
        return BaseResponse<InvoiceDto>.Ok(mapper.Map<InvoiceDto>(inv));
    }
}

public class ApproveInvoiceHandler(ApplicationDbContext db, ICurrentUser currentUser)
    : IRequestHandler<ApproveInvoiceCommand, BaseResponse<bool>>
{
    public async Task<BaseResponse<bool>> Handle(ApproveInvoiceCommand req, CancellationToken ct)
    {
        var inv = await db.Invoices.FindAsync([req.Id], ct);
        if (inv == null) return BaseResponse<bool>.Fail("Not found");
        inv.Status = InvoiceStatus.Approved;
        inv.ReviewedById = currentUser.UserId;
        inv.ReviewedAt = DateTime.UtcNow;
        inv.ApprovedAt = DateTime.UtcNow;
        inv.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return BaseResponse<bool>.Ok(true, "Invoice approved");
    }
}

public class RejectInvoiceHandler(ApplicationDbContext db, ICurrentUser currentUser)
    : IRequestHandler<RejectInvoiceCommand, BaseResponse<bool>>
{
    public async Task<BaseResponse<bool>> Handle(RejectInvoiceCommand req, CancellationToken ct)
    {
        var inv = await db.Invoices.FindAsync([req.Id], ct);
        if (inv == null) return BaseResponse<bool>.Fail("Not found");
        inv.Status = InvoiceStatus.Rejected;
        inv.DisputeReason = req.Reason;
        inv.ReviewedById = currentUser.UserId;
        inv.ReviewedAt = DateTime.UtcNow;
        inv.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return BaseResponse<bool>.Ok(true, "Invoice rejected");
    }
}

public class MarkInvoicePaidHandler(ApplicationDbContext db)
    : IRequestHandler<MarkInvoicePaidCommand, BaseResponse<bool>>
{
    public async Task<BaseResponse<bool>> Handle(MarkInvoicePaidCommand req, CancellationToken ct)
    {
        var inv = await db.Invoices.FindAsync([req.Id], ct);
        if (inv == null) return BaseResponse<bool>.Fail("Not found");
        inv.Status = InvoiceStatus.Paid;
        inv.PaidAt = DateTime.UtcNow;
        inv.PaymentReference = req.PaymentReference;
        inv.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return BaseResponse<bool>.Ok(true, "Invoice marked as paid");
    }
}
