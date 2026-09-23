using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace StockFlow.Infrastructure.Notifications;

/// <summary>
/// Email notification provider using SMTP or Mailgun sandbox.
/// Gracefully falls back to simulation logging in dev environments.
/// </summary>
public class EmailNotificationProvider : INotificationProvider
{
    public string Channel => "Email";

    private readonly IConfiguration _config;
    private readonly ILogger<EmailNotificationProvider> _logger;

    public EmailNotificationProvider(IConfiguration config, ILogger<EmailNotificationProvider> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task<(bool Success, string Response)> SendAsync(
        string recipient, string subject, string message, CancellationToken ct = default)
    {
        var smtpHost = _config["Notifications:Email:SmtpHost"];

        if (string.IsNullOrWhiteSpace(smtpHost) || smtpHost == "sandbox")
        {
            _logger.LogInformation("[EMAIL-SANDBOX] To: {To} | Subject: {Subject} | Body: {Body}", recipient, subject, message);
            return (true, "sandbox-simulated");
        }

        try
        {
            var smtpPort = int.Parse(_config["Notifications:Email:SmtpPort"] ?? "587");
            var smtpUser = _config["Notifications:Email:Username"] ?? string.Empty;
            var smtpPass = _config["Notifications:Email:Password"] ?? string.Empty;
            var fromAddress = _config["Notifications:Email:From"] ?? "noreply@stockflow.ai";

            using var smtp = new System.Net.Mail.SmtpClient(smtpHost, smtpPort);
            smtp.Credentials = new System.Net.NetworkCredential(smtpUser, smtpPass);
            smtp.EnableSsl = true;
            smtp.Timeout = 10000;

            var mail = new System.Net.Mail.MailMessage(fromAddress, recipient, subject, message)
            {
                IsBodyHtml = false
            };

            await Task.Run(() => smtp.Send(mail), ct);
            _logger.LogInformation("Email sent to {Recipient}", recipient);
            return (true, "sent");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Email send exception for {Recipient}", recipient);
            return (false, ex.Message);
        }
    }
}
