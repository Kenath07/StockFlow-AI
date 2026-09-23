using StockFlow.Domain.Enums;

namespace StockFlow.Domain.Entities.Order;

public class SalesOrder : BaseEntity
{
    public string OrderNumber { get; set; } = string.Empty;
    public Guid CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;

    public Guid? FieldAgentId { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Draft;
    public decimal TotalAmount { get; set; }
    public string? Notes { get; set; }
    public string? DeliveryAddress { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public DateTime OrderDate { get; set; } = DateTime.UtcNow;
    public DateTime? PreferredDeliveryDate { get; set; }

    public ICollection<OrderLine> Lines { get; set; } = new List<OrderLine>();
    public ICollection<OrderStatusHistory> StatusHistory { get; set; } = new List<OrderStatusHistory>();
    public PaymentReference? PaymentReference { get; set; }
}
