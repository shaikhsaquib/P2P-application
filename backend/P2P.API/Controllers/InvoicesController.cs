using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using P2P.Application.Features.Invoices.Commands;
using P2P.Application.Features.Invoices.Queries;

namespace P2P.API.Controllers;

[ApiController, Route("api/invoices"), Authorize]
public class InvoicesController(IMediator mediator) : ControllerBase
{
    [HttpGet] public async Task<IActionResult> GetAll([FromQuery] GetAllInvoicesQuery query, CancellationToken ct) => Ok(await mediator.Send(query, ct));
    [HttpGet("{id}")] public async Task<IActionResult> GetById(string id, CancellationToken ct) => Ok(await mediator.Send(new GetInvoiceByIdQuery(id), ct));
    [HttpPost, Authorize(Roles = "SupplierAdmin,SupplierUser")] public async Task<IActionResult> Submit([FromBody] SubmitInvoiceCommand cmd, CancellationToken ct) => Ok(await mediator.Send(cmd, ct));
    [HttpPost("{id}/approve"), Authorize(Roles = "Admin,Finance")] public async Task<IActionResult> Approve(string id, CancellationToken ct) => Ok(await mediator.Send(new ApproveInvoiceCommand(id), ct));
    [HttpPost("{id}/reject"), Authorize(Roles = "Admin,Finance")] public async Task<IActionResult> Reject(string id, [FromBody] RejectInvoiceBody body, CancellationToken ct) => Ok(await mediator.Send(new RejectInvoiceCommand(id, body.Reason), ct));
    [HttpPost("{id}/mark-paid"), Authorize(Roles = "Admin,Finance")] public async Task<IActionResult> MarkPaid(string id, [FromBody] MarkPaidBody body, CancellationToken ct) => Ok(await mediator.Send(new MarkInvoicePaidCommand(id, body.PaymentReference), ct));
    [HttpPost("{id}/match")] public async Task<IActionResult> RunMatch(string id, CancellationToken ct) => Ok(await mediator.Send(new RunThreeWayMatchCommand(id), ct));
}

public record RejectInvoiceBody(string Reason);
public record MarkPaidBody(string PaymentReference);
