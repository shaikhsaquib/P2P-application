using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using P2P.Application.Common;
using P2P.Application.Features.GoodsReceipts.Commands;
using P2P.Application.Features.GoodsReceipts.Queries;
using P2P.Application.Interfaces;
using P2P.Domain.Entities;
using P2P.Domain.Enums;
using P2P.Infrastructure.Data;

namespace P2P.API.Handlers;

public class CreateGRHandler(ApplicationDbContext db, ICurrentUser currentUser, INumberGenerator numGen)
    : IRequestHandler<CreateGRCommand, BaseResponse<string>>
{
    public async Task<BaseResponse<string>> Handle(CreateGRCommand req, CancellationToken ct)
    {
        var gr = new GoodsReceipt
        {
            GRNumber = await numGen.GenerateGRNumberAsync(ct),
            POId = req.POId, ASNId = req.ASNId,
            ReceivedDate = req.ReceivedDate, ReceivedById = currentUser.UserId,
            Notes = req.Notes,
            Lines = req.Lines.Select(l => new GRLine
            {
                POLineId = l.POLineId, ASNLineId = l.ASNLineId,
                QuantityReceived = l.QuantityReceived, QuantityAccepted = l.QuantityAccepted,
                QuantityRejected = l.QuantityRejected, RejectionReason = l.RejectionReason,
                BatchNumber = l.BatchNumber
            }).ToList()
        };

        // Update PO line received quantities
        foreach (var grLine in gr.Lines)
        {
            var poLine = await db.POLines.FindAsync([grLine.POLineId], ct);
            if (poLine != null) poLine.ReceivedQuantity += grLine.QuantityAccepted;
        }

        // Check if PO is fully or partially received
        var po = await db.PurchaseOrders.Include(p => p.Lines).FirstOrDefaultAsync(p => p.Id == req.POId, ct);
        if (po != null)
        {
            var allReceived = po.Lines.All(l => l.ReceivedQuantity >= l.Quantity);
            po.Status = allReceived ? POStatus.FullyReceived : POStatus.PartiallyReceived;
            po.UpdatedAt = DateTime.UtcNow;
        }

        db.GoodsReceipts.Add(gr);
        await db.SaveChangesAsync(ct);
        return BaseResponse<string>.Ok(gr.Id, "Goods Receipt created");
    }
}

public class GetAllGRsHandler(ApplicationDbContext db, IMapper mapper)
    : IRequestHandler<GetAllGRsQuery, BaseResponse<PagedResult<GRDto>>>
{
    public async Task<BaseResponse<PagedResult<GRDto>>> Handle(GetAllGRsQuery req, CancellationToken ct)
    {
        var query = db.GoodsReceipts.Include(g => g.PurchaseOrder).Include(g => g.ReceivedBy).Include(g => g.Lines).AsQueryable();
        if (req.Status.HasValue) query = query.Where(g => g.Status == req.Status.Value);
        if (!string.IsNullOrEmpty(req.POId)) query = query.Where(g => g.POId == req.POId);
        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(g => g.CreatedAt).Skip((req.Page - 1) * req.PageSize).Take(req.PageSize).ToListAsync(ct);
        return BaseResponse<PagedResult<GRDto>>.Ok(new PagedResult<GRDto> { Items = mapper.Map<List<GRDto>>(items), TotalCount = total, Page = req.Page, PageSize = req.PageSize });
    }
}

public class GetGRByIdHandler(ApplicationDbContext db, IMapper mapper)
    : IRequestHandler<GetGRByIdQuery, BaseResponse<GRDto>>
{
    public async Task<BaseResponse<GRDto>> Handle(GetGRByIdQuery req, CancellationToken ct)
    {
        var gr = await db.GoodsReceipts.Include(g => g.PurchaseOrder).Include(g => g.ReceivedBy).Include(g => g.Lines)
            .FirstOrDefaultAsync(g => g.Id == req.Id, ct);
        if (gr == null) return BaseResponse<GRDto>.Fail("GR not found");
        return BaseResponse<GRDto>.Ok(mapper.Map<GRDto>(gr));
    }
}

public class SubmitGRHandler(ApplicationDbContext db)
    : IRequestHandler<SubmitGRCommand, BaseResponse<bool>>
{
    public async Task<BaseResponse<bool>> Handle(SubmitGRCommand req, CancellationToken ct)
    {
        var gr = await db.GoodsReceipts.FindAsync([req.Id], ct);
        if (gr == null) return BaseResponse<bool>.Fail("Not found");
        gr.Status = GRStatus.Submitted;
        await db.SaveChangesAsync(ct);
        return BaseResponse<bool>.Ok(true);
    }
}

public class VerifyGRHandler(ApplicationDbContext db, ICurrentUser currentUser)
    : IRequestHandler<VerifyGRCommand, BaseResponse<bool>>
{
    public async Task<BaseResponse<bool>> Handle(VerifyGRCommand req, CancellationToken ct)
    {
        var gr = await db.GoodsReceipts.FindAsync([req.Id], ct);
        if (gr == null) return BaseResponse<bool>.Fail("Not found");
        gr.Status = GRStatus.Verified;
        gr.VerifiedById = currentUser.UserId;
        gr.VerifiedAt = DateTime.UtcNow;
        gr.Notes = req.Notes ?? gr.Notes;
        await db.SaveChangesAsync(ct);
        return BaseResponse<bool>.Ok(true, "GR verified");
    }
}
