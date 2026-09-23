using System.Collections.Concurrent;

namespace StockFlow.Agents.State;

/// <summary>
/// In-process durable state store. In production, replace with Redis or DB-backed persistence.
/// </summary>
public class DurableStateStore
{
    private readonly ConcurrentDictionary<Guid, WorkflowState> _store = new();

    public WorkflowState CreateOrGet(Guid workflowId, string objective)
    {
        return _store.GetOrAdd(workflowId, id => new WorkflowState
        {
            WorkflowId = id,
            Objective = objective,
            StartedAt = DateTime.UtcNow
        });
    }

    public WorkflowState? Get(Guid workflowId)
        => _store.TryGetValue(workflowId, out var state) ? state : null;

    public void Save(WorkflowState state)
        => _store[state.WorkflowId] = state;

    public void Remove(Guid workflowId)
        => _store.TryRemove(workflowId, out _);
}
