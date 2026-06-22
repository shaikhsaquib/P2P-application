using MediatR;
using P2P.Application.Common;

namespace P2P.Application.Features.GoodsReceipts.Commands;

public record CreateGRLineDto(
    string POLineId, string? ASNLineId,
    decimal QuantityReceived, decimal QuantityAccepted, decimal QuantityRejected,
    string? RejectionReason, string? BatchNumber);

public record CreateGRCommand(
    string POId, string? ASNId, DateTime ReceivedDate, string? Notes,
    List<CreateGRLineDto> Lines
) : IRequest<BaseResponse<string>>;

public record SubmitGRCommand(string Id) : IRequest<BaseResponse<bool>>;
public record VerifyGRCommand(string Id, string? Notes) : IRequest<BaseResponse<bool>>;
public record RejectGRCommand(string Id, string Reason) : IRequest<BaseResponse<bool>>;
