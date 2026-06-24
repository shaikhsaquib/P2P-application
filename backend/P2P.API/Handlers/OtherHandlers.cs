using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using P2P.Application.Common;
using P2P.Application.Features.ASN.Commands;
using P2P.Application.Features.ASN.Queries;
using P2P.Application.Features.Dashboard.Queries;
using P2P.Application.Features.Disputes.Commands;
using P2P.Application.Features.Disputes.Queries;
using P2P.Application.Features.Notifications.Queries;
using P2P.Application.Features.RFQ.Commands;
using P2P.Application.Features.RFQ.Queries;
using P2P.Application.Features.Suppliers.Queries;
using P2P.Application.Features.SupplierQuotes.Commands;
using P2P.Application.Features.SupplierQuotes.Queries;
using P2P.Application.Interfaces;
using P2P.Domain.Entities;
using P2P.Domain.Enums;
using P2P.Infrastructure.Data;

namespace P2P.API.Handlers;

// RFQ Handlers
public class CreateRFQHandler(ApplicationDbContext db, ICurrentUser currentUser, INumberGenerator numGen, IMapper mapper)
    : IRequestHandler<CreateRFQCommand, BaseResponse<string>>
{
    public async Task<BaseResponse<string>> Handle(CreateRFQCommand req, CancellationToken ct)
    {
        var rfq = new RFQ
        {
            RFQNumber = await numGen.GenerateRFQNumberAsync(ct),
            RequisitionId = req.RequisitionId, Title = req.Title, Description = req.Description,
            SubmissionDeadline = req.SubmissionDeadline, CreatedById = currentUser.UserId,
            Lines = req.Lines.Select(l => new RFQLine { ItemCode = l.ItemCode, Description = l.Description, Quantity = l.Quantity, Unit = l.Unit, Category = l.Category }).ToList(),
            Suppliers = req.SupplierIds.Select(id => new RFQSupplier { SupplierId = id }).ToList()
        };
        db.RFQs.Add(rfq);
        await db.SaveChangesAsync(ct);
        return BaseResponse<string>.Ok(rfq.Id, "RFQ created");
    }
}

public class GetAllRFQsHandler(ApplicationDbContext db, ICurrentUser currentUser, IMapper mapper)
    : IRequestHandler<GetAllRFQsQuery, BaseResponse<PagedResult<RFQDto>>>
{
    public async Task<BaseResponse<PagedResult<RFQDto>>> Handle(GetAllRFQsQuery req, CancellationToken ct)
    {
        var query = db.RFQs.Include(r => r.CreatedBy).Include(r => r.Lines).Include(r => r.Suppliers).ThenInclude(rs => rs.Supplier).Include(r => r.Quotes).AsQueryable();
        if (currentUser.IsSupplier)
            query = query.Where(r => r.Suppliers.Any(s => s.SupplierId == currentUser.SupplierId));
        if (req.Status.HasValue) query = query.Where(r => r.Status == req.Status.Value);
        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(r => r.CreatedAt).Skip((req.Page - 1) * req.PageSize).Take(req.PageSize).ToListAsync(ct);
        return BaseResponse<PagedResult<RFQDto>>.Ok(new PagedResult<RFQDto> { Items = mapper.Map<List<RFQDto>>(items), TotalCount = total, Page = req.Page, PageSize = req.PageSize });
    }
}

public class GetRFQByIdHandler(ApplicationDbContext db, IMapper mapper)
    : IRequestHandler<GetRFQByIdQuery, BaseResponse<RFQDto>>
{
    public async Task<BaseResponse<RFQDto>> Handle(GetRFQByIdQuery req, CancellationToken ct)
    {
        var rfq = await db.RFQs.Include(r => r.CreatedBy).Include(r => r.Lines).Include(r => r.Suppliers).ThenInclude(rs => rs.Supplier)
            .FirstOrDefaultAsync(r => r.Id == req.Id, ct);
        if (rfq == null) return BaseResponse<RFQDto>.Fail("RFQ not found");
        return BaseResponse<RFQDto>.Ok(mapper.Map<RFQDto>(rfq));
    }
}

