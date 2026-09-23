using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using StockFlow.Application.Interfaces;
using StockFlow.Domain.Entities.Notification;
using StockFlow.Domain.Enums;
using StockFlow.Infrastructure.Persistence;

namespace StockFlow.Infrastructure.Notifications;

public class NotificationGateway : INotificationGateway
{
    private readonly IEnumerable<INotificationProvider> _providers;
    private readonly ApplicationDbContext _db;
    private readonly ILogger<NotificationGateway> _logger;

    public NotificationGateway(
        IEnumerable<INotificationProvider> providers,
        ApplicationDbContext db,
        ILogger<NotificationGateway> logger)
    {
        _providers = providers;
        _db = db;
        _logger = logger;
    }

    public async Task<Guid> SendAsync(
        NotificationChannel channel,
        string recipient,
        string subject,
        string message,
        string? relatedEntityType = null,
        Guid? relatedEntityId = null,
        CancellationToken ct = default)
    {
        var log = new NotificationLog
        {
            Channel = channel,
            Recipient = recipient,
            Subject = subject,
            Message = message,
            Status = NotificationStatus.Pending,
            RelatedEntityType = relatedEntityType,
            RelatedEntityId = relatedEntityId
        };
        _db.NotificationLogs.Add(log);
        await _db.SaveChangesAsync(ct);

        var channelKey = channel.ToString();
        var provider = _providers.FirstOrDefault(p =>
            p.Channel.Equals(channelKey, StringComparison.OrdinalIgnoreCase));

        if (provider is null)
        {
            _logger.LogWarning("No provider found for channel {Channel}", channelKey);
            log.Status = NotificationStatus.Failed;
            log.ProviderResponse = "No provider configured";
            await _db.SaveChangesAsync(ct);
            return log.Id;
        }

        var (success, response) = await provider.SendAsync(recipient, subject, message, ct);

        log.Status = success ? NotificationStatus.Sent : NotificationStatus.Failed;
        log.ProviderResponse = response;
        log.SentAt = success ? DateTime.UtcNow : null;
        if (!success) log.RetryCount++;

        await _db.SaveChangesAsync(ct);
        return log.Id;
    }
}
