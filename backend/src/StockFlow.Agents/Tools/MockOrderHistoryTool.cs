using Microsoft.EntityFrameworkCore;
using StockFlow.Domain.Enums;
using StockFlow.Infrastructure.Persistence;

namespace StockFlow.Agents.Tools;

public class DbOrderHistoryTool : IOrderHistoryTool
{
    private readonly ApplicationDbContext _db;
    public DbOrderHistoryTool(ApplicationDbContext db) { _db = db; }

    public async Task<List<OrderDemandSignal>> GetDemandSignalsAsync(Guid productId, int lookbackDays = 30, CancellationToken ct = default)
    {
        var since = DateTime.UtcNow.AddDays(-lookbackDays);
        var lines = await _db.OrderLines
            .Include(l => l.Product)
            .Include(l => l.SalesOrder)
            .Where(l => l.ProductId == productId &&
                        l.SalesOrder.Status != OrderStatus.Cancelled &&
                        l.SalesOrder.OrderDate >= since)
            .ToListAsync(ct);

        if (!lines.Any())
            return new List<OrderDemandSignal>();

        var totalSold = lines.Sum(l => l.Quantity);
        var avgDaily = totalSold / (double)lookbackDays;

        var topCustomerIds = lines.GroupBy(l => l.SalesOrder.CustomerId)
            .OrderByDescending(g => g.Sum(l => l.Quantity))
            .Select(g => g.Key)
            .Take(3)
            .ToList();

        return new List<OrderDemandSignal>
        {
            new(productId, lines.First().Product.Name, totalSold, lines.Select(l => l.SalesOrderId).Distinct().Count(),
                Math.Round(avgDaily, 2), 0.0, since, DateTime.UtcNow, topCustomerIds)
        };
    }

    public async Task<CustomerOrderPattern> GetCustomerPatternAsync(Guid customerId, CancellationToken ct = default)
    {
        var orders = await _db.SalesOrders
            .Include(o => o.Lines).ThenInclude(l => l.Product)
            .Where(o => o.CustomerId == customerId && o.Status != OrderStatus.Cancelled)
            .OrderBy(o => o.OrderDate)
            .ToListAsync(ct);

        if (!orders.Any())
            return new CustomerOrderPattern(customerId, string.Empty, 0, 0, 0, new());

        var customer = await _db.Customers.FindAsync(new object[] { customerId }, ct);
        var totalSpend = orders.Sum(o => o.TotalAmount);
        var avgFreq = orders.Count > 1
            ? (orders.Last().OrderDate - orders.First().OrderDate).TotalDays / (orders.Count - 1)
            : 0;
        var topSkus = orders.SelectMany(o => o.Lines).GroupBy(l => l.Product.Sku)
            .OrderByDescending(g => g.Sum(l => l.Quantity)).Take(5).Select(g => g.Key).ToList();

        return new CustomerOrderPattern(customerId, customer?.Name ?? string.Empty, orders.Count, totalSpend, Math.Round(avgFreq, 1), topSkus);
    }
}

public class MockOrderHistoryTool : IOrderHistoryTool
{
    public Task<List<OrderDemandSignal>> GetDemandSignalsAsync(Guid productId, int lookbackDays = 30, CancellationToken ct = default)
        => Task.FromResult(new List<OrderDemandSignal>
        {
            new(productId, "Test Product", 75, 10, 2.5, 0.15, DateTime.UtcNow.AddDays(-30), DateTime.UtcNow, new List<Guid> { Guid.NewGuid() })
        });

    public Task<CustomerOrderPattern> GetCustomerPatternAsync(Guid customerId, CancellationToken ct = default)
        => Task.FromResult(new CustomerOrderPattern(customerId, "Test Customer", 5, 12500.00m, 14.0, new() { "TST-001" }));
}
