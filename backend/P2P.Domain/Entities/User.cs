using Microsoft.AspNetCore.Identity;
using P2P.Domain.Enums;

namespace P2P.Domain.Entities;

public class User : IdentityUser
{
    public string FullName { get; set; } = string.Empty;
    public string? Department { get; set; }
    public UserRole Role { get; set; } = UserRole.Requester;
    public string? SupplierId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Supplier? Supplier { get; set; }
}
