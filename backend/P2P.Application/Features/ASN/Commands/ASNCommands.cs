using MediatR;
using P2P.Application.Common;
using P2P.Domain.Enums;

namespace P2P.Application.Features.ASN.Commands;

public record CreateASNLineDto(string POLineId, decimal ShippedQuantity, string? BatchNumber, string? SerialNumber);

public record CreateASNCommand(
    string POId, DateTime EstimatedDeliveryDate,
    string? TrackingNumber, string? CourierName, string? Notes,
    List<CreateASNLineDto> Lines
) : IRequest<BaseResponse<string>>;

public record UpdateASNStatusCommand(string Id, ASNStatus Status) : IRequest<BaseResponse<bool>>;
