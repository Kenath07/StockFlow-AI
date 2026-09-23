using StockFlow.Domain.Enums;

namespace StockFlow.Domain.Entities.Order;

public class OrderStatusHistory : BaseEntity
{
    public Guid SalesOrderId { get; set; }
    public SalesOrder SalesOrder { get; set; } = null!;

    public OrderStatus FromStatus { get; set; }
    public OrderStatus ToStatus { get; set; }
    public string? ChangedBy { get; set; }
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    public string? Reason { get; set; }
}
