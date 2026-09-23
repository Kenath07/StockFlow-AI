using StockFlow.Domain.Entities.Product;

namespace StockFlow.Application.Interfaces;

public interface IStockRepository
{
    Task<List<StockLevel>> GetAllStockLevelsAsync(CancellationToken ct = default);
    Task<StockLevel?> GetStockLevelByProductAsync(Guid productId, CancellationToken ct = default);
    Task<List<StockMovement>> GetMovementsAsync(Guid? productId = null, int take = 50, CancellationToken ct = default);
    Task AddMovementAsync(StockMovement movement, CancellationToken ct = default);
    Task UpdateStockLevelAsync(StockLevel stockLevel, CancellationToken ct = default);
    Task AddStockLevelAsync(StockLevel stockLevel, CancellationToken ct = default);
    Task AddAdjustmentAsync(StockAdjustment adjustment, CancellationToken ct = default);
    Task<List<StockLevel>> GetLowStockProductsAsync(CancellationToken ct = default);
    Task<LowStockThreshold?> GetThresholdAsync(Guid productId, CancellationToken ct = default);
    Task AddThresholdAsync(LowStockThreshold threshold, CancellationToken ct = default);
    Task UpdateThresholdAsync(LowStockThreshold threshold, CancellationToken ct = default);
    Task<Product?> GetProductWithThresholdAsync(Guid productId, CancellationToken ct = default);
    Task<List<Product>> GetAllProductsWithThresholdsAsync(CancellationToken ct = default);
}
