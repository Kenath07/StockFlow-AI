using Microsoft.Extensions.Logging;
using StockFlow.Application.DTOs.Product;
using StockFlow.Application.Interfaces;
using StockFlow.Domain.Entities.Product;
using StockFlow.Domain.Enums;

namespace StockFlow.Application.Services;

public class StockService : IStockService
{
    private readonly IStockRepository _stockRepo;
    private readonly ILogger<StockService> _logger;

    public StockService(IStockRepository stockRepo, ILogger<StockService> logger)
    {
        _stockRepo = stockRepo;
        _logger = logger;
    }

    public async Task<List<StockLevelDto>> GetAllStockLevelsAsync(CancellationToken ct = default)
    {
        var stockLevels = await _stockRepo.GetAllStockLevelsAsync(ct);
        return stockLevels.Select(s => ToDto(s)).ToList();
    }

    public async Task<StockLevelDto?> GetStockLevelByProductAsync(Guid productId, CancellationToken ct = default)
    {
        var s = await _stockRepo.GetStockLevelByProductAsync(productId, ct);
        return s is null ? null : ToDto(s);
    }

    public async Task<List<StockMovementDto>> GetMovementsAsync(Guid? productId = null, int take = 50, CancellationToken ct = default)
    {
        var movements = await _stockRepo.GetMovementsAsync(productId, take, ct);
        return movements.Select(m => ToMovementDto(m)).ToList();
    }

    public async Task<StockMovementDto> RecordMovementAsync(
        Guid productId, string type, int quantity, string? reference, string performedBy, CancellationToken ct = default)
    {
        if (!Enum.TryParse<MovementType>(type, ignoreCase: true, out var movType))
            throw new ArgumentException($"Invalid movement type '{type}'.");

        var stockLevel = await _stockRepo.GetStockLevelByProductAsync(productId, ct)
            ?? throw new KeyNotFoundException($"No stock level for product {productId}.");

        // Update stock level
        stockLevel.QuantityOnHand += quantity;
        if (stockLevel.QuantityOnHand < 0)
            throw new InvalidOperationException("Insufficient stock.");

        var movement = new StockMovement
        {
            ProductId = productId,
            Type = movType,
            Quantity = quantity,
            ReferenceNumber = reference,
            PerformedBy = performedBy,
            PerformedAt = DateTime.UtcNow
        };

        await _stockRepo.UpdateStockLevelAsync(stockLevel, ct);
        await _stockRepo.AddMovementAsync(movement, ct);
        movement.Product = stockLevel.Product;
        return ToMovementDto(movement);
    }

    public async Task<StockAdjustmentDto> AdjustStockAsync(CreateStockAdjustmentDto dto, string adjustedBy, CancellationToken ct = default)
    {
        if (dto.NewQuantity < 0) throw new ArgumentException("Quantity cannot be negative.");

        var stockLevel = await _stockRepo.GetStockLevelByProductAsync(dto.ProductId, ct)
            ?? throw new KeyNotFoundException($"No stock level for product {dto.ProductId}.");

        var previous = stockLevel.QuantityOnHand;
        var adjustment = new StockAdjustment
        {
            ProductId = dto.ProductId,
            PreviousQuantity = previous,
            NewQuantity = dto.NewQuantity,
            Reason = dto.Reason,
            AdjustedBy = adjustedBy,
            AdjustedAt = DateTime.UtcNow
        };

        stockLevel.QuantityOnHand = dto.NewQuantity;

        await _stockRepo.UpdateStockLevelAsync(stockLevel, ct);
        await _stockRepo.AddAdjustmentAsync(adjustment, ct);
        await _stockRepo.AddMovementAsync(new StockMovement
        {
            ProductId = dto.ProductId,
            Type = MovementType.Adjustment,
            Quantity = dto.NewQuantity - previous,
            ReferenceNumber = "ADJUSTMENT",
            Notes = dto.Reason,
            PerformedBy = adjustedBy
        }, ct);

        return new StockAdjustmentDto(
            adjustment.Id, dto.ProductId, stockLevel.Product.Name,
            previous, dto.NewQuantity, dto.NewQuantity - previous, dto.Reason, adjustedBy, adjustment.AdjustedAt);
    }

    public async Task<List<StockLevelDto>> GetLowStockProductsAsync(CancellationToken ct = default)
    {
        var lowStock = await _stockRepo.GetLowStockProductsAsync(ct);
        return lowStock.Select(s => ToDto(s)).ToList();
    }

    public async Task<List<LowStockThresholdDto>> GetAllThresholdsAsync(CancellationToken ct = default)
    {
        var products = await _stockRepo.GetAllProductsWithThresholdsAsync(ct);
        return products.Select(p => new LowStockThresholdDto(
            p.LowStockThreshold?.Id ?? Guid.Empty,
            p.Id,
            p.Name,
            p.LowStockThreshold?.MinThreshold ?? 10,
            p.LowStockThreshold?.ReorderQuantity ?? 20,
            p.LowStockThreshold?.AlertEnabled ?? true,
            p.StockLevel?.QuantityOnHand ?? 0)).ToList();
    }

    public async Task<LowStockThresholdDto?> GetThresholdAsync(Guid productId, CancellationToken ct = default)
    {
        var t = await _stockRepo.GetThresholdAsync(productId, ct);
        if (t is null) return null;
        return new LowStockThresholdDto(
            t.Id, t.ProductId, t.Product.Name, t.MinThreshold, t.ReorderQuantity,
            t.AlertEnabled, t.Product.StockLevel?.QuantityOnHand ?? 0);
    }

    public async Task<LowStockThresholdDto> UpsertThresholdAsync(Guid productId, UpdateLowStockThresholdDto dto, string updatedBy, CancellationToken ct = default)
    {
        var product = await _stockRepo.GetProductWithThresholdAsync(productId, ct)
            ?? throw new KeyNotFoundException($"Product {productId} not found.");

        if (product.LowStockThreshold is null)
        {
            product.LowStockThreshold = new LowStockThreshold
            {
                ProductId = productId,
                MinThreshold = dto.MinThreshold,
                ReorderQuantity = dto.ReorderQuantity,
                AlertEnabled = dto.AlertEnabled,
                CreatedBy = updatedBy
            };
            await _stockRepo.AddThresholdAsync(product.LowStockThreshold, ct);
        }
        else
        {
            product.LowStockThreshold.MinThreshold = dto.MinThreshold;
            product.LowStockThreshold.ReorderQuantity = dto.ReorderQuantity;
            product.LowStockThreshold.AlertEnabled = dto.AlertEnabled;
            product.LowStockThreshold.UpdatedBy = updatedBy;
            product.LowStockThreshold.UpdatedAt = DateTime.UtcNow;
            await _stockRepo.UpdateThresholdAsync(product.LowStockThreshold, ct);
        }

        return new LowStockThresholdDto(
            product.LowStockThreshold.Id, productId, product.Name,
            dto.MinThreshold, dto.ReorderQuantity, dto.AlertEnabled,
            product.StockLevel?.QuantityOnHand ?? 0);
    }

    private static StockLevelDto ToDto(StockLevel s) => new(
        s.ProductId, s.Product.Name, s.Product.Sku,
        s.QuantityOnHand, s.QuantityReserved, s.QuantityAvailable,
        s.WarehouseLocation, s.LastRestockedAt);

    private static StockMovementDto ToMovementDto(StockMovement m) => new(
        m.Id, m.ProductId, m.Product?.Name ?? string.Empty,
        m.Type.ToString(), m.Quantity, m.ReferenceNumber, m.Notes, m.PerformedBy, m.PerformedAt);
}
