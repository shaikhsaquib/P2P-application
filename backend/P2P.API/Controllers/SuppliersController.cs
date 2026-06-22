using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using P2P.Application.Features.Suppliers.Commands;
using P2P.Application.Features.Suppliers.Queries;

namespace P2P.API.Controllers;

[ApiController, Route("api/suppliers")]
public class SuppliersController(IMediator mediator) : ControllerBase
{
    [HttpPost("register")] public async Task<IActionResult> Register([FromBody] RegisterSupplierCommand cmd, CancellationToken ct) => Ok(await mediator.Send(cmd, ct));

    [HttpGet, Authorize] public async Task<IActionResult> GetAll([FromQuery] GetAllSuppliersQuery query, CancellationToken ct) => Ok(await mediator.Send(query, ct));
    [HttpGet("{id}"), Authorize] public async Task<IActionResult> GetById(string id, CancellationToken ct) => Ok(await mediator.Send(new GetSupplierByIdQuery(id), ct));
    [HttpGet("pending"), Authorize(Roles = "Admin")] public async Task<IActionResult> GetPending(CancellationToken ct) => Ok(await mediator.Send(new GetPendingSuppliersQuery(), ct));
    [HttpPost("{id}/approve"), Authorize(Roles = "Admin")] public async Task<IActionResult> Approve(string id, CancellationToken ct) => Ok(await mediator.Send(new ApproveSupplierCommand(id), ct));
    [HttpPost("{id}/reject"), Authorize(Roles = "Admin")] public async Task<IActionResult> Reject(string id, [FromBody] RejectSupplierBody body, CancellationToken ct) => Ok(await mediator.Send(new RejectSupplierCommand(id, body.Reason), ct));
}

public record RejectSupplierBody(string Reason);
