using P2P.Domain.Enums;

namespace P2P.Domain.Entities;

public class SupplierQuote
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string QuoteNumber { get; set; } = string.Empty;
    public string RFQId { get; set; } = string.Empty;
    public string SupplierId { get; set; } = string.Empty;
    public DateTime ValidityDate { get; set; }
    public int LeadTimeDays { get; set; }
    public string? PaymentTerms { get; set; }
    public string? Notes { get; set; }
    public decimal TotalAmount { get; set; }
    public QuoteStatus Status { get; set; } = QuoteStatus.Submitted;
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public DateTime? EvaluatedAt { get; set; }

    public RFQ RFQ { get; set; } = null!;
    public Supplier Supplier { get; set; } = null!;
    public ICollection<QuoteLineItem> Lines { get; set; } = [];
}

public class QuoteLineItem
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string QuoteId { get; set; } = string.Empty;
    public string RFQLineId { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public decimal Quantity { get; set; }
    public decimal TotalPrice { get; set; }
    public string? Notes { get; set; }

    public SupplierQuote Quote { get; set; } = null!;
    public RFQLine RFQLine { get; set; } = null!;
}
