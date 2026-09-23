namespace StockFlow.Domain.Entities.Agent;

public class ValidationResult : BaseEntity
{
    public Guid WorkflowStepId { get; set; }
    public WorkflowStep WorkflowStep { get; set; } = null!;

    public string ValidatorName { get; set; } = string.Empty; // SchemaValidator | BusinessRuleValidator
    public bool Passed { get; set; }
    public string? FailureReasons { get; set; } // JSON array of failure strings
    public string? InputSnapshot { get; set; }
    public DateTime ValidatedAt { get; set; } = DateTime.UtcNow;
}
