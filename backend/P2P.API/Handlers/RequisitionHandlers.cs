using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using P2P.Application.Common;
using P2P.Application.Features.Requisitions.Commands;
using P2P.Application.Features.Requisitions.Queries;
using P2P.Application.Interfaces;
using P2P.Domain.Entities;
using P2P.Domain.Enums;
using P2P.Infrastructure.Data;

namespace P2P.API.Handlers;

public class CreateRequisitionHandler(ApplicationDbContext db, ICurrentUser currentUser, INumberGenerator numGen, IMapper mapper)
    : IRequestHandler<CreateRequisitionCommand, BaseResponse<string>>
{
    public async Task<BaseResponse<string>> Handle(CreateRequisitionCommand req, CancellationToken ct)
    {
        var pr = new Requisition
        {
            PRNumber = await numGen.GeneratePRNumberAsync(ct),
            Title = req.Title,
            Description = req.Description,
            Department = req.Department,
            RequesterId = currentUser.UserId,
            RequiredDate = req.RequiredDate,
            Notes = req.Notes,
            Lines = req.Lines.Select(l => new RequisitionLine
            {
                ItemCode = l.ItemCode, Description = l.Description,
                Quantity = l.Quantity, Unit = l.Unit, UnitPrice = l.UnitPrice,
                TotalPrice = l.Quantity * l.UnitPrice, Category = l.Category
            }).ToList()
        };
        pr.TotalAmount = pr.Lines.Sum(l => l.TotalPrice);

        db.Requisitions.Add(pr);
        await db.SaveChangesAsync(ct);
        return BaseResponse<string>.Ok(pr.Id, "Requisition created");
    }
}

public class GetAllRequisitionsHandler(ApplicationDbContext db, ICurrentUser currentUser, IMapper mapper)
    : IRequestHandler<GetAllRequisitionsQuery, BaseResponse<PagedResult<RequisitionDto>>>
{
    public async Task<BaseResponse<PagedResult<RequisitionDto>>> Handle(GetAllRequisitionsQuery req, CancellationToken ct)
    {
        var query = db.Requisitions.Include(r => r.Requester).Include(r => r.Approver).Include(r => r.Lines).AsQueryable();

        if (currentUser.Role == UserRole.Requester)
            query = query.Where(r => r.RequesterId == currentUser.UserId);
        if (req.Status.HasValue) query = query.Where(r => r.Status == req.Status.Value);
        if (!string.IsNullOrEmpty(req.Search))
            query = query.Where(r => r.Title.Contains(req.Search) || r.PRNumber.Contains(req.Search));

        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(r => r.CreatedAt)
            .Skip((req.Page - 1) * req.PageSize).Take(req.PageSize).ToListAsync(ct);

        return BaseResponse<PagedResult<RequisitionDto>>.Ok(new PagedResult<RequisitionDto>
        {
            Items = mapper.Map<List<RequisitionDto>>(items),
            TotalCount = total, Page = req.Page, PageSize = req.PageSize
        });
    }
}

public class GetRequisitionByIdHandler(ApplicationDbContext db, IMapper mapper)
    : IRequestHandler<GetRequisitionByIdQuery, BaseResponse<RequisitionDto>>
{
    public async Task<BaseResponse<RequisitionDto>> Handle(GetRequisitionByIdQuery req, CancellationToken ct)
    {
        var pr = await db.Requisitions.Include(r => r.Requester).Include(r => r.Approver).Include(r => r.Lines)
            .FirstOrDefaultAsync(r => r.Id == req.Id, ct);
        if (pr == null) return BaseResponse<RequisitionDto>.Fail("Requisition not found");
        return BaseResponse<RequisitionDto>.Ok(mapper.Map<RequisitionDto>(pr));
    }
}

