using StockFlow.Application.Interfaces;
using StockFlow.Application.DTOs.Notification;
using StockFlow.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace StockFlow.Application.Services;

public class NotificationService : INotificationService
{
    private readonly INotificationGateway _gateway;
    private readonly IUserRepository _userRepo;
    private readonly INotificationRepository _notificationRepo;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(INotificationGateway gateway, IUserRepository userRepo, INotificationRepository notificationRepo, ILogger<NotificationService> logger)
    {
        _gateway = gateway;
        _userRepo = userRepo;
        _notificationRepo = notificationRepo;
        _logger = logger;
    }

    public Task<Guid> SendSmsAsync(string phone, string subject, string message, string? entityType = null, Guid? entityId = null, CancellationToken ct = default)
        => _gateway.SendAsync(NotificationChannel.Sms, phone, subject, message, entityType, entityId, ct);

    public Task<Guid> SendEmailAsync(string email, string subject, string message, string? entityType = null, Guid? entityId = null, CancellationToken ct = default)
        => _gateway.SendAsync(NotificationChannel.Email, email, subject, message, entityType, entityId, ct);

    public async Task NotifyLowStockAsync(Guid productId, string productName, int currentStock, int threshold, CancellationToken ct = default)
    {
        var admins = await _userRepo.GetByRolesAsync(new List<UserRole> { UserRole.Admin, UserRole.Manager }, ct);

        var message = $"LOW STOCK ALERT: '{productName}' has {currentStock} units remaining (threshold: {threshold}).";
        foreach (var admin in admins.Where(u => u.IsActive))
        {
            if (!string.IsNullOrEmpty(admin.Email))
                await _gateway.SendAsync(NotificationChannel.Email, admin.Email, "Low Stock Alert", message, "Product", productId, ct);
        }
        _logger.LogWarning("Low stock notification sent for {Product}: {Stock} units", productName, currentStock);
    }

    public async Task NotifyOrderConfirmationAsync(Guid orderId, string orderNumber, string customerEmail, string customerPhone, CancellationToken ct = default)
    {
        var message = $"Your order {orderNumber} has been confirmed and is being processed. Thank you!";
        if (!string.IsNullOrEmpty(customerEmail))
            await _gateway.SendAsync(NotificationChannel.Email, customerEmail, $"Order Confirmed: {orderNumber}", message, "Order", orderId, ct);
        if (!string.IsNullOrEmpty(customerPhone))
            await _gateway.SendAsync(NotificationChannel.Sms, customerPhone, $"Order {orderNumber} Confirmed", message, "Order", orderId, ct);
    }

    public async Task NotifyApprovalRequiredAsync(Guid workflowId, string managerEmail, CancellationToken ct = default)
    {
        var message = $"A reorder proposal (Workflow ID: {workflowId}) is awaiting your approval in the StockFlow dashboard. Please review and approve or reject within 48 hours.";
        await _gateway.SendAsync(NotificationChannel.Email, managerEmail, "Action Required: Reorder Approval", message, "AgentWorkflow", workflowId, ct);
    }

    public async Task<List<NotificationDto>> GetUserNotificationsAsync(string userId, CancellationToken ct = default)
    {
        var logs = await _notificationRepo.GetUserNotificationsAsync(userId, ct);
        return logs.Select(l => new NotificationDto(
            l.Id,
            l.Subject,
            l.Message,
            (l.RelatedEntityType ?? "system").ToLower(),
            l.CreatedAt,
            l.IsRead
        )).ToList();
    }

    public async Task MarkAsReadAsync(Guid id, string userId, CancellationToken ct = default)
    {
        var notification = await _notificationRepo.GetByIdAsync(id, ct);
        if (notification != null && notification.Recipient == userId && !notification.IsRead)
        {
            notification.IsRead = true;
            await _notificationRepo.UpdateAsync(notification, ct);
        }
    }

    public async Task MarkAllAsReadAsync(string userId, CancellationToken ct = default)
    {
        await _notificationRepo.MarkAllAsReadAsync(userId, ct);
    }
}
