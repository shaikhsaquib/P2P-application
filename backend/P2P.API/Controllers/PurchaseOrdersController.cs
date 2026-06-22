using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using P2P.Application.Features.PurchaseOrders.Commands;
using P2P.Application.Features.PurchaseOrders.Queries;

namespace P2P.API.Controllers;

[ApiController, Route("api/purchase-orders"), Authorize]
public class PurchaseOrdersController(IMediator mediator) : ControllerBase
{
    [HttpGet] public async Task<IActionResult> GetAll([FromQuery] GetAllPOsQuery query, CancellationToken ct) => Ok(await mediator.Send(query, ct));
    [HttpGet("{id}")] public async Task<IActionResult> GetById(string id, CancellationToken ct) => Ok(await mediator.Send(new GetPOByIdQuery(id), ct));
    [HttpPost] public async Task<IActionResult> Create([FromBody] CreatePOCommand cmd, CancellationToken ct) => Ok(await mediator.Send(cmd, ct));
    [HttpPost("{id}/approve"), Authorize(Roles = "Admin,Approver")] public async Task<IActionResult> Approve(string id, CancellationToken ct) => Ok(await mediator.Send(new ApprovePOCommand(id), ct));
    [HttpPost("{id}/reject"), Authorize(Roles = "Admin,Approver")] public async Task<IActionResult> Reject(string id, [FromBody] RejectBody body, CancellationToken ct) => Ok(await mediator.Send(new RejectPOCommand(id, body.Reason), ct));
    [HttpPost("{id}/send"), Authorize(Roles = "Admin,Approver")] public async Task<IActionResult> Send(string id, CancellationToken ct) => Ok(await mediator.Send(new SendPOToSupplierCommand(id), ct));
    [HttpPost("{id}/acknowledge"), Authorize(Roles = "SupplierAdmin,SupplierUser")] public async Task<IActionResult> Acknowledge(string id, [FromBody] AcknowledgeBody body, CancellationToken ct) => Ok(await mediator.Send(new AcknowledgePOCommand(id, body.Note), ct));
    [HttpPost("{id}/reject-by-supplier"), Authorize(Roles = "SupplierAdmin,SupplierUser")] public async Task<IActionResult> RejectBySupplier(string id, [FromBody] RejectBody body, CancellationToken ct) => Ok(await mediator.Send(new RejectPOBySupplierCommand(id, body.Reason), ct));
}

public record AcknowledgeBody(string? Note);
