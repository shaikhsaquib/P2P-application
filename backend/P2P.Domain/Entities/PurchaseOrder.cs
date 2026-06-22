using P2P.Domain.Enums;

namespace P2P.Domain.Entities;

public class PurchaseOrder
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string PONumber { get; set; } = string.Empty;
    public string? RequisitionId { get; set; }
    public string? RFQId { get; set; }
    public string? QuoteId { get; set; }
    public string SupplierId { get; set; } = string.Empty;
    public POStatus Status { get; set; } = POStatus.Draft;
    public DateTime? DeliveryDate { get; set; }
    public string? PaymentTerms { get; set; }
    public string? ShippingAddress { get; set; }
    public string? Notes { get; set; }
    public decimal TotalAmount { get; set; }
    public string? ApprovedById { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime? SentAt { get; set; }
    public DateTime? AcknowledgedAt { get; set; }
    public string? AcknowledgedBySupplierNote { get; set; }
    public string? RejectionReason { get; set; }
    public string CreatedById { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Requisition? Requisition { get; set; }
    public Supplier Supplier { get; set; } = null!;
    public User CreatedBy { get; set; } = null!;
    public User? ApprovedBy { get; set; }
    public ICollection<POLine> Lines { get; set; } = [];
    public ICollection<GoodsReceipt> GoodsReceipts { get; set; } = [];
    public ICollection<Invoice> Invoices { get; set; } = [];
    public ICollection<AdvanceShipmentNotice> ASNs { get; set; } = [];
}

public class POLine
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string POId { get; set; } = string.Empty;
    public string? RequisitionLineId { get; set; }
    public string ItemCode { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
    public decimal ReceivedQuantity { get; set; }

    public PurchaseOrder PurchaseOrder { get; set; } = null!;
}
