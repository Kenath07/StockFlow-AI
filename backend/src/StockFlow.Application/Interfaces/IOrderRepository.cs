using StockFlow.Domain.Entities.Order;
using StockFlow.Domain.Enums;

namespace StockFlow.Application.Interfaces;

public interface IOrderRepository
{
    Task<List<SalesOrder>> GetAllAsync(OrderStatus? status = null, CancellationToken ct = default);
    Task<SalesOrder?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<List<SalesOrder>> GetByFieldAgentAsync(Guid fieldAgentId, CancellationToken ct = default);
    Task AddAsync(SalesOrder order, CancellationToken ct = default);
    Task UpdateAsync(SalesOrder order, CancellationToken ct = default);
    Task AddStatusHistoryAsync(OrderStatusHistory history, CancellationToken ct = default);
}
