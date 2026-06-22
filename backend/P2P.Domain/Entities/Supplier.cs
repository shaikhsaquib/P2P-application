namespace P2P.Domain.Entities;

public class Supplier
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string SupplierCode { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string ContactPerson { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string Country { get; set; } = "India";
    public string PostalCode { get; set; } = string.Empty;
    public string? GSTNumber { get; set; }
    public string? PANNumber { get; set; }
    public string? BankAccountNumber { get; set; }
    public string? BankName { get; set; }
    public string? IFSCCode { get; set; }
    public string? SWIFTCode { get; set; }
    public bool IsApproved { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? ApprovedAt { get; set; }
    public string? ApprovedById { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User? ApprovedBy { get; set; }
    public ICollection<SupplierDocument> Documents { get; set; } = [];
    public ICollection<User> Users { get; set; } = [];
    public ICollection<PurchaseOrder> PurchaseOrders { get; set; } = [];
    public ICollection<Invoice> Invoices { get; set; } = [];
    public ICollection<RFQSupplier> RFQSuppliers { get; set; } = [];
    public ICollection<SupplierQuote> Quotes { get; set; } = [];
}
