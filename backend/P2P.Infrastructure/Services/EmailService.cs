using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using P2P.Application.Interfaces;
using System.Net;
using System.Net.Mail;

namespace P2P.Infrastructure.Services;

public class EmailService(IConfiguration config, ILogger<EmailService> logger) : IEmailService
{
    public async Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct = default)
    {
        try
        {
            var smtpHost = config["Email:SmtpHost"];
            if (string.IsNullOrEmpty(smtpHost))
            {
                logger.LogInformation("Email not configured. Would send to {To}: {Subject}", to, subject);
                return;
            }

            using var client = new SmtpClient(smtpHost, int.Parse(config["Email:SmtpPort"] ?? "587"))
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(config["Email:UserName"], config["Email:Password"])
            };

            var msg = new MailMessage(config["Email:From"] ?? "noreply@p2p.com", to, subject, htmlBody)
            {
                IsBodyHtml = true
            };

            await client.SendMailAsync(msg, ct);
            logger.LogInformation("Email sent to {To}: {Subject}", to, subject);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send email to {To}", to);
        }
    }
}
