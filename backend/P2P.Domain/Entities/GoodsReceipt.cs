using P2P.Domain.Enums;

namespace P2P.Domain.Entities;

public class GoodsReceipt
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string GRNumber { get; set; } = string.Empty;
    public string POId { get; set; } = string.Empty;
    public string? ASNId { get; set; }
    public GRStatus Status { get; set; } = GRStatus.Draft;
    public DateTime ReceivedDate { get; set; }
    public string ReceivedById { get; set; } = string.Empty;
    public string? VerifiedById { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public PurchaseOrder PurchaseOrder { get; set; } = null!;
    public AdvanceShipmentNotice? ASN { get; set; }
    public User ReceivedBy { get; set; } = null!;
    public User? VerifiedBy { get; set; }
    public ICollection<GRLine> Lines { get; set; } = [];
}

public class GRLine
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string GRId { get; set; } = string.Empty;
    public string POLineId { get; set; } = string.Empty;
    public string? ASNLineId { get; set; }
    public decimal QuantityReceived { get; set; }
    public decimal QuantityAccepted { get; set; }
    public decimal QuantityRejected { get; set; }
    public string? RejectionReason { get; set; }
    public string? BatchNumber { get; set; }

    public GoodsReceipt GoodsReceipt { get; set; } = null!;
    public POLine POLine { get; set; } = null!;
}
