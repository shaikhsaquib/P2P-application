using MediatR;
using P2P.Application.Common;

namespace P2P.Application.Features.SupplierQuotes.Commands;

public record SubmitQuoteLineDto(string RFQLineId, decimal UnitPrice, decimal Quantity, string? Notes);

public record SubmitQuoteCommand(
    string RFQId, DateTime ValidityDate, int LeadTimeDays,
    string? PaymentTerms, string? Notes, List<SubmitQuoteLineDto> Lines
) : IRequest<BaseResponse<string>>;

public record ReviseQuoteCommand(
    string QuoteId, DateTime ValidityDate, int LeadTimeDays,
    string? Notes, List<SubmitQuoteLineDto> Lines
) : IRequest<BaseResponse<bool>>;
