using Microsoft.EntityFrameworkCore;
using StockFlow.Application.Interfaces;
using StockFlow.Domain.Entities.Product;
using StockFlow.Infrastructure.Persistence;

namespace StockFlow.Infrastructure.Repositories;

public class StockRepository : IStockRepository
{
    private readonly ApplicationDbContext _context;

    public StockRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<StockLevel>> GetAllStockLevelsAsync(CancellationToken ct = default)
    {
        return await _context.StockLevels
            .Include(s => s.Product)
            .ToListAsync(ct);
    }

    public async Task<StockLevel?> GetStockLevelByProductAsync(Guid productId, CancellationToken ct = default)
    {
        return await _context.StockLevels
            .Include(s => s.Product)
            .FirstOrDefaultAsync(s => s.ProductId == productId, ct);
    }

    public async Task<List<StockMovement>> GetMovementsAsync(Guid? productId = null, int take = 50, CancellationToken ct = default)
    {
        var query = _context.StockMovements
            .Include(m => m.Product)
            .AsQueryable();

        if (productId.HasValue)
            query = query.Where(m => m.ProductId == productId.Value);

        return await query
            .OrderByDescending(m => m.PerformedAt)
            .Take(take)
            .ToListAsync(ct);
    }

    public async Task AddMovementAsync(StockMovement movement, CancellationToken ct = default)
    {
        await _context.StockMovements.AddAsync(movement, ct);
        await _context.SaveChangesAsync(ct);
    }

    public async Task UpdateStockLevelAsync(StockLevel stockLevel, CancellationToken ct = default)
    {
        _context.StockLevels.Update(stockLevel);
        await _context.SaveChangesAsync(ct);
    }

    public async Task AddStockLevelAsync(StockLevel stockLevel, CancellationToken ct = default)
    {
        await _context.StockLevels.AddAsync(stockLevel, ct);
        await _context.SaveChangesAsync(ct);
    }

    public async Task AddAdjustmentAsync(StockAdjustment adjustment, CancellationToken ct = default)
    {
        await _context.StockAdjustments.AddAsync(adjustment, ct);
        await _context.SaveChangesAsync(ct);
    }

    public async Task<List<StockLevel>> GetLowStockProductsAsync(CancellationToken ct = default)
    {
        return await _context.StockLevels
            .Include(s => s.Product)
                .ThenInclude(p => p.LowStockThreshold)
            .Where(s => s.Product.LowStockThreshold != null &&
                        s.QuantityOnHand <= s.Product.LowStockThreshold.MinThreshold)
            .ToListAsync(ct);
    }

    public async Task<LowStockThreshold?> GetThresholdAsync(Guid productId, CancellationToken ct = default)
    {
        return await _context.LowStockThresholds
            .Include(t => t.Product)
                .ThenInclude(p => p.StockLevel)
            .FirstOrDefaultAsync(t => t.ProductId == productId, ct);
    }

    public async Task AddThresholdAsync(LowStockThreshold threshold, CancellationToken ct = default)
    {
        await _context.LowStockThresholds.AddAsync(threshold, ct);
        await _context.SaveChangesAsync(ct);
    }

    public async Task UpdateThresholdAsync(LowStockThreshold threshold, CancellationToken ct = default)
    {
        _context.LowStockThresholds.Update(threshold);
        await _context.SaveChangesAsync(ct);
    }

    public async Task<Product?> GetProductWithThresholdAsync(Guid productId, CancellationToken ct = default)
    {
        return await _context.Products
            .Include(p => p.StockLevel)
            .Include(p => p.LowStockThreshold)
            .FirstOrDefaultAsync(p => p.Id == productId, ct);
    }

    public async Task<List<Product>> GetAllProductsWithThresholdsAsync(CancellationToken ct = default)
    {
        return await _context.Products
            .Include(p => p.StockLevel)
            .Include(p => p.LowStockThreshold)
            .Where(p => p.IsActive)
            .OrderBy(p => p.Name)
            .ToListAsync(ct);
    }
}
