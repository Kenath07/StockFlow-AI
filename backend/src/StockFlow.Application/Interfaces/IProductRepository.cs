using StockFlow.Domain.Entities.Product;

namespace StockFlow.Application.Interfaces;

public interface IProductRepository
{
    Task<List<Product>> GetAllAsync(bool includeInactive = false, CancellationToken ct = default);
    Task<Product?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Product?> GetBySkuAsync(string sku, CancellationToken ct = default);
    Task<Product?> GetByBarcodeAsync(string barcode, CancellationToken ct = default);
    Task<List<Product>> SearchAsync(string query, Guid? categoryId = null, CancellationToken ct = default);
    Task<bool> SkuExistsAsync(string sku, CancellationToken ct = default);
    Task<bool> NameExistsAsync(string name, Guid? excludeProductId = null, CancellationToken ct = default);
    Task<bool> BarcodeExistsAsync(string barcode, Guid? excludeProductId = null, CancellationToken ct = default);
    Task AddAsync(Product product, CancellationToken ct = default);
    Task UpdateAsync(Product product, CancellationToken ct = default);
    Task<ProductCategory?> GetCategoryAsync(Guid categoryId, CancellationToken ct = default);
    Task<List<ProductCategory>> GetCategoriesAsync(CancellationToken ct = default);
}
