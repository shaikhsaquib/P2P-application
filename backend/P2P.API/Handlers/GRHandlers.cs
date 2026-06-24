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
        // --- Quantity validation: GR received <= PO ordered (and <= ASN shipped if ASN-linked) ---
        var poLineIds = req.Lines.Select(l => l.POLineId).ToList();
        var poLines = await db.POLines.Where(pl => poLineIds.Contains(pl.Id)).ToDictionaryAsync(pl => pl.Id, ct);

        // Cumulative received per PO line across existing GRs (sum in memory — SQLite cannot Sum decimals)
        var existingGrLines = await db.GRLines
            .Where(gl => poLineIds.Contains(gl.POLineId))
            .Select(gl => new { gl.POLineId, gl.ASNLineId, gl.QuantityReceived })
            .ToListAsync(ct);
        var receivedByPoLine = existingGrLines
            .GroupBy(gl => gl.POLineId)
            .ToDictionary(g => g.Key, g => g.Sum(x => x.QuantityReceived));

        // ASN shipped quantities (if receiving against an ASN)
        Dictionary<string, decimal> shippedByAsnLine = new();
        Dictionary<string, decimal> receivedByAsnLine = new();
        if (!string.IsNullOrEmpty(req.ASNId))
        {
            var asn = await db.Set<AdvanceShipmentNotice>().Include(a => a.Lines)
                .FirstOrDefaultAsync(a => a.Id == req.ASNId, ct);
            if (asn == null) return BaseResponse<string>.Fail("Selected ASN not found");
            if (asn.POId != req.POId) return BaseResponse<string>.Fail("ASN does not belong to the selected PO");
            shippedByAsnLine = asn.Lines.ToDictionary(al => al.Id, al => al.ShippedQuantity);
            receivedByAsnLine = existingGrLines
                .Where(gl => gl.ASNLineId != null)
                .GroupBy(gl => gl.ASNLineId!)
                .ToDictionary(g => g.Key, g => g.Sum(x => x.QuantityReceived));
        }

        foreach (var l in req.Lines)
        {
            if (!poLines.TryGetValue(l.POLineId, out var poLine))
                return BaseResponse<string>.Fail("Invalid PO line in goods receipt.");

            if (l.QuantityAccepted + l.QuantityRejected > l.QuantityReceived)
                return BaseResponse<string>.Fail(
                    $"'{poLine.Description}': accepted ({l.QuantityAccepted}) + rejected ({l.QuantityRejected}) cannot exceed received ({l.QuantityReceived}).");

            var alreadyReceived = receivedByPoLine.TryGetValue(l.POLineId, out var r) ? r : 0;
            if (alreadyReceived + l.QuantityReceived > poLine.Quantity)
                return BaseResponse<string>.Fail(
                    $"'{poLine.Description}': cannot receive {l.QuantityReceived}. Ordered {poLine.Quantity}, already received {alreadyReceived}, only {poLine.Quantity - alreadyReceived} remaining.");

            if (!string.IsNullOrEmpty(req.ASNId) && l.ASNLineId != null)
            {
                var shipped = shippedByAsnLine.TryGetValue(l.ASNLineId, out var s) ? s : 0;
                var asnReceived = receivedByAsnLine.TryGetValue(l.ASNLineId, out var ar) ? ar : 0;
                if (asnReceived + l.QuantityReceived > shipped)
                    return BaseResponse<string>.Fail(
                        $"'{poLine.Description}': cannot receive {l.QuantityReceived} against this shipment. Shipped {shipped}, already received {asnReceived}, only {shipped - asnReceived} remaining on the ASN.");
            }
        }

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
