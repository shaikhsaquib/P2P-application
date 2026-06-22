using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using P2P.Application.Features.Requisitions.Commands;
using P2P.Application.Features.Requisitions.Queries;
using P2P.Domain.Enums;

namespace P2P.API.Controllers;

[ApiController, Route("api/requisitions"), Authorize]
public class RequisitionsController(IMediator mediator) : ControllerBase
{
    [HttpGet] public async Task<IActionResult> GetAll([FromQuery] GetAllRequisitionsQuery query, CancellationToken ct) => Ok(await mediator.Send(query, ct));
    [HttpGet("{id}")] public async Task<IActionResult> GetById(string id, CancellationToken ct) => Ok(await mediator.Send(new GetRequisitionByIdQuery(id), ct));
    [HttpPost] public async Task<IActionResult> Create([FromBody] CreateRequisitionCommand cmd, CancellationToken ct) => Ok(await mediator.Send(cmd, ct));
    [HttpPost("{id}/submit")] public async Task<IActionResult> Submit(string id, CancellationToken ct) => Ok(await mediator.Send(new SubmitRequisitionCommand(id), ct));
    [HttpPost("{id}/approve"), Authorize(Roles = "Admin,Approver")] public async Task<IActionResult> Approve(string id, [FromBody] ApproveBody body, CancellationToken ct) => Ok(await mediator.Send(new ApproveRequisitionCommand(id, body.Notes), ct));
    [HttpPost("{id}/reject"), Authorize(Roles = "Admin,Approver")] public async Task<IActionResult> Reject(string id, [FromBody] RejectBody body, CancellationToken ct) => Ok(await mediator.Send(new RejectRequisitionCommand(id, body.Reason), ct));
    [HttpPost("{id}/convert-to-po"), Authorize(Roles = "Admin,Approver")] public async Task<IActionResult> ConvertToPO(string id, [FromBody] ConvertToPOBody body, CancellationToken ct) => Ok(await mediator.Send(new ConvertRequisitionToPOCommand(id, body.SupplierId), ct));
}

public record ApproveBody(string? Notes);
public record RejectBody(string Reason);
public record ConvertToPOBody(string SupplierId);
