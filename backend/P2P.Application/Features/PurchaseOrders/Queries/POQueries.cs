using MediatR;
using P2P.Application.Common;
using P2P.Domain.Enums;

namespace P2P.Application.Features.PurchaseOrders.Queries;

public record GetAllPOsQuery(
    int Page = 1, int PageSize = 20,
    POStatus? Status = null, string? SupplierId = null, string? Search = null
) : IRequest<BaseResponse<PagedResult<PODto>>>;

public record GetPOByIdQuery(string Id) : IRequest<BaseResponse<PODto>>;
public record GetPOsBySupplierQuery(string SupplierId, int Page = 1, int PageSize = 20, POStatus? Status = null)
    : IRequest<BaseResponse<PagedResult<PODto>>>;

public class PODto
{
    public string Id { get; set; } = string.Empty;
    public string PONumber { get; set; } = string.Empty;
    public string? RequisitionId { get; set; }
    public string SupplierId { get; set; } = string.Empty;
    public string SupplierName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime? DeliveryDate { get; set; }
    public string? PaymentTerms { get; set; }
    public string? ShippingAddress { get; set; }
    public string? Notes { get; set; }
    public decimal TotalAmount { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public string? ApproverName { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime? SentAt { get; set; }
    public DateTime? AcknowledgedAt { get; set; }
    public string? AcknowledgedBySupplierNote { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<POLineDto> Lines { get; set; } = [];
}

public class POLineDto
{
    public string Id { get; set; } = string.Empty;
    public string ItemCode { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
    public decimal ReceivedQuantity { get; set; }
}
