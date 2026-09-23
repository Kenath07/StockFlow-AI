namespace StockFlow.Domain.Entities.Field;

public class OfflineSyncQueue : BaseEntity
{
    public Guid FieldAgentId { get; set; }
    public string EntityType { get; set; } = string.Empty; // SalesOrder | CustomerVisit | DeviceCapture
    public string Payload { get; set; } = string.Empty; // JSON payload
    public string Status { get; set; } = "Pending"; // Pending | Synced | Failed
    public int RetryCount { get; set; } = 0;
    public string? ErrorMessage { get; set; }
    public DateTime? SyncedAt { get; set; }
    public string? DeviceId { get; set; }
}
