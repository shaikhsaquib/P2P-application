using MediatR;
using P2P.Application.Common;

namespace P2P.Application.Features.Suppliers.Commands;

public record RegisterSupplierCommand(
    string CompanyName, string ContactPerson, string Email, string Phone,
    string Address, string City, string State, string Country, string PostalCode,
    string? GSTNumber, string? PANNumber, string? BankAccountNumber,
    string? BankName, string? IFSCCode, string? SWIFTCode,
    string AdminPassword
) : IRequest<BaseResponse<string>>;

public record ApproveSupplierCommand(string SupplierId) : IRequest<BaseResponse<bool>>;
public record RejectSupplierCommand(string SupplierId, string Reason) : IRequest<BaseResponse<bool>>;

public record UpdateSupplierProfileCommand(
    string SupplierId, string ContactPerson, string Phone,
    string Address, string City, string State, string PostalCode,
    string? BankAccountNumber, string? BankName, string? IFSCCode, string? SWIFTCode
) : IRequest<BaseResponse<bool>>;
