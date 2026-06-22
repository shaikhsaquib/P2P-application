namespace P2P.Domain.Entities;

public class SupplierDocument
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string SupplierId { get; set; } = string.Empty;
    public string DocumentType { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string BlobUrl { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiryDate { get; set; }
    public bool IsVerified { get; set; }

    public Supplier Supplier { get; set; } = null!;
}
