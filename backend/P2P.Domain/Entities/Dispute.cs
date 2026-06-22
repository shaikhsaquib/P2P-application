using P2P.Domain.Enums;

namespace P2P.Domain.Entities;

public class Dispute
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string DisputeNumber { get; set; } = string.Empty;
    public string InvoiceId { get; set; } = string.Empty;
    public string RaisedById { get; set; } = string.Empty;
    public string? AssignedToId { get; set; }
    public DisputeStatus Status { get; set; } = DisputeStatus.Open;
    public string Subject { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? Resolution { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAt { get; set; }

    public Invoice Invoice { get; set; } = null!;
    public User RaisedBy { get; set; } = null!;
    public User? AssignedTo { get; set; }
    public ICollection<DisputeMessage> Messages { get; set; } = [];
}

public class DisputeMessage
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string DisputeId { get; set; } = string.Empty;
    public string SenderId { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? AttachmentUrl { get; set; }
    public DateTime SentAt { get; set; } = DateTime.UtcNow;

    public Dispute Dispute { get; set; } = null!;
    public User Sender { get; set; } = null!;
}