public class SendRFQHandler(ApplicationDbContext db, IEmailService emailService)
    : IRequestHandler<SendRFQCommand, BaseResponse<bool>>
{
    public async Task<BaseResponse<bool>> Handle(SendRFQCommand req, CancellationToken ct)
    {
        var rfq = await db.RFQs.Include(r => r.Suppliers).ThenInclude(rs => rs.Supplier).FirstOrDefaultAsync(r => r.Id == req.Id, ct);
        if (rfq == null) return BaseResponse<bool>.Fail("Not found");
        rfq.Status = RFQStatus.Sent;
        rfq.UpdatedAt = DateTime.UtcNow;
        foreach (var rs in rfq.Suppliers)
            await emailService.SendAsync(rs.Supplier.Email, $"RFQ {rfq.RFQNumber}: Request for Quotation",
                $"<h2>Request for Quotation</h2><p>RFQ: {rfq.RFQNumber}</p><p>Deadline: {rfq.SubmissionDeadline:d}</p>", ct);
        await db.SaveChangesAsync(ct);
        return BaseResponse<bool>.Ok(true, "RFQ sent to suppliers");
    }
}

// Quote Handlers
public class SubmitQuoteHandler(ApplicationDbContext db, ICurrentUser currentUser, INumberGenerator numGen)
    : IRequestHandler<SubmitQuoteCommand, BaseResponse<string>>
{
    public async Task<BaseResponse<string>> Handle(SubmitQuoteCommand req, CancellationToken ct)
    {
        if (!currentUser.IsSupplier) return BaseResponse<string>.Fail("Only suppliers can submit quotes");
        var quote = new SupplierQuote
        {
            QuoteNumber = await numGen.GenerateQuoteNumberAsync(ct),
            RFQId = req.RFQId, SupplierId = currentUser.SupplierId!,
            ValidityDate = req.ValidityDate, LeadTimeDays = req.LeadTimeDays,
            PaymentTerms = req.PaymentTerms, Notes = req.Notes,
            Lines = req.Lines.Select(l => new QuoteLineItem { RFQLineId = l.RFQLineId, UnitPrice = l.UnitPrice, Quantity = l.Quantity, TotalPrice = l.UnitPrice * l.Quantity, Notes = l.Notes }).ToList()
        };
        quote.TotalAmount = quote.Lines.Sum(l => l.TotalPrice);

        var rfqSupplier = await db.RFQSuppliers.FirstOrDefaultAsync(rs => rs.RFQId == req.RFQId && rs.SupplierId == currentUser.SupplierId, ct);
        if (rfqSupplier != null) rfqSupplier.Responded = true;

        db.SupplierQuotes.Add(quote);
        await db.SaveChangesAsync(ct);
        return BaseResponse<string>.Ok(quote.Id, "Quote submitted");
    }
}

public class GetQuotesByRFQHandler(ApplicationDbContext db, IMapper mapper)
    : IRequestHandler<GetQuotesByRFQQuery, BaseResponse<List<QuoteDto>>>
{
    public async Task<BaseResponse<List<QuoteDto>>> Handle(GetQuotesByRFQQuery req, CancellationToken ct)
    {
        var quotes = await db.SupplierQuotes.Include(q => q.Supplier).Include(q => q.Lines).Where(q => q.RFQId == req.RFQId).ToListAsync(ct);
        return BaseResponse<List<QuoteDto>>.Ok(mapper.Map<List<QuoteDto>>(quotes));
    }
}

public class GetQuoteByIdHandler(ApplicationDbContext db, IMapper mapper)
    : IRequestHandler<GetQuoteByIdQuery, BaseResponse<QuoteDto>>
{
    public async Task<BaseResponse<QuoteDto>> Handle(GetQuoteByIdQuery req, CancellationToken ct)
    {
        var q = await db.SupplierQuotes.Include(q => q.Supplier).Include(q => q.Lines).FirstOrDefaultAsync(q => q.Id == req.Id, ct);
        if (q == null) return BaseResponse<QuoteDto>.Fail("Not found");
        return BaseResponse<QuoteDto>.Ok(mapper.Map<QuoteDto>(q));
    }
}

