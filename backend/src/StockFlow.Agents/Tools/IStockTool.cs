namespace StockFlow.Agents.Tools;

public interface IStockTool
{
    Task<StockToolResult> GetStockInfoAsync(Guid productId, CancellationToken ct = default);
    Task<List<LowStockItem>> GetLowStockItemsAsync(CancellationToken ct = default);
}

public record StockToolResult(
    Guid ProductId,
    string ProductName,
    string Sku,
    int QuantityOnHand,
    int QuantityAvailable,
    int MinThreshold,
    int ReorderQuantity,
    double AverageDailyUsage,
    int DaysOfStockRemaining);

public record LowStockItem(
    Guid ProductId,
    string ProductName,
    string Sku,
    int QuantityOnHand,
    int MinThreshold,
    int ReorderQuantity,
    decimal UnitCost);
