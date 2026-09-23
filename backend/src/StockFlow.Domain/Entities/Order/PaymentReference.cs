namespace StockFlow.Domain.Entities.Order;

public class PaymentReference : BaseEntity
{
    public Guid SalesOrderId { get; set; }
    public SalesOrder SalesOrder { get; set; } = null!;

    public string ReferenceNumber { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = "Cash";
    public decimal AmountPaid { get; set; }
    public DateTime PaidAt { get; set; } = DateTime.UtcNow;
    public string? Notes { get; set; }
}
