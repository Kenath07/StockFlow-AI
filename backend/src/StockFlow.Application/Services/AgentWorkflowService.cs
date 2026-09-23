using Microsoft.Extensions.Logging;
using StockFlow.Application.DTOs.Agent;
using StockFlow.Application.Interfaces;
using StockFlow.Domain.Entities.Agent;
using StockFlow.Domain.Enums;

namespace StockFlow.Application.Services;

public class AgentWorkflowService : IAgentWorkflowService
{
    private readonly IAgentWorkflowRepository _workflowRepo;
    private readonly IAgentOrchestrator _orchestrator;
    private readonly INotificationService _notifications;
    private readonly ILogger<AgentWorkflowService> _logger;

    public AgentWorkflowService(
        IAgentWorkflowRepository workflowRepo,
        IAgentOrchestrator orchestrator,
        INotificationService notifications,
        ILogger<AgentWorkflowService> logger)
    {
        _workflowRepo = workflowRepo;
        _orchestrator = orchestrator;
        _notifications = notifications;
        _logger = logger;
    }

    public async Task<WorkflowSummaryDto> StartReorderWorkflowAsync(StartReorderRequestDto dto, string initiatedBy, CancellationToken ct = default)
    {
        var workflow = new AgentWorkflow
        {
            Objective = dto.Objective ?? "Automated Inventory Replenishment Analysis",
            TriggerSource = dto.TriggerSource ?? "Manager",
            InitiatedBy = initiatedBy,
            Status = WorkflowStatus.Pending
        };
        await _workflowRepo.AddAsync(workflow, ct);
        await _workflowRepo.SaveChangesAsync(ct);

        // Run orchestrator pipeline
        await _orchestrator.RunAsync(workflow.Id, ct);

        var result = await GetWorkflowAsync(workflow.Id, ct) ?? throw new InvalidOperationException("Failed to retrieve workflow.");

        // Mandatory SMS/email notification for Human-in-the-Loop gate
        if (result.Status == WorkflowStatus.PendingManagerApproval.ToString())
        {
            await _notifications.NotifyApprovalRequiredAsync(workflow.Id, "manager@stockflow.local", ct);
            _logger.LogInformation("Manager notified for pending approval on workflow {Id}", workflow.Id);
        }

        _logger.LogInformation("Reorder workflow {Id} started by {User}", workflow.Id, initiatedBy);
        return result;
    }

    public async Task<WorkflowSummaryDto?> GetWorkflowAsync(Guid workflowId, CancellationToken ct = default)
    {
        var w = await _workflowRepo.GetByIdAsync(workflowId, ct);
        return w is null ? null : ToDto(w);
    }

    public async Task<List<WorkflowSummaryDto>> GetAllWorkflowsAsync(string? status = null, CancellationToken ct = default)
    {
        WorkflowStatus? workflowStatus = null;
        if (status is not null && Enum.TryParse<WorkflowStatus>(status, ignoreCase: true, out var s))
            workflowStatus = s;

        var workflows = await _workflowRepo.GetAllAsync(workflowStatus, ct);
        return workflows.Select(w => ToDto(w)).ToList();
    }

