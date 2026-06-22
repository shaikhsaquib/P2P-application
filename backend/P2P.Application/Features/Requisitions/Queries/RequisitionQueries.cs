using MediatR;
using P2P.Application.Common;
using P2P.Domain.Enums;

namespace P2P.Application.Features.Requisitions.Queries;

public record GetAllRequisitionsQuery(
    int Page = 1, int PageSize = 20,
    RequisitionStatus? Status = null, string? Search = null,
    string? RequesterId = null
) : IRequest<BaseResponse<PagedResult<RequisitionDto>>>;

public record GetRequisitionByIdQuery(string Id) : IRequest<BaseResponse<RequisitionDto>>;

public class RequisitionDto
{
    public string Id { get; set; } = string.Empty;
    public string PRNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Department { get; set; } = string.Empty;
    public string RequesterId { get; set; } = string.Empty;
    public string RequesterName { get; set; } = string.Empty;
    public string? ApproverName { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public DateTime? RequiredDate { get; set; }
    public string? Notes { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<RequisitionLineDto> Lines { get; set; } = [];
}

public class RequisitionLineDto
{
    public string Id { get; set; } = string.Empty;
    public string ItemCode { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
    public string? Category { get; set; }
}
