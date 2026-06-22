using MediatR;
using P2P.Application.Common;

namespace P2P.Application.Features.SupplierQuotes.Queries;

public record GetQuotesByRFQQuery(string RFQId) : IRequest<BaseResponse<List<QuoteDto>>>;
public record GetQuotesBySupplierQuery(string SupplierId, int Page = 1, int PageSize = 20) : IRequest<BaseResponse<PagedResult<QuoteDto>>>;
public record GetQuoteByIdQuery(string Id) : IRequest<BaseResponse<QuoteDto>>;

public class QuoteDto
{
    public string Id { get; set; } = string.Empty;
    public string QuoteNumber { get; set; } = string.Empty;
    public string RFQId { get; set; } = string.Empty;
    public string SupplierId { get; set; } = string.Empty;
    public string SupplierName { get; set; } = string.Empty;
    public DateTime ValidityDate { get; set; }
    public int LeadTimeDays { get; set; }
    public string? PaymentTerms { get; set; }
    public string? Notes { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; }
    public List<QuoteLineDto> Lines { get; set; } = [];
}

public class QuoteLineDto
{
    public string Id { get; set; } = string.Empty;
    public string RFQLineId { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public decimal Quantity { get; set; }
    public decimal TotalPrice { get; set; }
    public string? Notes { get; set; }
}
