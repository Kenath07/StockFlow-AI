namespace StockFlow.Domain.Entities.Product;

public class StockAdjustment : BaseEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public int PreviousQuantity { get; set; }
    public int NewQuantity { get; set; }
    public int QuantityAdjusted => NewQuantity - PreviousQuantity;
    public string Reason { get; set; } = string.Empty;
    public string? AdjustedBy { get; set; }
    public DateTime AdjustedAt { get; set; } = DateTime.UtcNow;
}
