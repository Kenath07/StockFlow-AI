namespace StockFlow.Domain.Entities.Product;

public class StockLevel : BaseEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public int QuantityOnHand { get; set; }
    public int QuantityReserved { get; set; }
    public int QuantityAvailable => Math.Max(0, QuantityOnHand - QuantityReserved);
    public string? WarehouseLocation { get; set; } = "Main Warehouse";
    public DateTime? LastRestockedAt { get; set; }
}
