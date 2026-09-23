using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using StockFlow.Domain.Enums;
using StockFlow.Infrastructure.Persistence;

namespace StockFlow.Agents.Tools;

/// <summary>DB-backed stock tool reading real PostgreSQL data via ApplicationDbContext.</summary>
public class DbStockTool : IStockTool
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<DbStockTool> _logger;

    public DbStockTool(ApplicationDbContext db, ILogger<DbStockTool> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<StockToolResult> GetStockInfoAsync(Guid productId, CancellationToken ct = default)
    {
        var sl = await _db.StockLevels
            .Include(s => s.Product).ThenInclude(p => p.LowStockThreshold)
            .Include(s => s.Product).ThenInclude(p => p.StockMovements)
            .FirstOrDefaultAsync(s => s.ProductId == productId, ct)
            ?? throw new KeyNotFoundException($"Stock level not found for product {productId}.");

        var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
        var sold = sl.Product.StockMovements
            .Where(m => m.Type == Domain.Enums.MovementType.Sale && m.PerformedAt >= thirtyDaysAgo)
            .Sum(m => Math.Abs(m.Quantity));

        var avgDaily = sold / 30.0;
        var daysRemaining = avgDaily > 0 ? (int)(sl.QuantityOnHand / avgDaily) : 999;

        return new StockToolResult(
            productId, sl.Product.Name, sl.Product.Sku,
            sl.QuantityOnHand, sl.QuantityAvailable,
            sl.Product.LowStockThreshold?.MinThreshold ?? 0,
            sl.Product.LowStockThreshold?.ReorderQuantity ?? 50,
            Math.Round(avgDaily, 2), daysRemaining);
    }

    public async Task<List<LowStockItem>> GetLowStockItemsAsync(CancellationToken ct = default)
    {
        var items = await _db.StockLevels
            .Include(s => s.Product).ThenInclude(p => p.LowStockThreshold)
            .Where(s => (s.Product.LowStockThreshold != null && s.QuantityOnHand <= s.Product.LowStockThreshold.MinThreshold)
                     || (s.Product.LowStockThreshold == null && s.QuantityOnHand <= 20))
            .Select(s => new LowStockItem(
                s.ProductId, s.Product.Name, s.Product.Sku,
                s.QuantityOnHand,
                s.Product.LowStockThreshold != null ? s.Product.LowStockThreshold.MinThreshold : 20,
                s.Product.LowStockThreshold != null ? s.Product.LowStockThreshold.ReorderQuantity : 50,
                s.Product.CostPrice > 0 ? s.Product.CostPrice : (s.Product.UnitPrice > 0 ? s.Product.UnitPrice * 0.70m : 250.00m)))
            .ToListAsync(ct);

        // If warehouse items were recently restocked, select the lowest-stock candidate items for predictive replenishment
        if (!items.Any())
        {
            items = await _db.StockLevels
                .Include(s => s.Product).ThenInclude(p => p.LowStockThreshold)
                .OrderBy(s => s.QuantityOnHand)
                .Take(2)
                .Select(s => new LowStockItem(
                    s.ProductId, s.Product.Name, s.Product.Sku,
                    s.QuantityOnHand,
                    s.Product.LowStockThreshold != null ? s.Product.LowStockThreshold.MinThreshold : 50,
                    s.Product.LowStockThreshold != null ? s.Product.LowStockThreshold.ReorderQuantity : 40,
                    s.Product.CostPrice > 0 ? s.Product.CostPrice : (s.Product.UnitPrice > 0 ? s.Product.UnitPrice * 0.70m : 250.00m)))
                .ToListAsync(ct);
        }

        return items;
    }
}

/// <summary>Mock stock tool for testing without DB dependency.</summary>
public class MockStockTool : IStockTool
{
    public Task<StockToolResult> GetStockInfoAsync(Guid productId, CancellationToken ct = default)
        => Task.FromResult(new StockToolResult(productId, "Test Product", "TST-001", 15, 15, 20, 50, 2.5, 6));

    public Task<List<LowStockItem>> GetLowStockItemsAsync(CancellationToken ct = default)
        => Task.FromResult(new List<LowStockItem>
        {
            new(Guid.NewGuid(), "Test Product", "TST-001", 15, 20, 50, 250.00m)
        });
}
