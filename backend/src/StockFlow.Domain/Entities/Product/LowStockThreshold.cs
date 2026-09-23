namespace StockFlow.Domain.Entities.Product;

public class LowStockThreshold : BaseEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public int MinThreshold { get; set; } = 20;
    public int ReorderQuantity { get; set; } = 50;
    public bool AlertEnabled { get; set; } = true;
    public DateTime? LastAlertTriggeredAt { get; set; }
}
