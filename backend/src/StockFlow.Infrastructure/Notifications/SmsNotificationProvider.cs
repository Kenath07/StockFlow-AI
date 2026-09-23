using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net.Http;

namespace StockFlow.Infrastructure.Notifications;

/// <summary>
/// SMS notification provider using Twilio/sandbox HTTP integration.
/// Gracefully falls back to simulation logging when credentials are absent.
/// </summary>
public class SmsNotificationProvider : INotificationProvider
{
    public string Channel => "Sms";

    private readonly IConfiguration _config;
    private readonly ILogger<SmsNotificationProvider> _logger;
    private readonly HttpClient _httpClient;

    public SmsNotificationProvider(
        IConfiguration config,
        ILogger<SmsNotificationProvider> logger,
        IHttpClientFactory httpClientFactory)
    {
        _config = config;
        _logger = logger;
        _httpClient = httpClientFactory.CreateClient("SmsGateway");
    }

    public async Task<(bool Success, string Response)> SendAsync(
        string recipient, string subject, string message, CancellationToken ct = default)
    {
        var accountSid = _config["Notifications:Twilio:AccountSid"];
        var authToken = _config["Notifications:Twilio:AuthToken"];
        var from = _config["Notifications:Twilio:From"];

        if (string.IsNullOrWhiteSpace(accountSid) || accountSid.StartsWith("sandbox"))
        {
            // Simulation mode - log and return success for dev/test environments
            _logger.LogInformation("[SMS-SANDBOX] To: {To} | Subject: {Subject} | Msg: {Message}", recipient, subject, message);
            return (true, "sandbox-simulated");
        }

        try
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(TimeSpan.FromSeconds(10));

            var url = $"https://api.twilio.com/2010-04-01/Accounts/{accountSid}/Messages.json";
            var content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["To"] = recipient,
                ["From"] = from ?? string.Empty,
                ["Body"] = $"{subject}: {message}"
            });

            var request = new HttpRequestMessage(HttpMethod.Post, url) { Content = content };
            var bytes = System.Text.Encoding.UTF8.GetBytes($"{accountSid}:{authToken}");
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue(
                "Basic", Convert.ToBase64String(bytes));

            var response = await _httpClient.SendAsync(request, cts.Token);
            var body = await response.Content.ReadAsStringAsync(ct);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("SMS sent to {Recipient}", recipient);
                return (true, body);
            }

            _logger.LogWarning("SMS failed to {Recipient}: {Status} {Body}", recipient, response.StatusCode, body);
            return (false, body);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SMS send exception for {Recipient}", recipient);
            return (false, ex.Message);
        }
    }
}
