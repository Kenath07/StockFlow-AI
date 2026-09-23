namespace StockFlow.Application.DTOs.Notification;

public record NotificationDto(
    Guid Id,
    string Title,
    string Message,
    string Type,
    DateTime CreatedAt,
    bool IsRead
);
