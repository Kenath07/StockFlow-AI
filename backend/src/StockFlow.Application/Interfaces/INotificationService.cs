using StockFlow.Domain.Enums;

namespace StockFlow.Application.Interfaces;

public interface INotificationService
{
    Task<Guid> SendSmsAsync(string phone, string subject, string message, string? entityType = null, Guid? entityId = null, CancellationToken ct = default);
    Task<Guid> SendEmailAsync(string email, string subject, string message, string? entityType = null, Guid? entityId = null, CancellationToken ct = default);
    Task NotifyLowStockAsync(Guid productId, string productName, int currentStock, int threshold, CancellationToken ct = default);
    Task NotifyOrderConfirmationAsync(Guid orderId, string orderNumber, string customerEmail, string customerPhone, CancellationToken ct = default);
    Task NotifyApprovalRequiredAsync(Guid workflowId, string managerEmail, CancellationToken ct = default);
    Task<List<StockFlow.Application.DTOs.Notification.NotificationDto>> GetUserNotificationsAsync(string userId, CancellationToken ct = default);
    Task MarkAsReadAsync(Guid id, string userId, CancellationToken ct = default);
    Task MarkAllAsReadAsync(string userId, CancellationToken ct = default);
}
