using MediatR;
using P2P.Application.Common;

namespace P2P.Application.Features.Requisitions.Commands;

public record CreateRequisitionLineDto(
    string ItemCode, string Description, decimal Quantity,
    string Unit, decimal UnitPrice, string? Category);

public record CreateRequisitionCommand(
    string Title, string? Description, string Department,
    DateTime? RequiredDate, string? Notes,
    List<CreateRequisitionLineDto> Lines
) : IRequest<BaseResponse<string>>;

public record UpdateRequisitionCommand(
    string Id, string Title, string? Description,
    DateTime? RequiredDate, string? Notes,
    List<CreateRequisitionLineDto> Lines
) : IRequest<BaseResponse<bool>>;

public record SubmitRequisitionCommand(string Id) : IRequest<BaseResponse<bool>>;
public record ApproveRequisitionCommand(string Id, string? Notes) : IRequest<BaseResponse<bool>>;
public record RejectRequisitionCommand(string Id, string Reason) : IRequest<BaseResponse<bool>>;
public record ConvertRequisitionToPOCommand(string Id, string SupplierId) : IRequest<BaseResponse<string>>;
public record ConvertRequisitionToRFQCommand(string Id, DateTime SubmissionDeadline, List<string> SupplierIds) : IRequest<BaseResponse<string>>;
