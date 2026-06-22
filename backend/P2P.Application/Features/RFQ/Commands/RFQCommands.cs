using MediatR;
using P2P.Application.Common;

namespace P2P.Application.Features.RFQ.Commands;

public record CreateRFQLineDto(string ItemCode, string Description, decimal Quantity, string Unit, string? Category);

public record CreateRFQCommand(
    string? RequisitionId, string Title, string? Description,
    DateTime SubmissionDeadline, List<CreateRFQLineDto> Lines, List<string> SupplierIds
) : IRequest<BaseResponse<string>>;

public record SendRFQCommand(string Id) : IRequest<BaseResponse<bool>>;
public record EvaluateQuotesCommand(string RFQId, string WinningQuoteId) : IRequest<BaseResponse<bool>>;
public record CloseRFQCommand(string Id) : IRequest<BaseResponse<bool>>;
