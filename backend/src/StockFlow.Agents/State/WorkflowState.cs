using StockFlow.Domain.Enums;

namespace StockFlow.Agents.State;

/// <summary>
/// Durable in-memory workflow state tracking agent execution progress.
/// In production, this would be persisted to Redis or a database.
/// </summary>
public class WorkflowState
{
    public Guid WorkflowId { get; set; }
    public WorkflowStatus Status { get; set; } = WorkflowStatus.Pending;
    public string Objective { get; set; } = string.Empty;
    public List<StepState> Steps { get; set; } = new();
    public Dictionary<string, object> SharedContext { get; set; } = new();
    public List<ProposalState> Proposals { get; set; } = new();
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public string? FailureReason { get; set; }
}

public class StepState
{
    public int Order { get; set; }
    public string AgentName { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending";
    public string? OutputJson { get; set; }
    public string? ErrorMessage { get; set; }
    public List<ToolCallState> ToolCalls { get; set; } = new();
}

public class ToolCallState
{
    public string ToolName { get; set; } = string.Empty;
    public string InputJson { get; set; } = "{}";
    public string? OutputJson { get; set; }
    public bool Success { get; set; }
    public int DurationMs { get; set; }
}

public class ProposalState
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSku { get; set; } = string.Empty;
    public int CurrentStock { get; set; }
    public int ProposedQuantity { get; set; }
    public decimal EstimatedCost { get; set; }
    public string Justification { get; set; } = string.Empty;
    public int ConfidenceScore { get; set; }
}
