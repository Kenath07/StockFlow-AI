using Microsoft.EntityFrameworkCore;
using StockFlow.Application.Interfaces;
using StockFlow.Domain.Entities.Order;
using StockFlow.Domain.Enums;
using StockFlow.Infrastructure.Persistence;

namespace StockFlow.Infrastructure.Repositories;

public class OrderRepository : IOrderRepository
{
    private readonly ApplicationDbContext _context;

    public OrderRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<SalesOrder>> GetAllAsync(OrderStatus? status = null, CancellationToken ct = default)
    {
        var query = _context.SalesOrders
            .Include(o => o.Customer)
            .Include(o => o.Lines)
                .ThenInclude(l => l.Product)
            .AsQueryable();

        if (status.HasValue)
            query = query.Where(o => o.Status == status.Value);

        return await query
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<SalesOrder?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.SalesOrders
            .Include(o => o.Customer)
            .Include(o => o.Lines)
                .ThenInclude(l => l.Product)
            .FirstOrDefaultAsync(o => o.Id == id, ct);
    }

    public async Task<List<SalesOrder>> GetByFieldAgentAsync(Guid fieldAgentId, CancellationToken ct = default)
    {
        return await _context.SalesOrders
            .Include(o => o.Customer)
            .Include(o => o.Lines)
                .ThenInclude(l => l.Product)
            .Where(o => o.FieldAgentId == fieldAgentId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task AddAsync(SalesOrder order, CancellationToken ct = default)
    {
        await _context.SalesOrders.AddAsync(order, ct);
        await _context.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(SalesOrder order, CancellationToken ct = default)
    {
        _context.SalesOrders.Update(order);
        await _context.SaveChangesAsync(ct);
    }

    public async Task AddStatusHistoryAsync(OrderStatusHistory history, CancellationToken ct = default)
    {
        await _context.OrderStatusHistories.AddAsync(history, ct);
        await _context.SaveChangesAsync(ct);
    }
}