public class EvaluateQuotesHandler(ApplicationDbContext db, ICurrentUser currentUser, INumberGenerator numGen)
    : IRequestHandler<EvaluateQuotesCommand, BaseResponse<bool>>
{
    public async Task<BaseResponse<bool>> Handle(EvaluateQuotesCommand req, CancellationToken ct)
    {
        var rfq = await db.RFQs.Include(r => r.Quotes).FirstOrDefaultAsync(r => r.Id == req.RFQId, ct);
        if (rfq == null) return BaseResponse<bool>.Fail("RFQ not found");

        foreach (var q in rfq.Quotes)
            q.Status = q.Id == req.WinningQuoteId ? QuoteStatus.Accepted : QuoteStatus.Rejected;
        rfq.Status = RFQStatus.Evaluated;
        rfq.UpdatedAt = DateTime.UtcNow;

        // Create PO from winning quote
        var winningQuote = await db.SupplierQuotes.Include(q => q.Lines).ThenInclude(l => l.RFQLine)
            .FirstOrDefaultAsync(q => q.Id == req.WinningQuoteId, ct);
        if (winningQuote != null)
        {
            var po = new PurchaseOrder
            {
                PONumber = await numGen.GeneratePONumberAsync(ct),
                RFQId = rfq.Id, QuoteId = winningQuote.Id,
                SupplierId = winningQuote.SupplierId, CreatedById = currentUser.UserId,
                PaymentTerms = winningQuote.PaymentTerms,
                Lines = winningQuote.Lines.Select(l => new POLine
                {
                    ItemCode = l.RFQLine.ItemCode, Description = l.RFQLine.Description,
                    Quantity = l.Quantity, Unit = l.RFQLine.Unit,
                    UnitPrice = l.UnitPrice, TotalPrice = l.TotalPrice
                }).ToList()
            };
            po.TotalAmount = po.Lines.Sum(l => l.TotalPrice);
            db.PurchaseOrders.Add(po);
        }

        await db.SaveChangesAsync(ct);
        return BaseResponse<bool>.Ok(true, "Quote evaluated and PO created");
    }
}

// ASN Handlers
public class CreateASNHandler(ApplicationDbContext db, ICurrentUser currentUser, INumberGenerator numGen)
    : IRequestHandler<CreateASNCommand, BaseResponse<string>>
{
    public async Task<BaseResponse<string>> Handle(CreateASNCommand req, CancellationToken ct)
    {
        var po = await db.PurchaseOrders.FindAsync([req.POId], ct);
        if (po == null) return BaseResponse<string>.Fail("PO not found");

        var asn = new AdvanceShipmentNotice
        {
            ASNNumber = await numGen.GenerateASNNumberAsync(ct),
            POId = req.POId, SupplierId = currentUser.SupplierId ?? po.SupplierId,
            EstimatedDeliveryDate = req.EstimatedDeliveryDate,
            TrackingNumber = req.TrackingNumber, CourierName = req.CourierName, Notes = req.Notes,
            Lines = req.Lines.Select(l => new ASNLine { POLineId = l.POLineId, ShippedQuantity = l.ShippedQuantity, BatchNumber = l.BatchNumber, SerialNumber = l.SerialNumber }).ToList()
        };
        db.AdvanceShipmentNotices.Add(asn);
        await db.SaveChangesAsync(ct);
        return BaseResponse<string>.Ok(asn.Id, "ASN created");
    }
}

public class GetASNsBySupplierHandler(ApplicationDbContext db, IMapper mapper, ICurrentUser currentUser)
    : IRequestHandler<GetASNsBySupplierQuery, BaseResponse<PagedResult<ASNDto>>>
{
    public async Task<BaseResponse<PagedResult<ASNDto>>> Handle(GetASNsBySupplierQuery req, CancellationToken ct)
    {
        var supplierId = currentUser.IsSupplier ? currentUser.SupplierId : req.SupplierId;
        var query = db.AdvanceShipmentNotices.Include(a => a.Supplier).Include(a => a.PurchaseOrder)
            .Include(a => a.Lines).Include(a => a.Documents).AsQueryable();
        if (!string.IsNullOrEmpty(supplierId))
            query = query.Where(a => a.SupplierId == supplierId);
        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(a => a.CreatedAt)
            .Skip((req.Page - 1) * req.PageSize).Take(req.PageSize).ToListAsync(ct);
        return BaseResponse<PagedResult<ASNDto>>.Ok(new PagedResult<ASNDto>
        {
            Items = mapper.Map<List<ASNDto>>(items), TotalCount = total, Page = req.Page, PageSize = req.PageSize
        });
    }
}

