namespace StockFlow.Domain.Entities.Agent;

public class ReorderProposal : BaseEntity
{
    public Guid AgentWorkflowId { get; set; }
    public AgentWorkflow AgentWorkflow { get; set; } = null!;

    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSku { get; set; } = string.Empty;
    public int CurrentStock { get; set; }
    public int ProposedQuantity { get; set; }
    public decimal EstimatedCost { get; set; }
    public string Justification { get; set; } = string.Empty;
    public int ConfidenceScore { get; set; } // 0-100
    public bool IsApproved { get; set; } = false;
}
