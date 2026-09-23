using Microsoft.Extensions.Logging;
using StockFlow.Application.DTOs.Product;
using StockFlow.Application.Interfaces;
using StockFlow.Domain.Entities.Product;
using StockFlow.Domain.Enums;

namespace StockFlow.Application.Services;

public class ProductService : IProductService
{
    private readonly IProductRepository _productRepo;
    private readonly IStockRepository _stockRepo;
    private readonly ILogger<ProductService> _logger;

    public ProductService(IProductRepository productRepo, IStockRepository stockRepo, ILogger<ProductService> logger)
    {
        _productRepo = productRepo;
        _stockRepo = stockRepo;
        _logger = logger;
    }

    public async Task<List<ProductDto>> GetAllAsync(bool includeInactive = false, CancellationToken ct = default)
    {
        var products = await _productRepo.GetAllAsync(includeInactive, ct);
        return products.Select(p => ToDto(p)).ToList();
    }

    public async Task<ProductDto?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var p = await _productRepo.GetByIdAsync(id, ct);
        return p is null ? null : ToDto(p);
    }

    public async Task<ProductDto?> GetBySkuAsync(string sku, CancellationToken ct = default)
    {
        var p = await _productRepo.GetBySkuAsync(sku, ct);
        return p is null ? null : ToDto(p);
    }

    public async Task<ProductDto?> GetByBarcodeAsync(string barcode, CancellationToken ct = default)
    {
        var p = await _productRepo.GetByBarcodeAsync(barcode, ct);
        return p is null ? null : ToDto(p);
    }

    public async Task<List<ProductDto>> SearchAsync(string query, Guid? categoryId = null, CancellationToken ct = default)
    {
        var products = await _productRepo.SearchAsync(query, categoryId, ct);
        return products.Select(p => ToDto(p)).ToList();
    }

    public async Task<List<CategoryDto>> GetCategoriesAsync(CancellationToken ct = default)
    {
        var categories = await _productRepo.GetCategoriesAsync(ct);
        return categories.Select(c => new CategoryDto(c.Id, c.Name, c.Code, c.Description)).ToList();
    }

    public async Task<ProductDto> CreateAsync(CreateProductDto dto, string createdBy, CancellationToken ct = default)
    {
        if (dto.UnitPrice <= 0)
            throw new InvalidOperationException("Unit price must be greater than 0 LKR.");

        if (dto.CostPrice < 0)
            throw new InvalidOperationException("Cost price cannot be negative.");

        if (dto.InitialStock < 0)
            throw new InvalidOperationException("Initial stock cannot be negative.");

        if (await _productRepo.SkuExistsAsync(dto.Sku, ct))
            throw new InvalidOperationException($"SKU '{dto.Sku}' already exists.");

        if (await _productRepo.NameExistsAsync(dto.Name, null, ct))
            throw new InvalidOperationException($"A product with the name '{dto.Name}' already exists.");

        if (!string.IsNullOrWhiteSpace(dto.Barcode) && await _productRepo.BarcodeExistsAsync(dto.Barcode.Trim(), null, ct))
            throw new InvalidOperationException("This barcode is already assigned to another product.");

        var categoryId = dto.CategoryId;
        if (categoryId == Guid.Empty)
        {
            var categories = await _productRepo.GetCategoriesAsync(ct);
            categoryId = categories.FirstOrDefault()?.Id ?? Guid.Empty;
        }

        var unitOfMeasure = string.IsNullOrWhiteSpace(dto.UnitOfMeasure) ? "Unit" : dto.UnitOfMeasure;

        var product = new Product
        {
            Sku = dto.Sku,
            Name = dto.Name,
            Description = dto.Description,
            UnitPrice = dto.UnitPrice,
            CostPrice = dto.CostPrice,
            UnitOfMeasure = unitOfMeasure,
            Barcode = dto.Barcode,
            CategoryId = categoryId,
            CreatedBy = createdBy
        };

        await _productRepo.AddAsync(product, ct);

        var stockLevel = new StockLevel
        {
            ProductId = product.Id,
            QuantityOnHand = dto.InitialStock,
            CreatedBy = createdBy
        };
        await _stockRepo.AddStockLevelAsync(stockLevel, ct);

        if (dto.InitialStock > 0)
        {
            await _stockRepo.AddMovementAsync(new StockMovement
            {
                ProductId = product.Id,
                Type = MovementType.Purchase,
                Quantity = dto.InitialStock,
                ReferenceNumber = "INITIAL",
                PerformedBy = createdBy
            }, ct);
        }

        product.StockLevel = stockLevel;
        product.Category = await _productRepo.GetCategoryAsync(categoryId, ct) ?? new ProductCategory();
        _logger.LogInformation("Product {Sku} created by {User}", product.Sku, createdBy);
        return ToDto(product);
    }

    public async Task<ProductDto> UpdateAsync(Guid id, UpdateProductDto dto, string updatedBy, CancellationToken ct = default)
    {
        var product = await _productRepo.GetByIdAsync(id, ct)
            ?? throw new KeyNotFoundException($"Product {id} not found.");

        if (dto.UnitPrice <= 0)
            throw new InvalidOperationException("Unit price must be greater than 0 LKR.");

        if (dto.CostPrice < 0)
            throw new InvalidOperationException("Cost price cannot be negative.");

        if (await _productRepo.NameExistsAsync(dto.Name, id, ct))
            throw new InvalidOperationException($"Another product with the name '{dto.Name}' already exists.");

        if (!string.IsNullOrWhiteSpace(dto.Barcode) && await _productRepo.BarcodeExistsAsync(dto.Barcode.Trim(), id, ct))
            throw new InvalidOperationException("This barcode is already assigned to another product.");

        var categoryId = dto.CategoryId;
        if (categoryId == Guid.Empty)
        {
            var categories = await _productRepo.GetCategoriesAsync(ct);
            categoryId = categories.FirstOrDefault()?.Id ?? product.CategoryId;
        }

        var unitOfMeasure = string.IsNullOrWhiteSpace(dto.UnitOfMeasure) ? (product.UnitOfMeasure ?? "Unit") : dto.UnitOfMeasure;

        product.Name = dto.Name;
        product.Description = dto.Description;
        product.UnitPrice = dto.UnitPrice;
        product.CostPrice = dto.CostPrice;
        product.UnitOfMeasure = unitOfMeasure;
        product.Barcode = dto.Barcode;
        product.CategoryId = categoryId;
        product.IsActive = dto.IsActive;
        product.UpdatedBy = updatedBy;
        product.UpdatedAt = DateTime.UtcNow;

        await _productRepo.UpdateAsync(product, ct);
        product.Category = await _productRepo.GetCategoryAsync(categoryId, ct) ?? product.Category;
        return ToDto(product);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var product = await _productRepo.GetByIdAsync(id, ct);
        if (product is null) return false;
        product.IsActive = false;
        await _productRepo.UpdateAsync(product, ct);
        return true;
    }

    private static ProductDto ToDto(Product p) => new(
        p.Id, p.Sku, p.Name, p.Description, p.UnitPrice, p.CostPrice,
        p.UnitOfMeasure, p.Barcode, p.IsActive, p.CategoryId,
        p.Category?.Name ?? string.Empty,
        p.StockLevel?.QuantityOnHand,
        p.StockLevel?.QuantityAvailable,
        p.CreatedAt);
}
