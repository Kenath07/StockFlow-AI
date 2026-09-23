namespace StockFlow.Domain.Entities.Field;

public class CustomerVisit : BaseEntity
{
    public Guid FieldAgentId { get; set; }
    public FieldAgentProfile FieldAgent { get; set; } = null!;

    public Guid CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string? AddressSnapshot { get; set; }
    public DateTime VisitedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CheckOutAt { get; set; }
    public string? Notes { get; set; }
    public Guid? SalesOrderId { get; set; }

    public ICollection<DeviceCapture> DeviceCaptures { get; set; } = new List<DeviceCapture>();
}
