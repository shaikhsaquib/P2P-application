using P2P.Domain.Enums;

namespace P2P.Domain.Entities;

public class Invoice
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string InvoiceNumber { get; set; } = string.Empty;
    public string? VendorInvoiceNumber { get; set; }
    public string POId { get; set; } = string.Empty;
    public string SupplierId { get; set; } = string.Empty;
    public string? GRId { get; set; }
    public InvoiceStatus Status { get; set; } = InvoiceStatus.Draft;
    public DateTime InvoiceDate { get; set; }
    public DateTime? DueDate { get; set; }
    public decimal SubTotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public MatchStatus MatchStatus { get; set; } = MatchStatus.Pending;
    public string? MatchNotes { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public string? ReviewedById { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime? PaidAt { get; set; }
    public string? PaymentReference { get; set; }
    public string? BlobUrl { get; set; }
    public string? DisputeReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public PurchaseOrder PurchaseOrder { get; set; } = null!;
    public Supplier Supplier { get; set; } = null!;
    public GoodsReceipt? GoodsReceipt { get; set; }
    public User? ReviewedBy { get; set; }
    public ICollection<InvoiceLine> Lines { get; set; } = [];
    public ICollection<Dispute> Disputes { get; set; } = [];
}

public class InvoiceLine
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string InvoiceId { get; set; } = string.Empty;
    public string POLineId { get; set; } = string.Empty;
    public string? GRLineId { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
    public decimal TaxRate { get; set; }
    public decimal TaxAmount { get; set; }

    public Invoice Invoice { get; set; } = null!;
    public POLine POLine { get; set; } = null!;
}