public class GetASNsByPOHandler(ApplicationDbContext db, IMapper mapper)
    : IRequestHandler<GetASNsByPOQuery, BaseResponse<List<ASNDto>>>
{
    public async Task<BaseResponse<List<ASNDto>>> Handle(GetASNsByPOQuery req, CancellationToken ct)
    {
        var asns = await db.AdvanceShipmentNotices.Include(a => a.Supplier).Include(a => a.PurchaseOrder)
            .Include(a => a.Lines).Include(a => a.Documents).Where(a => a.POId == req.POId).ToListAsync(ct);
        return BaseResponse<List<ASNDto>>.Ok(mapper.Map<List<ASNDto>>(asns));
    }
}

public class GetASNByIdHandler(ApplicationDbContext db, IMapper mapper)
    : IRequestHandler<GetASNByIdQuery, BaseResponse<ASNDto>>
{
    public async Task<BaseResponse<ASNDto>> Handle(GetASNByIdQuery req, CancellationToken ct)
    {
        var asn = await db.AdvanceShipmentNotices.Include(a => a.Supplier).Include(a => a.PurchaseOrder)
            .Include(a => a.Lines).Include(a => a.Documents).FirstOrDefaultAsync(a => a.Id == req.Id, ct);
        if (asn == null) return BaseResponse<ASNDto>.Fail("Not found");
        return BaseResponse<ASNDto>.Ok(mapper.Map<ASNDto>(asn));
    }
}

// Dispute Handlers
public class CreateDisputeHandler(ApplicationDbContext db, ICurrentUser currentUser, INumberGenerator numGen)
    : IRequestHandler<CreateDisputeCommand, BaseResponse<string>>
{
    public async Task<BaseResponse<string>> Handle(CreateDisputeCommand req, CancellationToken ct)
    {
        var dispute = new Dispute
        {
            DisputeNumber = await numGen.GenerateDisputeNumberAsync(ct),
            InvoiceId = req.InvoiceId, RaisedById = currentUser.UserId,
            Subject = req.Subject, Description = req.Description
        };
        db.Disputes.Add(dispute);
        var invoice = await db.Invoices.FindAsync([req.InvoiceId], ct);
        if (invoice != null) { invoice.Status = InvoiceStatus.Disputed; invoice.UpdatedAt = DateTime.UtcNow; }
        await db.SaveChangesAsync(ct);
        return BaseResponse<string>.Ok(dispute.Id, "Dispute raised");
    }
}

public class GetAllDisputesHandler(ApplicationDbContext db, ICurrentUser currentUser, IMapper mapper)
    : IRequestHandler<GetAllDisputesQuery, BaseResponse<PagedResult<DisputeDto>>>
{
    public async Task<BaseResponse<PagedResult<DisputeDto>>> Handle(GetAllDisputesQuery req, CancellationToken ct)
    {
        var query = db.Disputes.Include(d => d.RaisedBy).Include(d => d.Messages).ThenInclude(m => m.Sender).AsQueryable();
        if (req.Status.HasValue) query = query.Where(d => d.Status == req.Status.Value);
        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(d => d.CreatedAt).Skip((req.Page - 1) * req.PageSize).Take(req.PageSize).ToListAsync(ct);
        return BaseResponse<PagedResult<DisputeDto>>.Ok(new PagedResult<DisputeDto> { Items = mapper.Map<List<DisputeDto>>(items), TotalCount = total, Page = req.Page, PageSize = req.PageSize });
    }
}

public class GetDisputeByIdHandler(ApplicationDbContext db, IMapper mapper)
    : IRequestHandler<GetDisputeByIdQuery, BaseResponse<DisputeDto>>
{
    public async Task<BaseResponse<DisputeDto>> Handle(GetDisputeByIdQuery req, CancellationToken ct)
    {
        var d = await db.Disputes.Include(d => d.RaisedBy).Include(d => d.Messages).ThenInclude(m => m.Sender)
            .FirstOrDefaultAsync(d => d.Id == req.Id, ct);
        if (d == null) return BaseResponse<DisputeDto>.Fail("Not found");
        return BaseResponse<DisputeDto>.Ok(mapper.Map<DisputeDto>(d));
    }
}

