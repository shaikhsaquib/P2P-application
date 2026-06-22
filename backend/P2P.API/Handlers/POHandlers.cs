using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using P2P.Application.Common;
using P2P.Application.Features.PurchaseOrders.Commands;
using P2P.Application.Features.PurchaseOrders.Queries;
using P2P.Application.Interfaces;
using P2P.Domain.Entities;
using P2P.Domain.Enums;
using P2P.Infrastructure.Data;

namespace P2P.API.Handlers;

public class CreatePOHandler(ApplicationDbContext db, ICurrentUser currentUser, INumberGenerator numGen)
    : IRequestHandler<CreatePOCommand, BaseResponse<string>>
{
    public async Task<BaseResponse<string>> Handle(CreatePOCommand req, CancellationToken ct)
    {
        var po = new PurchaseOrder
        {
            PONumber = await numGen.GeneratePONumberAsync(ct),
            RequisitionId = req.RequisitionId, RFQId = req.RFQId, QuoteId = req.QuoteId,
            SupplierId = req.SupplierId, DeliveryDate = req.DeliveryDate,
            PaymentTerms = req.PaymentTerms, ShippingAddress = req.ShippingAddress,
            Notes = req.Notes, CreatedById = currentUser.UserId,
            Lines = req.Lines.Select(l => new POLine
            {
                RequisitionLineId = l.RequisitionLineId, ItemCode = l.ItemCode,
                Description = l.Description, Quantity = l.Quantity,
                Unit = l.Unit, UnitPrice = l.UnitPrice, TotalPrice = l.Quantity * l.UnitPrice
            }).ToList()
        };
        po.TotalAmount = po.Lines.Sum(l => l.TotalPrice);
        db.PurchaseOrders.Add(po);
        await db.SaveChangesAsync(ct);
        return BaseResponse<string>.Ok(po.Id, "PO created");
    }
}

public class GetAllPOsHandler(ApplicationDbContext db, ICurrentUser currentUser, IMapper mapper)
    : IRequestHandler<GetAllPOsQuery, BaseResponse<PagedResult<PODto>>>
{
    public async Task<BaseResponse<PagedResult<PODto>>> Handle(GetAllPOsQuery req, CancellationToken ct)
    {
        var query = db.PurchaseOrders.Include(p => p.Supplier).Include(p => p.CreatedBy)
            .Include(p => p.ApprovedBy).Include(p => p.Lines).AsQueryable();

        if (currentUser.IsSupplier)
            query = query.Where(p => p.SupplierId == currentUser.SupplierId);
        if (req.Status.HasValue) query = query.Where(p => p.Status == req.Status.Value);
        if (!string.IsNullOrEmpty(req.SupplierId)) query = query.Where(p => p.SupplierId == req.SupplierId);
        if (!string.IsNullOrEmpty(req.Search))
            query = query.Where(p => p.PONumber.Contains(req.Search));

        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(p => p.CreatedAt)
            .Skip((req.Page - 1) * req.PageSize).Take(req.PageSize).ToListAsync(ct);

        return BaseResponse<PagedResult<PODto>>.Ok(new PagedResult<PODto>
        {
            Items = mapper.Map<List<PODto>>(items), TotalCount = total, Page = req.Page, PageSize = req.PageSize
        });
    }
}

public class GetPOByIdHandler(ApplicationDbContext db, IMapper mapper)
    : IRequestHandler<GetPOByIdQuery, BaseResponse<PODto>>
{
    public async Task<BaseResponse<PODto>> Handle(GetPOByIdQuery req, CancellationToken ct)
    {
        var po = await db.PurchaseOrders.Include(p => p.Supplier).Include(p => p.CreatedBy)
            .Include(p => p.ApprovedBy).Include(p => p.Lines)
            .FirstOrDefaultAsync(p => p.Id == req.Id, ct);
        if (po == null) return BaseResponse<PODto>.Fail("PO not found");
        return BaseResponse<PODto>.Ok(mapper.Map<PODto>(po));
    }
}

public class ApprovePOHandler(ApplicationDbContext db, ICurrentUser currentUser)
    : IRequestHandler<ApprovePOCommand, BaseResponse<bool>>
{
    public async Task<BaseResponse<bool>> Handle(ApprovePOCommand req, CancellationToken ct)
    {
        var po = await db.PurchaseOrders.FindAsync([req.Id], ct);
        if (po == null) return BaseResponse<bool>.Fail("Not found");
        po.Status = POStatus.Approved;
        po.ApprovedById = currentUser.UserId;
        po.ApprovedAt = DateTime.UtcNow;
        po.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return BaseResponse<bool>.Ok(true, "PO approved");
    }
}

public class SendPOToSupplierHandler(ApplicationDbContext db, IEmailService emailService)
    : IRequestHandler<SendPOToSupplierCommand, BaseResponse<bool>>
{
    public async Task<BaseResponse<bool>> Handle(SendPOToSupplierCommand req, CancellationToken ct)
    {
        var po = await db.PurchaseOrders.Include(p => p.Supplier).FirstOrDefaultAsync(p => p.Id == req.Id, ct);
        if (po == null) return BaseResponse<bool>.Fail("Not found");
        if (po.Status != POStatus.Approved) return BaseResponse<bool>.Fail("PO must be approved before sending");
        po.Status = POStatus.SentToSupplier;
        po.SentAt = DateTime.UtcNow;
        po.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        await emailService.SendAsync(po.Supplier.Email, $"Purchase Order {po.PONumber}",
            $"<h2>Purchase Order Received</h2><p>PO Number: {po.PONumber}</p><p>Amount: {po.TotalAmount:C}</p>", ct);

        return BaseResponse<bool>.Ok(true, "PO sent to supplier");
    }
}

public class AcknowledgePOHandler(ApplicationDbContext db, ICurrentUser currentUser)
    : IRequestHandler<AcknowledgePOCommand, BaseResponse<bool>>
{
    public async Task<BaseResponse<bool>> Handle(AcknowledgePOCommand req, CancellationToken ct)
    {
        var po = await db.PurchaseOrders.FindAsync([req.Id], ct);
        if (po == null) return BaseResponse<bool>.Fail("Not found");
        if (po.SupplierId != currentUser.SupplierId) return BaseResponse<bool>.Fail("Unauthorized");
        if (po.Status != POStatus.SentToSupplier) return BaseResponse<bool>.Fail("PO not sent yet");
        po.Status = POStatus.Acknowledged;
        po.AcknowledgedAt = DateTime.UtcNow;
        po.AcknowledgedBySupplierNote = req.Note;
        po.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return BaseResponse<bool>.Ok(true, "PO acknowledged");
    }
}

public class RejectPOBySupplierHandler(ApplicationDbContext db, ICurrentUser currentUser)
    : IRequestHandler<RejectPOBySupplierCommand, BaseResponse<bool>>
{
    public async Task<BaseResponse<bool>> Handle(RejectPOBySupplierCommand req, CancellationToken ct)
    {
        var po = await db.PurchaseOrders.FindAsync([req.Id], ct);
        if (po == null) return BaseResponse<bool>.Fail("Not found");
        if (po.SupplierId != currentUser.SupplierId) return BaseResponse<bool>.Fail("Unauthorized");
        po.Status = POStatus.Cancelled;
        po.RejectionReason = req.Reason;
        po.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return BaseResponse<bool>.Ok(true, "PO rejected");
    }
}
