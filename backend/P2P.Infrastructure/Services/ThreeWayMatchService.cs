using Microsoft.EntityFrameworkCore;
using P2P.Application.Features.Invoices.Commands;
using P2P.Domain.Entities;
using P2P.Domain.Enums;
using P2P.Infrastructure.Data;

namespace P2P.Infrastructure.Services;

public class ThreeWayMatchService(ApplicationDbContext context)
{
    private const decimal PriceTolerance = 0.02m; // 2%

    public async Task<(MatchStatus status, string notes, MatchResultDto result)> MatchAsync(
        string invoiceId, CancellationToken ct = default)
    {
        var invoice = await context.Invoices
            .Include(i => i.Lines).ThenInclude(l => l.POLine)
            .Include(i => i.GoodsReceipt).ThenInclude(gr => gr!.Lines)
            .FirstOrDefaultAsync(i => i.Id == invoiceId, ct)
            ?? throw new Exception("Invoice not found");

        // Find GR by direct link or by POId (pick the latest verified/submitted GR)
        var grLines = invoice.GoodsReceipt?.Lines;
        if (grLines == null)
        {
            var gr = await context.GoodsReceipts
                .Include(g => g.Lines)
                .Where(g => g.POId == invoice.POId && (g.Status == GRStatus.Verified || g.Status == GRStatus.Submitted))
                .OrderByDescending(g => g.CreatedAt)
                .FirstOrDefaultAsync(ct);
            grLines = gr?.Lines;
        }

        var lineResults = new List<LineMatchDto>();
        var overallStatus = MatchStatus.Matched;
        var notes = new List<string>();

        foreach (var invLine in invoice.Lines)
        {
            var poLine = invLine.POLine;
            decimal grQty = 0;

            if (grLines != null)
            {
                var grLine = grLines.FirstOrDefault(l => l.POLineId == poLine.Id);
                grQty = grLine?.QuantityAccepted ?? 0;
            }

            // If no GR exists at all, flag as mismatch (can't approve without GR)
            var qtyMatch = grLines != null ? invLine.Quantity <= grQty : false;
            var priceDiff = Math.Abs(invLine.UnitPrice - poLine.UnitPrice) / poLine.UnitPrice;
            var priceMatch = priceDiff <= PriceTolerance;

            lineResults.Add(new LineMatchDto
            {
                POLineId = poLine.Id,
                Description = invLine.Description,
                POQty = poLine.Quantity,
                GRQty = grQty,
                InvoiceQty = invLine.Quantity,
                POUnitPrice = poLine.UnitPrice,
                InvoiceUnitPrice = invLine.UnitPrice,
                QtyMatch = qtyMatch,
                PriceMatch = priceMatch
            });

            if (!qtyMatch && !priceMatch)
            {
                overallStatus = MatchStatus.MultiMismatch;
                notes.Add($"Line {poLine.ItemCode}: Qty and Price mismatch");
            }
            else if (!qtyMatch)
            {
                if (overallStatus == MatchStatus.Matched) overallStatus = MatchStatus.QtyMismatch;
                notes.Add($"Line {poLine.ItemCode}: Qty mismatch (GR:{grQty} vs Inv:{invLine.Quantity})");
            }
            else if (!priceMatch)
            {
                if (overallStatus == MatchStatus.Matched) overallStatus = MatchStatus.PriceMismatch;
                notes.Add($"Line {poLine.ItemCode}: Price mismatch (PO:{poLine.UnitPrice} vs Inv:{invLine.UnitPrice}, diff:{priceDiff:P})");
            }
        }

        var resultDto = new MatchResultDto
        {
            InvoiceId = invoiceId,
            MatchStatus = overallStatus.ToString(),
            Notes = string.Join("; ", notes),
            LineResults = lineResults
        };

        return (overallStatus, string.Join("; ", notes), resultDto);
    }
}