public class AddDisputeMessageHandler(ApplicationDbContext db, ICurrentUser currentUser)
    : IRequestHandler<AddDisputeMessageCommand, BaseResponse<bool>>
{
    public async Task<BaseResponse<bool>> Handle(AddDisputeMessageCommand req, CancellationToken ct)
    {
        var msg = new DisputeMessage { DisputeId = req.DisputeId, SenderId = currentUser.UserId, Message = req.Message, AttachmentUrl = req.AttachmentUrl };
        db.DisputeMessages.Add(msg);
        await db.SaveChangesAsync(ct);
        return BaseResponse<bool>.Ok(true);
    }
}

public class ResolveDisputeHandler(ApplicationDbContext db)
    : IRequestHandler<ResolveDisputeCommand, BaseResponse<bool>>
{
    public async Task<BaseResponse<bool>> Handle(ResolveDisputeCommand req, CancellationToken ct)
    {
        var d = await db.Disputes.FindAsync([req.DisputeId], ct);
        if (d == null) return BaseResponse<bool>.Fail("Not found");
        d.Status = DisputeStatus.Resolved;
        d.Resolution = req.Resolution;
        d.ResolvedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return BaseResponse<bool>.Ok(true, "Dispute resolved");
    }
}

// Dashboard Handlers
public class GetBuyerDashboardHandler(ApplicationDbContext db)
    : IRequestHandler<GetBuyerDashboardQuery, BaseResponse<BuyerDashboardDto>>
{
    public async Task<BaseResponse<BuyerDashboardDto>> Handle(GetBuyerDashboardQuery req, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1);
        var startOfYear = new DateTime(now.Year, 1, 1);

        var spendMonth = (decimal)await db.Invoices.Where(i => i.Status == InvoiceStatus.Paid && i.PaidAt >= startOfMonth).SumAsync(i => (double)i.TotalAmount, ct);
        var spendYear = (decimal)await db.Invoices.Where(i => i.Status == InvoiceStatus.Paid && i.PaidAt >= startOfYear).SumAsync(i => (double)i.TotalAmount, ct);

        var dto = new BuyerDashboardDto
        {
            TotalRequisitions = await db.Requisitions.CountAsync(ct),
            PendingApprovals = await db.Requisitions.CountAsync(r => r.Status == RequisitionStatus.Submitted, ct),
            ActivePOs = await db.PurchaseOrders.CountAsync(p => p.Status != POStatus.Closed && p.Status != POStatus.Cancelled, ct),
            PendingGRs = await db.GoodsReceipts.CountAsync(g => g.Status == GRStatus.Submitted, ct),
            PendingInvoices = await db.Invoices.CountAsync(i => i.Status == InvoiceStatus.Submitted || i.Status == InvoiceStatus.UnderReview, ct),
            PendingSupplierApprovals = await db.Suppliers.CountAsync(s => !s.IsApproved && s.IsActive, ct),
            TotalSpendThisMonth = spendMonth,
            TotalSpendThisYear = spendYear
        };

        var spendByDept = await db.Requisitions
            .Where(r => r.Status == RequisitionStatus.Converted)
            .GroupBy(r => r.Department)
            .Select(g => new { Department = g.Key, Amount = g.Sum(r => (double)r.TotalAmount) })
            .ToListAsync(ct);
        dto.SpendByDepartment = spendByDept.Select(g => new SpendByDepartmentDto { Department = g.Department, Amount = (decimal)g.Amount }).ToList();

        dto.PendingApprovalItems = await db.Requisitions
            .Where(r => r.Status == RequisitionStatus.Submitted)
            .Include(r => r.Requester)
            .OrderByDescending(r => r.CreatedAt).Take(10)
            .Select(r => new PendingApprovalDto
            {
                Type = "Requisition", Number = r.PRNumber, Title = r.Title,
                Amount = r.TotalAmount, RequestedBy = r.Requester.FullName,
                CreatedAt = r.CreatedAt, EntityId = r.Id
            }).ToListAsync(ct);

        return BaseResponse<BuyerDashboardDto>.Ok(dto);
    }
}

