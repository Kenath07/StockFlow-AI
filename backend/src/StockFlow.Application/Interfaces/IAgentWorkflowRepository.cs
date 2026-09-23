using StockFlow.Domain.Entities.Agent;
using StockFlow.Domain.Entities.Product;
using StockFlow.Domain.Enums;

namespace StockFlow.Application.Interfaces;

public interface IAgentWorkflowRepository
{
    Task<AgentWorkflow?> GetByIdAsync(Guid workflowId, CancellationToken ct = default);
    Task<List<AgentWorkflow>> GetAllAsync(WorkflowStatus? status = null, CancellationToken ct = default);
    Task AddAsync(AgentWorkflow workflow, CancellationToken ct = default);
    Task UpdateAsync(AgentWorkflow workflow, CancellationToken ct = default);
    Task<StockLevel?> GetStockLevelByProductAsync(Guid productId, CancellationToken ct = default);
    Task AddStockMovementAsync(StockMovement movement, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
