using StockFlow.Application.DTOs.Order;

namespace StockFlow.Application.Interfaces;

public interface IOrderService
{
    Task<List<SalesOrderDto>> GetAllAsync(string? status = null, CancellationToken ct = default);
    Task<SalesOrderDto?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<List<SalesOrderDto>> GetByFieldAgentAsync(Guid fieldAgentId, CancellationToken ct = default);
    Task<SalesOrderDto> CreateAsync(CreateOrderDto dto, string createdBy, Guid? fieldAgentId = null, CancellationToken ct = default);
    Task<SalesOrderDto> UpdateStatusAsync(Guid id, OrderStatusUpdateDto dto, string changedBy, CancellationToken ct = default);
    Task<bool> CancelAsync(Guid id, string reason, string cancelledBy, CancellationToken ct = default);
}

public interface ICustomerService
{
    Task<List<CustomerDto>> GetAllAsync(CancellationToken ct = default);
    Task<CustomerDto?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<CustomerDto> CreateAsync(CreateCustomerDto dto, string createdBy, CancellationToken ct = default);
    Task<CustomerDto> UpdateAsync(Guid id, CreateCustomerDto dto, string updatedBy, CancellationToken ct = default);
}
