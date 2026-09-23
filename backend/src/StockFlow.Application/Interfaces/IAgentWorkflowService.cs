using StockFlow.Application.DTOs.Agent;

namespace StockFlow.Application.Interfaces;

public interface IAgentWorkflowService
{
    Task<WorkflowSummaryDto> StartReorderWorkflowAsync(StartReorderRequestDto dto, string initiatedBy, CancellationToken ct = default);
    Task<WorkflowSummaryDto?> GetWorkflowAsync(Guid workflowId, CancellationToken ct = default);
    Task<List<WorkflowSummaryDto>> GetAllWorkflowsAsync(string? status = null, CancellationToken ct = default);
    Task<WorkflowSummaryDto> ApproveWorkflowAsync(Guid workflowId, ApproveRejectDto dto, string reviewedBy, CancellationToken ct = default);
    Task<WorkflowSummaryDto> RejectWorkflowAsync(Guid workflowId, ApproveRejectDto dto, string reviewedBy, CancellationToken ct = default);
}

public interface IAgentOrchestrator
{
    Task<Guid> RunAsync(Guid workflowId, CancellationToken ct = default);
}
