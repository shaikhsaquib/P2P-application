using MediatR;
using P2P.Application.Common;

namespace P2P.Application.Features.Suppliers.Queries;

public record GetAllSuppliersQuery(int Page = 1, int PageSize = 20, string? Search = null, bool? IsApproved = null)
    : IRequest<BaseResponse<PagedResult<SupplierDto>>>;

public record GetSupplierByIdQuery(string Id) : IRequest<BaseResponse<SupplierDto>>;
public record GetPendingSuppliersQuery() : IRequest<BaseResponse<List<SupplierDto>>>;
public class SupplierDto
{
    public string Id { get; set; } = string.Empty;
    public string SupplierCode { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string ContactPerson { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string? GSTNumber { get; set; }
    public string? PANNumber { get; set; }
    public bool IsApproved { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public int DocumentCount { get; set; }
}

public class SupplierDocumentDto
{
    public string Id { get; set; } = string.Empty;
    public string DocumentType { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string BlobUrl { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public bool IsVerified { get; set; }
}

public class NotificationDto
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public string? RelatedEntityId { get; set; }
    public string? RelatedEntityType { get; set; }
    public DateTime CreatedAt { get; set; }
}
