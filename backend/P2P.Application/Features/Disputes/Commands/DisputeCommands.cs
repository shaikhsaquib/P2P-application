using MediatR;
using P2P.Application.Common;

namespace P2P.Application.Features.Disputes.Commands;

public record CreateDisputeCommand(string InvoiceId, string Subject, string Description)
    : IRequest<BaseResponse<string>>;

public record AddDisputeMessageCommand(string DisputeId, string Message, string? AttachmentUrl)
    : IRequest<BaseResponse<bool>>;

public record ResolveDisputeCommand(string DisputeId, string Resolution) : IRequest<BaseResponse<bool>>;
public record CloseDisputeCommand(string DisputeId) : IRequest<BaseResponse<bool>>;
