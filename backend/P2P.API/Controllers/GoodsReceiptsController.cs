using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using P2P.Application.Features.GoodsReceipts.Commands;
using P2P.Application.Features.GoodsReceipts.Queries;

namespace P2P.API.Controllers;

[ApiController, Route("api/goods-receipts"), Authorize]
public class GoodsReceiptsController(IMediator mediator) : ControllerBase
{
    [HttpGet] public async Task<IActionResult> GetAll([FromQuery] GetAllGRsQuery query, CancellationToken ct) => Ok(await mediator.Send(query, ct));
    [HttpGet("{id}")] public async Task<IActionResult> GetById(string id, CancellationToken ct) => Ok(await mediator.Send(new GetGRByIdQuery(id), ct));
    [HttpPost] public async Task<IActionResult> Create([FromBody] CreateGRCommand cmd, CancellationToken ct) => Ok(await mediator.Send(cmd, ct));
    [HttpPost("{id}/submit")] public async Task<IActionResult> Submit(string id, CancellationToken ct) => Ok(await mediator.Send(new SubmitGRCommand(id), ct));
    [HttpPost("{id}/verify"), Authorize(Roles = "Admin,Approver")] public async Task<IActionResult> Verify(string id, [FromBody] VerifyBody body, CancellationToken ct) => Ok(await mediator.Send(new VerifyGRCommand(id, body.Notes), ct));
}

public record VerifyBody(string? Notes);
