using Microsoft.EntityFrameworkCore;
using P2P.Application.Interfaces;
using P2P.Infrastructure.Data;

namespace P2P.Infrastructure.Services;

public class NumberGeneratorService(ApplicationDbContext context) : INumberGenerator
{
    public async Task<string> GeneratePRNumberAsync(CancellationToken ct = default)
    {
        var year = DateTime.UtcNow.Year;
        var count = await context.Requisitions.CountAsync(ct) + 1;
        return $"PR-{year}-{count:D4}";
    }

    public async Task<string> GeneratePONumberAsync(CancellationToken ct = default)
    {
        var year = DateTime.UtcNow.Year;
        var count = await context.PurchaseOrders.CountAsync(ct) + 1;
        return $"PO-{year}-{count:D4}";
    }

    public async Task<string> GenerateGRNumberAsync(CancellationToken ct = default)
    {
        var year = DateTime.UtcNow.Year;
        var count = await context.GoodsReceipts.CountAsync(ct) + 1;
        return $"GR-{year}-{count:D4}";
    }

    public async Task<string> GenerateInvoiceNumberAsync(CancellationToken ct = default)
    {
        var year = DateTime.UtcNow.Year;
        var count = await context.Invoices.CountAsync(ct) + 1;
        return $"INV-{year}-{count:D4}";
    }

    public async Task<string> GenerateRFQNumberAsync(CancellationToken ct = default)
    {
        var year = DateTime.UtcNow.Year;
        var count = await context.RFQs.CountAsync(ct) + 1;
        return $"RFQ-{year}-{count:D4}";
    }

    public async Task<string> GenerateQuoteNumberAsync(CancellationToken ct = default)
    {
        var year = DateTime.UtcNow.Year;
        var count = await context.SupplierQuotes.CountAsync(ct) + 1;
        return $"QT-{year}-{count:D4}";
    }

    public async Task<string> GenerateASNNumberAsync(CancellationToken ct = default)
    {
        var year = DateTime.UtcNow.Year;
        var count = await context.AdvanceShipmentNotices.CountAsync(ct) + 1;
        return $"ASN-{year}-{count:D4}";
    }

    public async Task<string> GenerateDisputeNumberAsync(CancellationToken ct = default)
    {
        var year = DateTime.UtcNow.Year;
        var count = await context.Disputes.CountAsync(ct) + 1;
        return $"DIS-{year}-{count:D4}";
    }

    public async Task<string> GenerateSupplierCodeAsync(CancellationToken ct = default)
    {
        var count = await context.Suppliers.CountAsync(ct) + 1;
        return $"S-{count:D4}";
    }
}
