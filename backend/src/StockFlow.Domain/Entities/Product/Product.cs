namespace StockFlow.Domain.Entities.Product;

public class Product : BaseEntity
{
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal CostPrice { get; set; }
    public string UnitOfMeasure { get; set; } = "Units";
    public string? Barcode { get; set; }
    public string? QrCode { get; set; }
    public bool IsActive { get; set; } = true;

    public Guid CategoryId { get; set; }
    public ProductCategory Category { get; set; } = null!;

    public StockLevel? StockLevel { get; set; }
    public LowStockThreshold? LowStockThreshold { get; set; }
    public ICollection<StockMovement> StockMovements { get; set; } = new List<StockMovement>();
    public ICollection<StockAdjustment> StockAdjustments { get; set; } = new List<StockAdjustment>();
}
