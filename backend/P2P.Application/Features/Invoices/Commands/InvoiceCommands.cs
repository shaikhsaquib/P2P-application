using MediatR;
using P2P.Application.Common;

namespace P2P.Application.Features.Invoices.Commands;

public record SubmitInvoiceLineDto(
    string POLineId, string? GRLineId, string Description,
    decimal Quantity, decimal UnitPrice, decimal TaxRate);

public record SubmitInvoiceCommand(
    string POId, string? GRId, string? VendorInvoiceNumber,
    DateTime InvoiceDate, DateTime? DueDate, string? BlobUrl,
    List<SubmitInvoiceLineDto> Lines
) : IRequest<BaseResponse<string>>;

public record ApproveInvoiceCommand(string Id) : IRequest<BaseResponse<bool>>;
public record RejectInvoiceCommand(string Id, string Reason) : IRequest<BaseResponse<bool>>;
public record MarkInvoicePaidCommand(string Id, string PaymentReference) : IRequest<BaseResponse<bool>>;
public record SchedulePaymentCommand(string Id, DateTime PaymentDate) : IRequest<BaseResponse<bool>>;
public record RunThreeWayMatchCommand(string InvoiceId) : IRequest<BaseResponse<MatchResultDto>>;

public class MatchResultDto
{
    public string InvoiceId { get; set; } = string.Empty;
    public string MatchStatus { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public List<LineMatchDto> LineResults { get; set; } = [];
}

public class LineMatchDto
{
    public string POLineId { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal POQty { get; set; }
    public decimal GRQty { get; set; }
    public decimal InvoiceQty { get; set; }
    public decimal POUnitPrice { get; set; }
    public decimal InvoiceUnitPrice { get; set; }
    public bool QtyMatch { get; set; }
    public bool PriceMatch { get; set; }
}
