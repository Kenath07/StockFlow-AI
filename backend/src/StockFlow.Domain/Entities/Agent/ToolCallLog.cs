namespace StockFlow.Domain.Entities.Agent;

public class ToolCallLog : BaseEntity
{
    public Guid WorkflowStepId { get; set; }
    public WorkflowStep WorkflowStep { get; set; } = null!;

    public string ToolName { get; set; } = string.Empty;
    public string InputJson { get; set; } = "{}";
    public string? OutputJson { get; set; }
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public int DurationMs { get; set; }
    public DateTime CalledAt { get; set; } = DateTime.UtcNow;
}
