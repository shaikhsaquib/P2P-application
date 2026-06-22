using MediatR;
using P2P.Application.Common;
using P2P.Domain.Enums;

namespace P2P.Application.Features.Invoices.Queries;

public record GetAllInvoicesQuery(
    int Page = 1, int PageSize = 20,
    InvoiceStatus? Status = null, string? SupplierId = null, string? Search = null
) : IRequest<BaseResponse<PagedResult<InvoiceDto>>>;

public record GetInvoiceByIdQuery(string Id) : IRequest<BaseResponse<InvoiceDto>>;
public record GetInvoicesBySupplierQuery(string SupplierId, int Page = 1, int PageSize = 20, InvoiceStatus? Status = null)
    : IRequest<BaseResponse<PagedResult<InvoiceDto>>>;

public class InvoiceDto
{
    public string Id { get; set; } = string.Empty;
    public string InvoiceNumber { get; set; } = string.Empty;
    public string? VendorInvoiceNumber { get; set; }
    public string POId { get; set; } = string.Empty;
    public string PONumber { get; set; } = string.Empty;
    public string SupplierId { get; set; } = string.Empty;
    public string SupplierName { get; set; } = string.Empty;
    public string? GRId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime InvoiceDate { get; set; }
    public DateTime? DueDate { get; set; }
    public decimal SubTotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string MatchStatus { get; set; } = string.Empty;
    public string? MatchNotes { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime? PaidAt { get; set; }
    public string? PaymentReference { get; set; }
    public string? BlobUrl { get; set; }
    public string? DisputeReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<InvoiceLineDto> Lines { get; set; } = [];
}

public class InvoiceLineDto
{
    public string Id { get; set; } = string.Empty;
    public string POLineId { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
    public decimal TaxRate { get; set; }
    public decimal TaxAmount { get; set; }
}
