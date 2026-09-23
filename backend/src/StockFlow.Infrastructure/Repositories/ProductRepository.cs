using Microsoft.EntityFrameworkCore;
using StockFlow.Application.Interfaces;
using StockFlow.Domain.Entities.Product;
using StockFlow.Infrastructure.Persistence;

namespace StockFlow.Infrastructure.Repositories;

public class ProductRepository : IProductRepository
{
    private readonly ApplicationDbContext _context;

    public ProductRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Product>> GetAllAsync(bool includeInactive = false, CancellationToken ct = default)
    {
        var query = _context.Products
            .Include(p => p.Category)
            .Include(p => p.StockLevel)
            .AsQueryable();

        if (!includeInactive)
            query = query.Where(p => p.IsActive);

        return await query.ToListAsync(ct);
    }

    public async Task<Product?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.Products
            .Include(p => p.Category)
            .Include(p => p.StockLevel)
            .FirstOrDefaultAsync(p => p.Id == id, ct);
    }

    public async Task<Product?> GetBySkuAsync(string sku, CancellationToken ct = default)
    {
        return await _context.Products
            .Include(p => p.Category)
            .Include(p => p.StockLevel)
            .FirstOrDefaultAsync(p => p.Sku == sku, ct);
    }

    public async Task<Product?> GetByBarcodeAsync(string barcode, CancellationToken ct = default)
    {
        return await _context.Products
            .Include(p => p.Category)
            .Include(p => p.StockLevel)
            .FirstOrDefaultAsync(p => p.Barcode == barcode, ct);
    }

    public async Task<List<Product>> SearchAsync(string query, Guid? categoryId = null, CancellationToken ct = default)
    {
        var q = _context.Products
            .Include(p => p.Category)
            .Include(p => p.StockLevel)
            .Where(p => p.IsActive &&
                (p.Name.Contains(query) ||
                 p.Sku.Contains(query) ||
                 (p.Barcode != null && p.Barcode.Contains(query))));

        if (categoryId.HasValue)
            q = q.Where(p => p.CategoryId == categoryId.Value);

        return await q.ToListAsync(ct);
    }

    public async Task<bool> SkuExistsAsync(string sku, CancellationToken ct = default)
    {
        return await _context.Products.AnyAsync(p => p.Sku == sku, ct);
    }

    public async Task<bool> NameExistsAsync(string name, Guid? excludeProductId = null, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(name)) return false;
        var normalized = name.Trim().ToLower();
        var query = _context.Products.Where(p => p.IsActive && p.Name.ToLower() == normalized);
        if (excludeProductId.HasValue)
            query = query.Where(p => p.Id != excludeProductId.Value);
        return await query.AnyAsync(ct);
    }

    public async Task<bool> BarcodeExistsAsync(string barcode, Guid? excludeProductId = null, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(barcode)) return false;
        var query = _context.Products.Where(p => p.Barcode == barcode);
        if (excludeProductId.HasValue)
            query = query.Where(p => p.Id != excludeProductId.Value);
        return await query.AnyAsync(ct);
    }

    public async Task AddAsync(Product product, CancellationToken ct = default)
    {
        await _context.Products.AddAsync(product, ct);
        await _context.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(Product product, CancellationToken ct = default)
    {
        _context.Products.Update(product);
        await _context.SaveChangesAsync(ct);
    }

    public async Task<ProductCategory?> GetCategoryAsync(Guid categoryId, CancellationToken ct = default)
    {
        return await _context.ProductCategories.FindAsync(new object[] { categoryId }, ct);
    }

    public async Task<List<ProductCategory>> GetCategoriesAsync(CancellationToken ct = default)
    {
        return await _context.ProductCategories.OrderBy(c => c.Name).ToListAsync(ct);
    }
}
