using MediatR;
using P2P.Application.Common;
using P2P.Domain.Enums;

namespace P2P.Application.Features.GoodsReceipts.Queries;

public record GetAllGRsQuery(int Page = 1, int PageSize = 20, GRStatus? Status = null, string? POId = null)
    : IRequest<BaseResponse<PagedResult<GRDto>>>;
public record GetGRByIdQuery(string Id) : IRequest<BaseResponse<GRDto>>;

public class GRDto
{
    public string Id { get; set; } = string.Empty;
    public string GRNumber { get; set; } = string.Empty;
    public string POId { get; set; } = string.Empty;
    public string PONumber { get; set; } = string.Empty;
    public string? ASNId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime ReceivedDate { get; set; }
    public string ReceivedByName { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<GRLineDto> Lines { get; set; } = [];
}

public class GRLineDto
{
    public string Id { get; set; } = string.Empty;
    public string POLineId { get; set; } = string.Empty;
    public decimal QuantityReceived { get; set; }
    public decimal QuantityAccepted { get; set; }
    public decimal QuantityRejected { get; set; }
    public string? RejectionReason { get; set; }
    public string? BatchNumber { get; set; }
}
