using MediatR;
using P2P.Application.Common;
using P2P.Domain.Enums;

namespace P2P.Application.Features.RFQ.Queries;

public record GetAllRFQsQuery(int Page = 1, int PageSize = 20, RFQStatus? Status = null, string? SupplierId = null)
    : IRequest<BaseResponse<PagedResult<RFQDto>>>;

public record GetRFQByIdQuery(string Id) : IRequest<BaseResponse<RFQDto>>;

public class RFQDto
{
    public string Id { get; set; } = string.Empty;
    public string RFQNumber { get; set; } = string.Empty;
    public string? RequisitionId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime SubmissionDeadline { get; set; }
    public string Status { get; set; } = string.Empty;
    public string CreatedByName { get; set; } = string.Empty;
    public int SupplierCount { get; set; }
    public int QuoteCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<RFQLineDto> Lines { get; set; } = [];
    public List<RFQSupplierDto> Suppliers { get; set; } = [];
}

public class RFQLineDto
{
    public string Id { get; set; } = string.Empty;
    public string ItemCode { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = string.Empty;
    public string? Category { get; set; }
}

public class RFQSupplierDto
{
    public string Id { get; set; } = string.Empty;
    public string SupplierId { get; set; } = string.Empty;
    public string SupplierName { get; set; } = string.Empty;
    public bool Responded { get; set; }
}
