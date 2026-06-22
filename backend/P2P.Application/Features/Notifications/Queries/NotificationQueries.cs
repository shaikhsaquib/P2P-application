using MediatR;
using P2P.Application.Common;
using P2P.Application.Features.Suppliers.Queries;

namespace P2P.Application.Features.Notifications.Queries;

public record GetUserNotificationsQuery(int Page = 1, int PageSize = 20, bool? UnreadOnly = null)
    : IRequest<BaseResponse<PagedResult<NotificationDto>>>;

public record MarkNotificationsReadCommand(List<string>? Ids = null) : IRequest<BaseResponse<bool>>;
public record GetUnreadCountQuery() : IRequest<BaseResponse<int>>;
