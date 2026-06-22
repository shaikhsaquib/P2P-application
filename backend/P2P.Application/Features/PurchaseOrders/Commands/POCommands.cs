using MediatR;
using P2P.Application.Common;

namespace P2P.Application.Features.PurchaseOrders.Commands;

public record CreatePOLineDto(
    string? RequisitionLineId, string ItemCode, string Description,
    decimal Quantity, string Unit, decimal UnitPrice);

public record CreatePOCommand(
    string? RequisitionId, string? RFQId, string? QuoteId, string SupplierId,
    DateTime? DeliveryDate, string? PaymentTerms, string? ShippingAddress,
    string? Notes, List<CreatePOLineDto> Lines
) : IRequest<BaseResponse<string>>;

public record ApprovePOCommand(string Id) : IRequest<BaseResponse<bool>>;
public record RejectPOCommand(string Id, string Reason) : IRequest<BaseResponse<bool>>;
public record SendPOToSupplierCommand(string Id) : IRequest<BaseResponse<bool>>;
public record AcknowledgePOCommand(string Id, string? Note) : IRequest<BaseResponse<bool>>;
public record RejectPOBySupplierCommand(string Id, string Reason) : IRequest<BaseResponse<bool>>;
