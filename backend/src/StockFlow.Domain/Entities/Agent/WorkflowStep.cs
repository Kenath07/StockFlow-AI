namespace StockFlow.Domain.Entities.Agent;

public class WorkflowStep : BaseEntity
{
    public Guid AgentWorkflowId { get; set; }
    public AgentWorkflow AgentWorkflow { get; set; } = null!;

    public int StepOrder { get; set; }
    public string AgentName { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending"; // Pending | Running | Completed | Failed
    public string? InputJson { get; set; }
    public string? OutputJson { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int DurationMs { get; set; } = 0;

    public ICollection<ToolCallLog> ToolCallLogs { get; set; } = new List<ToolCallLog>();
    public ICollection<ValidationResult> ValidationResults { get; set; } = new List<ValidationResult>();
}
