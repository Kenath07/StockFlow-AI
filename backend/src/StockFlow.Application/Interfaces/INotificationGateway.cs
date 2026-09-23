using StockFlow.Domain.Enums;

namespace StockFlow.Application.Interfaces;

public interface INotificationGateway
{
    Task<Guid> SendAsync(
        NotificationChannel channel,
        string recipient,
        string subject,
        string message,
        string? entityType = null,
        Guid? entityId = null,
        CancellationToken ct = default);
}
