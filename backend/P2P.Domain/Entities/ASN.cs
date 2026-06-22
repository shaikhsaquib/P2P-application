using P2P.Domain.Enums;

namespace P2P.Domain.Entities;

public class AdvanceShipmentNotice
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ASNNumber { get; set; } = string.Empty;
    public string POId { get; set; } = string.Empty;
    public string SupplierId { get; set; } = string.Empty;
    public DateTime EstimatedDeliveryDate { get; set; }
    public DateTime? ActualDeliveryDate { get; set; }
    public string? TrackingNumber { get; set; }
    public string? CourierName { get; set; }
    public ASNStatus Status { get; set; } = ASNStatus.Created;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public PurchaseOrder PurchaseOrder { get; set; } = null!;
    public Supplier Supplier { get; set; } = null!;
    public ICollection<ASNLine> Lines { get; set; } = [];
    public ICollection<ASNDocument> Documents { get; set; } = [];
}

public class ASNLine
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ASNId { get; set; } = string.Empty;
    public string POLineId { get; set; } = string.Empty;
    public decimal ShippedQuantity { get; set; }
    public string? BatchNumber { get; set; }
    public string? SerialNumber { get; set; }

    public AdvanceShipmentNotice ASN { get; set; } = null!;
    public POLine POLine { get; set; } = null!;
}

public class ASNDocument
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ASNId { get; set; } = string.Empty;
    public string DocumentType { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string BlobUrl { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    public AdvanceShipmentNotice ASN { get; set; } = null!;
}
