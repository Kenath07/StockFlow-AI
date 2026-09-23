using StockFlow.Application.DTOs.Product;

namespace StockFlow.Application.Interfaces;

public interface IProductService
{
    Task<List<ProductDto>> GetAllAsync(bool includeInactive = false, CancellationToken ct = default);
    Task<ProductDto?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<ProductDto?> GetBySkuAsync(string sku, CancellationToken ct = default);
    Task<ProductDto?> GetByBarcodeAsync(string barcode, CancellationToken ct = default);
    Task<List<ProductDto>> SearchAsync(string query, Guid? categoryId = null, CancellationToken ct = default);
    Task<ProductDto> CreateAsync(CreateProductDto dto, string createdBy, CancellationToken ct = default);
    Task<ProductDto> UpdateAsync(Guid id, UpdateProductDto dto, string updatedBy, CancellationToken ct = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken ct = default);
    Task<List<CategoryDto>> GetCategoriesAsync(CancellationToken ct = default);
}
