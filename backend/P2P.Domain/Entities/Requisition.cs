using P2P.Domain.Enums;

namespace P2P.Domain.Entities;

public class Requisition
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string PRNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Department { get; set; } = string.Empty;
    public string RequesterId { get; set; } = string.Empty;
    public RequisitionStatus Status { get; set; } = RequisitionStatus.Draft;
    public decimal TotalAmount { get; set; }
    public DateTime? RequiredDate { get; set; }
    public string? Notes { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? ApprovedById { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User Requester { get; set; } = null!;
    public User? Approver { get; set; }
    public ICollection<RequisitionLine> Lines { get; set; } = [];
    public ICollection<PurchaseOrder> PurchaseOrders { get; set; } = [];
    public ICollection<RFQ> RFQs { get; set; } = [];
}

public class RequisitionLine
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string RequisitionId { get; set; } = string.Empty;
    public string ItemCode { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
    public string? Category { get; set; }

    public Requisition Requisition { get; set; } = null!;
}
