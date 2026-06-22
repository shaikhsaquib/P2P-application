using MediatR;
using P2P.Application.Common;
using P2P.Domain.Enums;

namespace P2P.Application.Features.Disputes.Queries;

public record GetAllDisputesQuery(int Page = 1, int PageSize = 20, DisputeStatus? Status = null)
    : IRequest<BaseResponse<PagedResult<DisputeDto>>>;

public record GetDisputeByIdQuery(string Id) : IRequest<BaseResponse<DisputeDto>>;

public class DisputeDto
{
    public string Id { get; set; } = string.Empty;
    public string DisputeNumber { get; set; } = string.Empty;
    public string InvoiceId { get; set; } = string.Empty;
    public string RaisedById { get; set; } = string.Empty;
    public string RaisedByName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? Resolution { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public List<DisputeMessageDto> Messages { get; set; } = [];
}

public class DisputeMessageDto
{
    public string Id { get; set; } = string.Empty;
    public string SenderId { get; set; } = string.Empty;
    public string SenderName { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? AttachmentUrl { get; set; }
    public DateTime SentAt { get; set; }
}
