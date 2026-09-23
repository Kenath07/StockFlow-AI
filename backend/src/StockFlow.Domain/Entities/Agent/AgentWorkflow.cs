using StockFlow.Domain.Enums;

namespace StockFlow.Domain.Entities.Agent;

public class AgentWorkflow : BaseEntity
{
    public string TriggerSource { get; set; } = string.Empty; // System | Manager | ScheduledJob
    public string Objective { get; set; } = string.Empty;
    public WorkflowStatus Status { get; set; } = WorkflowStatus.Pending;
    public string? InitiatedBy { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? FailureReason { get; set; }
    public string? PlanJson { get; set; }

    public ICollection<WorkflowStep> Steps { get; set; } = new List<WorkflowStep>();
    public ICollection<ReorderProposal> ReorderProposals { get; set; } = new List<ReorderProposal>();
    public ApprovalGate? ApprovalGate { get; set; }
}