public class SubmitRequisitionHandler(ApplicationDbContext db, ICurrentUser currentUser)
    : IRequestHandler<SubmitRequisitionCommand, BaseResponse<bool>>
{
    public async Task<BaseResponse<bool>> Handle(SubmitRequisitionCommand req, CancellationToken ct)
    {
        var pr = await db.Requisitions.FindAsync([req.Id], ct);
        if (pr == null) return BaseResponse<bool>.Fail("Not found");
        if (pr.RequesterId != currentUser.UserId) return BaseResponse<bool>.Fail("Unauthorized");
        if (pr.Status != RequisitionStatus.Draft) return BaseResponse<bool>.Fail("Only draft can be submitted");
        pr.Status = RequisitionStatus.Submitted;
        pr.SubmittedAt = DateTime.UtcNow;
        pr.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return BaseResponse<bool>.Ok(true, "Submitted for approval");
    }
}

public class ApproveRequisitionHandler(ApplicationDbContext db, ICurrentUser currentUser)
    : IRequestHandler<ApproveRequisitionCommand, BaseResponse<bool>>
{
    public async Task<BaseResponse<bool>> Handle(ApproveRequisitionCommand req, CancellationToken ct)
    {
        var pr = await db.Requisitions.FindAsync([req.Id], ct);
        if (pr == null) return BaseResponse<bool>.Fail("Not found");
        if (pr.Status != RequisitionStatus.Submitted) return BaseResponse<bool>.Fail("Only submitted PRs can be approved");
        pr.Status = RequisitionStatus.Approved;
        pr.ApprovedAt = DateTime.UtcNow;
        pr.ApprovedById = currentUser.UserId;
        pr.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return BaseResponse<bool>.Ok(true, "Requisition approved");
    }
}

public class RejectRequisitionHandler(ApplicationDbContext db, ICurrentUser currentUser)
    : IRequestHandler<RejectRequisitionCommand, BaseResponse<bool>>
{
    public async Task<BaseResponse<bool>> Handle(RejectRequisitionCommand req, CancellationToken ct)
    {
        var pr = await db.Requisitions.FindAsync([req.Id], ct);
        if (pr == null) return BaseResponse<bool>.Fail("Not found");
        pr.Status = RequisitionStatus.Rejected;
        pr.RejectionReason = req.Reason;
        pr.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return BaseResponse<bool>.Ok(true, "Requisition rejected");
    }
}

public class ConvertRequisitionToPOHandler(ApplicationDbContext db, ICurrentUser currentUser, INumberGenerator numGen)
    : IRequestHandler<ConvertRequisitionToPOCommand, BaseResponse<string>>
{
    public async Task<BaseResponse<string>> Handle(ConvertRequisitionToPOCommand req, CancellationToken ct)
    {
        var pr = await db.Requisitions.Include(r => r.Lines).FirstOrDefaultAsync(r => r.Id == req.Id, ct);
        if (pr == null) return BaseResponse<string>.Fail("Not found");
        if (pr.Status != RequisitionStatus.Approved) return BaseResponse<string>.Fail("Only approved PRs can be converted");

        var po = new PurchaseOrder
        {
            PONumber = await numGen.GeneratePONumberAsync(ct),
            RequisitionId = pr.Id,
            SupplierId = req.SupplierId,
            CreatedById = currentUser.UserId,
            Lines = pr.Lines.Select(l => new POLine
            {
                RequisitionLineId = l.Id, ItemCode = l.ItemCode,
                Description = l.Description, Quantity = l.Quantity,
                Unit = l.Unit, UnitPrice = l.UnitPrice, TotalPrice = l.TotalPrice
            }).ToList()
        };
        po.TotalAmount = po.Lines.Sum(l => l.TotalPrice);
        pr.Status = RequisitionStatus.Converted;
        pr.UpdatedAt = DateTime.UtcNow;

        db.PurchaseOrders.Add(po);
        await db.SaveChangesAsync(ct);
        return BaseResponse<string>.Ok(po.Id, "PO created from PR");
    }
}
