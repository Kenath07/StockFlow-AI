namespace StockFlow.Domain.Enums;

public enum WorkflowStatus
{
    Pending,
    Planning,
    Executing,
    PendingManagerApproval,
    Approved,
    Rejected,
    Completed,
    Failed
}