    public async Task<WorkflowSummaryDto> ApproveWorkflowAsync(Guid workflowId, ApproveRejectDto dto, string reviewedBy, CancellationToken ct = default)
    {
        var workflow = await _workflowRepo.GetByIdAsync(workflowId, ct)
            ?? throw new KeyNotFoundException($"Workflow {workflowId} not found.");

        if (workflow.Status != WorkflowStatus.PendingManagerApproval)
            throw new InvalidOperationException("Workflow is not pending approval.");

        var gate = workflow.ApprovalGate ?? throw new InvalidOperationException("No approval gate found.");
        gate.Status = ApprovalStatus.Approved;
        gate.ReviewedBy = reviewedBy;
        gate.ReviewedAt = DateTime.UtcNow;
        gate.ManagerComments = dto.Comments;

        // CRITICAL: Now that Manager has approved, execute the stock mutations
        foreach (var proposal in workflow.ReorderProposals)
        {
            var stockLevel = await _workflowRepo.GetStockLevelByProductAsync(proposal.ProductId, ct);
            if (stockLevel is not null)
            {
                stockLevel.QuantityOnHand += proposal.ProposedQuantity;
                stockLevel.LastRestockedAt = DateTime.UtcNow;

                await _workflowRepo.AddStockMovementAsync(new Domain.Entities.Product.StockMovement
                {
                    ProductId = proposal.ProductId,
                    Type = MovementType.Restock,
                    Quantity = proposal.ProposedQuantity,
                    ReferenceNumber = $"REORDER-{workflowId.ToString()[..8].ToUpper()}",
                    Notes = $"Manager-approved reorder. Justification: {proposal.Justification}",
                    PerformedBy = reviewedBy
                }, ct);

                proposal.IsApproved = true;
            }
        }

        workflow.Status = WorkflowStatus.Completed;
        workflow.CompletedAt = DateTime.UtcNow;
        await _workflowRepo.UpdateAsync(workflow, ct);
        await _workflowRepo.SaveChangesAsync(ct);

        _logger.LogInformation("Workflow {Id} APPROVED by {Manager}. {Count} products restocked.", workflowId, reviewedBy, workflow.ReorderProposals.Count);
        return ToDto(workflow);
    }

    public async Task<WorkflowSummaryDto> RejectWorkflowAsync(Guid workflowId, ApproveRejectDto dto, string reviewedBy, CancellationToken ct = default)
    {
        var workflow = await _workflowRepo.GetByIdAsync(workflowId, ct)
            ?? throw new KeyNotFoundException($"Workflow {workflowId} not found.");

        if (workflow.Status != WorkflowStatus.PendingManagerApproval)
            throw new InvalidOperationException("Workflow is not pending approval.");

        var gate = workflow.ApprovalGate ?? throw new InvalidOperationException("No approval gate found.");
        gate.Status = ApprovalStatus.Rejected;
        gate.ReviewedBy = reviewedBy;
        gate.ReviewedAt = DateTime.UtcNow;
        gate.ManagerComments = dto.Comments;

        workflow.Status = WorkflowStatus.Rejected;
        await _workflowRepo.UpdateAsync(workflow, ct);
        await _workflowRepo.SaveChangesAsync(ct);

        _logger.LogInformation("Workflow {Id} REJECTED by {Manager}.", workflowId, reviewedBy);
        return ToDto(workflow);
    }

    private static WorkflowSummaryDto ToDto(AgentWorkflow w)
    {
        var steps = w.Steps.OrderBy(s => s.StepOrder).Select(s => new WorkflowStepDto(
            s.Id, s.StepOrder, s.AgentName, s.Status,
            s.OutputJson, s.ErrorMessage, s.StartedAt, s.CompletedAt, s.DurationMs,
            s.ToolCallLogs.Select(tc => new ToolCallLogDto(
                tc.Id, tc.ToolName, tc.InputJson, tc.OutputJson,
                tc.Success, tc.DurationMs, tc.CalledAt)).ToList()
        )).ToList();

        var allToolCalls = steps.SelectMany(s => s.ToolCalls).ToList();

        var allValidations = w.Steps.SelectMany(s => s.ValidationResults)
            .Select(v => new ValidationResultDto(v.Id, v.ValidatorName, v.Passed, v.FailureReasons, v.ValidatedAt))
            .ToList();

        return new WorkflowSummaryDto(
            w.Id, w.Objective, w.Status.ToString(), w.TriggerSource, w.InitiatedBy,
            w.CreatedAt, w.CompletedAt,
            w.Steps.Count, w.Steps.Count(s => s.Status == "Completed"),
            w.ReorderProposals.Select(p => new ReorderProposalDto(
                p.Id, p.ProductId, p.ProductName, p.ProductSku,
                p.CurrentStock, p.ProposedQuantity, p.EstimatedCost,
                p.Justification, p.ConfidenceScore, p.IsApproved)).ToList(),
            w.ApprovalGate is null ? null : new ApprovalGateSummaryDto(
                w.ApprovalGate.Id, w.ApprovalGate.Status.ToString(),
                w.ApprovalGate.ReviewedBy, w.ApprovalGate.ReviewedAt,
                w.ApprovalGate.ManagerComments, w.ApprovalGate.ExpiresAt),
            steps, allToolCalls, allValidations, w.FailureReason);
    }
}
