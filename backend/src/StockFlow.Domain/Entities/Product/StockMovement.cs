using StockFlow.Domain.Enums;

namespace StockFlow.Domain.Entities.Product;

public class StockMovement : BaseEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public MovementType Type { get; set; }
    public int Quantity { get; set; }
    public string? ReferenceNumber { get; set; }
    public string? Notes { get; set; }
    public string? PerformedBy { get; set; }
    public DateTime PerformedAt { get; set; } = DateTime.UtcNow;
}
