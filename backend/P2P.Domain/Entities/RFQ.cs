using P2P.Domain.Enums;

namespace P2P.Domain.Entities;

public class RFQ
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string RFQNumber { get; set; } = string.Empty;
    public string? RequisitionId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime SubmissionDeadline { get; set; }
    public RFQStatus Status { get; set; } = RFQStatus.Draft;
    public string CreatedById { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Requisition? Requisition { get; set; }
    public User CreatedBy { get; set; } = null!;
    public ICollection<RFQLine> Lines { get; set; } = [];
    public ICollection<RFQSupplier> Suppliers { get; set; } = [];
    public ICollection<SupplierQuote> Quotes { get; set; } = [];
}

public class RFQLine
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string RFQId { get; set; } = string.Empty;
    public string? RequisitionLineId { get; set; }
    public string ItemCode { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = string.Empty;
    public string? Category { get; set; }

    public RFQ RFQ { get; set; } = null!;
}

public class RFQSupplier
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string RFQId { get; set; } = string.Empty;
    public string SupplierId { get; set; } = string.Empty;
    public DateTime InvitedAt { get; set; } = DateTime.UtcNow;
    public bool Responded { get; set; }

    public RFQ RFQ { get; set; } = null!;
    public Supplier Supplier { get; set; } = null!;
}
