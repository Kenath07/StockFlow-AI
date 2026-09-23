using StockFlow.Domain.Entities.Notification;

namespace StockFlow.Application.Interfaces;

public interface INotificationRepository
{
    Task<List<NotificationLog>> GetUserNotificationsAsync(string userId, CancellationToken ct = default);
    Task<NotificationLog?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task UpdateAsync(NotificationLog notification, CancellationToken ct = default);
    Task MarkAllAsReadAsync(string userId, CancellationToken ct = default);
}
