using Microsoft.EntityFrameworkCore;
using StockFlow.Application.Interfaces;
using StockFlow.Domain.Entities.Agent;
using StockFlow.Domain.Enums;
using StockFlow.Infrastructure.Persistence;

namespace StockFlow.Infrastructure.Repositories;

public class AgentWorkflowRepository : IAgentWorkflowRepository
{
    private readonly ApplicationDbContext _context;

    public AgentWorkflowRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<AgentWorkflow?> GetByIdAsync(Guid workflowId, CancellationToken ct = default)
    {
        return await _context.AgentWorkflows
            .Include(w => w.Steps)
                .ThenInclude(s => s.ToolCallLogs)
            .Include(w => w.Steps)
                .ThenInclude(s => s.ValidationResults)
            .Include(w => w.ReorderProposals)
            .Include(w => w.ApprovalGate)
            .FirstOrDefaultAsync(w => w.Id == workflowId, ct);
    }

    public async Task<List<AgentWorkflow>> GetAllAsync(WorkflowStatus? status = null, CancellationToken ct = default)
    {
        var query = _context.AgentWorkflows
            .Include(w => w.ReorderProposals)
            .Include(w => w.ApprovalGate)
            .Include(w => w.Steps)
            .AsQueryable();

        if (status.HasValue)
            query = query.Where(w => w.Status == status.Value);

        return await query
            .OrderByDescending(w => w.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task AddAsync(AgentWorkflow workflow, CancellationToken ct = default)
    {
        await _context.AgentWorkflows.AddAsync(workflow, ct);
    }

    public Task UpdateAsync(AgentWorkflow workflow, CancellationToken ct = default)
    {
        _context.AgentWorkflows.Update(workflow);
        return Task.CompletedTask;
    }

    public async Task<Domain.Entities.Product.StockLevel?> GetStockLevelByProductAsync(Guid productId, CancellationToken ct = default)
    {
        return await _context.StockLevels
            .FirstOrDefaultAsync(s => s.ProductId == productId, ct);
    }

    public async Task AddStockMovementAsync(Domain.Entities.Product.StockMovement movement, CancellationToken ct = default)
    {
        await _context.StockMovements.AddAsync(movement, ct);
    }

    public async Task SaveChangesAsync(CancellationToken ct = default)
    {
        await _context.SaveChangesAsync(ct);
    }
}
