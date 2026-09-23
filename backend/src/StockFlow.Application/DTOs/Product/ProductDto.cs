namespace StockFlow.Application.DTOs.Product;

public record CategoryDto(Guid Id, string Name, string Code, string? Description);

public record ProductDto(
    Guid Id,
    string Sku,
    string Name,
    string? Description,
    decimal UnitPrice,
    decimal CostPrice,
    string UnitOfMeasure,
    string? Barcode,
    bool IsActive,
    Guid CategoryId,
    string CategoryName,
    int? QuantityOnHand,
    int? QuantityAvailable,
    DateTime CreatedAt);

public record CreateProductDto(
    string Sku,
    string Name,
    string? Description,
    decimal UnitPrice,
    decimal CostPrice,
    string UnitOfMeasure,
    string? Barcode,
    Guid CategoryId,
    int InitialStock = 0);

public record UpdateProductDto(
    string Name,
    string? Description,
    decimal UnitPrice,
    decimal CostPrice,
    string UnitOfMeasure,
    string? Barcode,
    Guid CategoryId,
    bool IsActive);

public record StockLevelDto(
    Guid ProductId,
    string ProductName,
    string ProductSku,
    int QuantityOnHand,
    int QuantityReserved,
    int QuantityAvailable,
    string? WarehouseLocation,
    DateTime? LastRestockedAt);

public record StockMovementDto(
    Guid Id,
    Guid ProductId,
    string ProductName,
    string MovementType,
    int Quantity,
    string? ReferenceNumber,
    string? Notes,
    string? PerformedBy,
    DateTime PerformedAt);

public record StockAdjustmentDto(
    Guid Id,
    Guid ProductId,
    string ProductName,
    int PreviousQuantity,
    int NewQuantity,
    int QuantityAdjusted,
    string Reason,
    string? AdjustedBy,
    DateTime AdjustedAt);

public record CreateStockAdjustmentDto(
    Guid ProductId,
    int NewQuantity,
    string Reason);

public record LowStockThresholdDto(
    Guid Id,
    Guid ProductId,
    string ProductName,
    int MinThreshold,
    int ReorderQuantity,
    bool AlertEnabled,
    int CurrentStock);

public record UpdateLowStockThresholdDto(
    int MinThreshold,
    int ReorderQuantity,
    bool AlertEnabled);
