using StockFlow.Application.DTOs.Product;

namespace StockFlow.Application.Interfaces;

public interface IStockService
{
    Task<List<StockLevelDto>> GetAllStockLevelsAsync(CancellationToken ct = default);
    Task<StockLevelDto?> GetStockLevelByProductAsync(Guid productId, CancellationToken ct = default);
    Task<List<StockMovementDto>> GetMovementsAsync(Guid? productId = null, int take = 50, CancellationToken ct = default);
    Task<StockMovementDto> RecordMovementAsync(Guid productId, string type, int quantity, string? reference, string performedBy, CancellationToken ct = default);
    Task<StockAdjustmentDto> AdjustStockAsync(CreateStockAdjustmentDto dto, string adjustedBy, CancellationToken ct = default);
    Task<List<StockLevelDto>> GetLowStockProductsAsync(CancellationToken ct = default);
    Task<List<LowStockThresholdDto>> GetAllThresholdsAsync(CancellationToken ct = default);
    Task<LowStockThresholdDto?> GetThresholdAsync(Guid productId, CancellationToken ct = default);
    Task<LowStockThresholdDto> UpsertThresholdAsync(Guid productId, UpdateLowStockThresholdDto dto, string updatedBy, CancellationToken ct = default);
}
