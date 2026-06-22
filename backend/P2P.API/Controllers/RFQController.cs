using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using P2P.Application.Features.RFQ.Commands;
using P2P.Application.Features.RFQ.Queries;
using P2P.Application.Features.SupplierQuotes.Commands;
using P2P.Application.Features.SupplierQuotes.Queries;

namespace P2P.API.Controllers;

[ApiController, Route("api/rfq"), Authorize]
public class RFQController(IMediator mediator) : ControllerBase
{
    [HttpGet] public async Task<IActionResult> GetAll([FromQuery] GetAllRFQsQuery query, CancellationToken ct) => Ok(await mediator.Send(query, ct));
    [HttpGet("{id}")] public async Task<IActionResult> GetById(string id, CancellationToken ct) => Ok(await mediator.Send(new GetRFQByIdQuery(id), ct));
    [HttpPost] public async Task<IActionResult> Create([FromBody] CreateRFQCommand cmd, CancellationToken ct) => Ok(await mediator.Send(cmd, ct));
    [HttpPost("{id}/send")] public async Task<IActionResult> Send(string id, CancellationToken ct) => Ok(await mediator.Send(new SendRFQCommand(id), ct));
    [HttpPost("{id}/evaluate")] public async Task<IActionResult> Evaluate(string id, [FromBody] EvaluateBody body, CancellationToken ct) => Ok(await mediator.Send(new EvaluateQuotesCommand(id, body.WinningQuoteId), ct));
    [HttpGet("{rfqId}/quotes")] public async Task<IActionResult> GetQuotes(string rfqId, CancellationToken ct) => Ok(await mediator.Send(new GetQuotesByRFQQuery(rfqId), ct));
    [HttpPost("{rfqId}/quotes"), Authorize(Roles = "SupplierAdmin,SupplierUser")] public async Task<IActionResult> SubmitQuote(string rfqId, [FromBody] SubmitQuoteCommand cmd, CancellationToken ct) => Ok(await mediator.Send(cmd with { RFQId = rfqId }, ct));
}

public record EvaluateBody(string WinningQuoteId);
