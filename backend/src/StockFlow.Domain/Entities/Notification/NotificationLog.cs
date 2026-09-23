using StockFlow.Domain.Enums;

namespace StockFlow.Domain.Entities.Notification;

public class NotificationLog : BaseEntity
{
    public NotificationChannel Channel { get; set; }
    public NotificationStatus Status { get; set; } = NotificationStatus.Pending;
    public string Recipient { get; set; } = string.Empty; // phone or email
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? ProviderResponse { get; set; }
    public int RetryCount { get; set; } = 0;
    public DateTime? SentAt { get; set; }
    public string? RelatedEntityType { get; set; } // Order | Workflow | StockAlert
    public Guid? RelatedEntityId { get; set; }
    public bool IsRead { get; set; } = false;
}
