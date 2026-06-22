using Azure.Storage.Blobs;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using P2P.Application.Interfaces;

namespace P2P.Infrastructure.Services;

public class BlobService(IConfiguration config, ILogger<BlobService> logger) : IBlobService
{
    private readonly string? _connectionString = config["Azure:StorageConnectionString"];
    private readonly string _localPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads");

    public async Task<string> UploadAsync(Stream stream, string fileName, string containerName, CancellationToken ct = default)
    {
        if (!string.IsNullOrEmpty(_connectionString))
        {
            try
            {
                var blobServiceClient = new BlobServiceClient(_connectionString);
                var containerClient = blobServiceClient.GetBlobContainerClient(containerName);
                await containerClient.CreateIfNotExistsAsync(cancellationToken: ct);

                var uniqueName = $"{Guid.NewGuid()}-{fileName}";
                var blobClient = containerClient.GetBlobClient(uniqueName);
                await blobClient.UploadAsync(stream, overwrite: true, cancellationToken: ct);
                return blobClient.Uri.ToString();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Azure blob upload failed, falling back to local");
            }
        }

        // Local fallback
        Directory.CreateDirectory(Path.Combine(_localPath, containerName));
        var localFileName = $"{Guid.NewGuid()}-{fileName}";
        var filePath = Path.Combine(_localPath, containerName, localFileName);
        using var fileStream = File.Create(filePath);
        await stream.CopyToAsync(fileStream, ct);
        return $"/uploads/{containerName}/{localFileName}";
    }

    public Task DeleteAsync(string blobUrl, CancellationToken ct = default)
    {
        logger.LogInformation("Delete blob: {Url}", blobUrl);
        return Task.CompletedTask;
    }
}
