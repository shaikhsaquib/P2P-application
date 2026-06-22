using MediatR;
using P2P.Application.Common;

namespace P2P.Application.Features.ASN.Queries;

public record GetASNsByPOQuery(string POId) : IRequest<BaseResponse<List<ASNDto>>>;
public record GetASNByIdQuery(string Id) : IRequest<BaseResponse<ASNDto>>;
public record GetASNsBySupplierQuery(string SupplierId, int Page = 1, int PageSize = 20) : IRequest<BaseResponse<PagedResult<ASNDto>>>;

public class ASNDto
{
    public string Id { get; set; } = string.Empty;
    public string ASNNumber { get; set; } = string.Empty;
    public string POId { get; set; } = string.Empty;
    public string PONumber { get; set; } = string.Empty;
    public string SupplierId { get; set; } = string.Empty;
    public string SupplierName { get; set; } = string.Empty;
    public DateTime EstimatedDeliveryDate { get; set; }
    public DateTime? ActualDeliveryDate { get; set; }
    public string? TrackingNumber { get; set; }
    public string? CourierName { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<ASNLineDto> Lines { get; set; } = [];
    public List<ASNDocumentDto> Documents { get; set; } = [];
}

public class ASNLineDto
{
    public string Id { get; set; } = string.Empty;
    public string POLineId { get; set; } = string.Empty;
    public decimal ShippedQuantity { get; set; }
    public string? BatchNumber { get; set; }
    public string? SerialNumber { get; set; }
}

public class ASNDocumentDto
{
    public string Id { get; set; } = string.Empty;
    public string DocumentType { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string BlobUrl { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; }
}
