using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using P2P.Application.Features.ASN.Commands;
using P2P.Application.Features.ASN.Queries;
using P2P.Application.Features.Dashboard.Queries;
using P2P.Application.Features.Disputes.Commands;
using P2P.Application.Features.Disputes.Queries;
using P2P.Application.Features.Notifications.Queries;

namespace P2P.API.Controllers;

[ApiController, Route("api/asn"), Authorize]
public class ASNController(IMediator mediator) : ControllerBase
{
    [HttpGet("{id}")] public async Task<IActionResult> GetById(string id, CancellationToken ct) => Ok(await mediator.Send(new GetASNByIdQuery(id), ct));
    [HttpGet("by-po/{poId}")] public async Task<IActionResult> GetByPO(string poId, CancellationToken ct) => Ok(await mediator.Send(new GetASNsByPOQuery(poId), ct));
    [HttpPost, Authorize(Roles = "SupplierAdmin,SupplierUser")] public async Task<IActionResult> Create([FromBody] CreateASNCommand cmd, CancellationToken ct) => Ok(await mediator.Send(cmd, ct));
    [HttpPost("{id}/status")] public async Task<IActionResult> UpdateStatus(string id, [FromBody] UpdateASNStatusCommand cmd, CancellationToken ct) => Ok(await mediator.Send(cmd with { Id = id }, ct));
}

[ApiController, Route("api/disputes"), Authorize]
public class DisputesController(IMediator mediator) : ControllerBase
{
    [HttpGet] public async Task<IActionResult> GetAll([FromQuery] GetAllDisputesQuery query, CancellationToken ct) => Ok(await mediator.Send(query, ct));
    [HttpGet("{id}")] public async Task<IActionResult> GetById(string id, CancellationToken ct) => Ok(await mediator.Send(new GetDisputeByIdQuery(id), ct));
    [HttpPost] public async Task<IActionResult> Create([FromBody] CreateDisputeCommand cmd, CancellationToken ct) => Ok(await mediator.Send(cmd, ct));
    [HttpPost("{id}/message")] public async Task<IActionResult> AddMessage(string id, [FromBody] AddMessageBody body, CancellationToken ct) => Ok(await mediator.Send(new AddDisputeMessageCommand(id, body.Message, body.AttachmentUrl), ct));
    [HttpPost("{id}/resolve"), Authorize(Roles = "Admin,Finance")] public async Task<IActionResult> Resolve(string id, [FromBody] ResolveBody body, CancellationToken ct) => Ok(await mediator.Send(new ResolveDisputeCommand(id, body.Resolution), ct));
}

[ApiController, Route("api/dashboard"), Authorize]
public class DashboardController(IMediator mediator) : ControllerBase
{
    [HttpGet("buyer")] public async Task<IActionResult> BuyerDashboard(CancellationToken ct) => Ok(await mediator.Send(new GetBuyerDashboardQuery(), ct));
    [HttpGet("supplier/{supplierId}")] public async Task<IActionResult> SupplierDashboard(string supplierId, CancellationToken ct) => Ok(await mediator.Send(new GetSupplierDashboardQuery(supplierId), ct));
}

[ApiController, Route("api/notifications"), Authorize]
public class NotificationsController(IMediator mediator) : ControllerBase
{
    [HttpGet] public async Task<IActionResult> GetAll([FromQuery] GetUserNotificationsQuery query, CancellationToken ct) => Ok(await mediator.Send(query, ct));
    [HttpGet("unread-count")] public async Task<IActionResult> UnreadCount(CancellationToken ct) => Ok(await mediator.Send(new GetUnreadCountQuery(), ct));
    [HttpPost("mark-read")] public async Task<IActionResult> MarkRead([FromBody] MarkNotificationsReadCommand cmd, CancellationToken ct) => Ok(await mediator.Send(cmd, ct));
}

public record AddMessageBody(string Message, string? AttachmentUrl);
public record ResolveBody(string Resolution);