public class GetSupplierDashboardQueryHandler(ApplicationDbContext db, ICurrentUser currentUser)
    : IRequestHandler<GetSupplierDashboardQuery, BaseResponse<SupplierDashboardDto>>
{
    public async Task<BaseResponse<SupplierDashboardDto>> Handle(GetSupplierDashboardQuery req, CancellationToken ct)
    {
        var supplierId = req.SupplierId ?? currentUser.SupplierId;
        if (string.IsNullOrEmpty(supplierId)) return BaseResponse<SupplierDashboardDto>.Fail("Supplier ID required");

        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1);
        var startOfYear = new DateTime(now.Year, 1, 1);

        var billedMonth = (decimal)await db.Invoices.Where(i => i.SupplierId == supplierId && i.CreatedAt >= startOfMonth).SumAsync(i => (double)i.TotalAmount, ct);
        var paidYear = (decimal)await db.Invoices.Where(i => i.SupplierId == supplierId && i.Status == InvoiceStatus.Paid && i.PaidAt >= startOfYear).SumAsync(i => (double)i.TotalAmount, ct);
        var overdue = (decimal)await db.Invoices.Where(i => i.SupplierId == supplierId && i.Status == InvoiceStatus.Approved && i.DueDate < now).SumAsync(i => (double)i.TotalAmount, ct);

        var dto = new SupplierDashboardDto
        {
            ActivePOs = await db.PurchaseOrders.CountAsync(p => p.SupplierId == supplierId && p.Status != POStatus.Closed && p.Status != POStatus.Cancelled, ct),
            PendingInvoices = await db.Invoices.CountAsync(i => i.SupplierId == supplierId && (i.Status == InvoiceStatus.Submitted || i.Status == InvoiceStatus.UnderReview), ct),
            OpenRFQs = await db.RFQs.CountAsync(r => r.Suppliers.Any(s => s.SupplierId == supplierId) && r.Status == RFQStatus.Sent, ct),
            OpenDisputes = await db.Disputes.CountAsync(d => d.Invoice.SupplierId == supplierId && d.Status == DisputeStatus.Open, ct),
            TotalBilledThisMonth = billedMonth,
            TotalPaidThisYear = paidYear,
            OverdueAmount = overdue
        };

        return BaseResponse<SupplierDashboardDto>.Ok(dto);
    }
}

// Notification Handlers
public class GetUserNotificationsHandler(ApplicationDbContext db, ICurrentUser currentUser, IMapper mapper)
    : IRequestHandler<GetUserNotificationsQuery, BaseResponse<PagedResult<NotificationDto>>>
{
    public async Task<BaseResponse<PagedResult<NotificationDto>>> Handle(GetUserNotificationsQuery req, CancellationToken ct)
    {
        var query = db.Notifications.Where(n => n.UserId == currentUser.UserId).AsQueryable();
        if (req.UnreadOnly == true) query = query.Where(n => !n.IsRead);
        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(n => n.CreatedAt).Skip((req.Page - 1) * req.PageSize).Take(req.PageSize).ToListAsync(ct);
        return BaseResponse<PagedResult<NotificationDto>>.Ok(new PagedResult<NotificationDto> { Items = mapper.Map<List<NotificationDto>>(items), TotalCount = total, Page = req.Page, PageSize = req.PageSize });
    }
}

public class GetUnreadCountHandler(ApplicationDbContext db, ICurrentUser currentUser)
    : IRequestHandler<GetUnreadCountQuery, BaseResponse<int>>
{
    public async Task<BaseResponse<int>> Handle(GetUnreadCountQuery req, CancellationToken ct)
    {
        var count = await db.Notifications.CountAsync(n => n.UserId == currentUser.UserId && !n.IsRead, ct);
        return BaseResponse<int>.Ok(count);
    }
}

public class MarkNotificationsReadHandler(ApplicationDbContext db, ICurrentUser currentUser)
    : IRequestHandler<MarkNotificationsReadCommand, BaseResponse<bool>>
{
    public async Task<BaseResponse<bool>> Handle(MarkNotificationsReadCommand req, CancellationToken ct)
    {
        var query = db.Notifications.Where(n => n.UserId == currentUser.UserId && !n.IsRead);
        if (req.Ids != null && req.Ids.Count > 0) query = query.Where(n => req.Ids.Contains(n.Id));
        await query.ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true), ct);
        return BaseResponse<bool>.Ok(true);
    }
}
