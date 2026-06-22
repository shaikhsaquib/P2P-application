using Microsoft.AspNetCore.Http;
using P2P.Application.Interfaces;
using P2P.Domain.Enums;
using System.Security.Claims;

namespace P2P.Infrastructure.Services;

public class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUser
{
    private ClaimsPrincipal? User => httpContextAccessor.HttpContext?.User;

    public string UserId => User?.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
    public string UserName => User?.FindFirstValue(ClaimTypes.Name) ?? string.Empty;
    public string Email => User?.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
    public UserRole Role => Enum.TryParse<UserRole>(User?.FindFirstValue(ClaimTypes.Role), out var role) ? role : UserRole.Requester;
    public string? SupplierId => User?.FindFirstValue("supplier_id");
    public bool IsSupplier => Role is UserRole.SupplierAdmin or UserRole.SupplierUser;
    public string? IPAddress => httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString();
}
