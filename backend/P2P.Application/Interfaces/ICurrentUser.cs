using P2P.Domain.Enums;

namespace P2P.Application.Interfaces;

public interface ICurrentUser
{
    string UserId { get; }
    string UserName { get; }
    string Email { get; }
    UserRole Role { get; }
    string? SupplierId { get; }
    bool IsSupplier { get; }
    string? IPAddress { get; }
}

public interface IEmailService
{
    Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct = default);
}

public interface IBlobService
{
    Task<string> UploadAsync(Stream stream, string fileName, string containerName, CancellationToken ct = default);
    Task DeleteAsync(string blobUrl, CancellationToken ct = default);
}

public interface INumberGenerator
{
    Task<string> GeneratePRNumberAsync(CancellationToken ct = default);
    Task<string> GeneratePONumberAsync(CancellationToken ct = default);
    Task<string> GenerateGRNumberAsync(CancellationToken ct = default);
    Task<string> GenerateInvoiceNumberAsync(CancellationToken ct = default);
    Task<string> GenerateRFQNumberAsync(CancellationToken ct = default);
    Task<string> GenerateQuoteNumberAsync(CancellationToken ct = default);
    Task<string> GenerateASNNumberAsync(CancellationToken ct = default);
    Task<string> GenerateDisputeNumberAsync(CancellationToken ct = default);
    Task<string> GenerateSupplierCodeAsync(CancellationToken ct = default);
}
