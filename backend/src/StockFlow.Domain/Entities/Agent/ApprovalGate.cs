using StockFlow.Domain.Enums;

namespace StockFlow.Domain.Entities.Agent;

public class ApprovalGate : BaseEntity
{
    public Guid AgentWorkflowId { get; set; }
    public AgentWorkflow AgentWorkflow { get; set; } = null!;

    public ApprovalStatus Status { get; set; } = ApprovalStatus.Pending;
    public string? ReviewedBy { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ManagerComments { get; set; }
    public string ProposalSummaryJson { get; set; } = "{}";
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddHours(48);
}
