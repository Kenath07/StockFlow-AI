using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using StockFlow.Agents.ReorderAdvisor;
using StockFlow.Agents.SpecializedAgents;
using StockFlow.Agents.State;
using StockFlow.Agents.Validator;
using StockFlow.Application.Interfaces;
using StockFlow.Domain.Entities.Agent;
using StockFlow.Domain.Enums;
using StockFlow.Infrastructure.Persistence;

namespace StockFlow.Agents.Orchestrator;

/// <summary>
/// Component D (Student 4): Master orchestrator executing the full 5-agent pipeline:
/// 1. InventoryAnalystAgent  2. DemandOrderContextAgent  3. FieldContextAgent
/// 4. ReorderAdvisorAgent  5. ValidatorAgent
/// Halts at PendingManagerApproval — no DB mutation until Manager explicitly approves.
/// </summary>
public class AgentOrchestrator : IAgentOrchestrator
{
    private readonly InventoryAnalystAgent _inventoryAgent;
    private readonly DemandOrderContextAgent _demandAgent;
    private readonly FieldContextAgent _fieldAgent;
    private readonly ReorderAdvisorAgent _advisorAgent;
    private readonly ValidatorAgent _validatorAgent;
    private readonly DurableStateStore _stateStore;
    private readonly ApplicationDbContext _db;
    private readonly ILogger<AgentOrchestrator> _logger;

    public AgentOrchestrator(
        InventoryAnalystAgent inventoryAgent,
        DemandOrderContextAgent demandAgent,
        FieldContextAgent fieldAgent,
        ReorderAdvisorAgent advisorAgent,
        ValidatorAgent validatorAgent,
        DurableStateStore stateStore,
        ApplicationDbContext db,
        ILogger<AgentOrchestrator> logger)
    {
        _inventoryAgent = inventoryAgent;
        _demandAgent = demandAgent;
        _fieldAgent = fieldAgent;
        _advisorAgent = advisorAgent;
        _validatorAgent = validatorAgent;
        _stateStore = stateStore;
        _db = db;
        _logger = logger;
    }

    public async Task<Guid> RunAsync(Guid workflowId, CancellationToken ct = default)
    {
        var dbWorkflow = await _db.AgentWorkflows
            .Include(w => w.Steps)
            .Include(w => w.ReorderProposals)
            .FirstOrDefaultAsync(w => w.Id == workflowId, ct)
            ?? throw new KeyNotFoundException($"Workflow {workflowId} not found.");

        dbWorkflow.Status = WorkflowStatus.Executing;
        await _db.SaveChangesAsync(ct);

        var state = _stateStore.CreateOrGet(workflowId, dbWorkflow.Objective);
        state.Status = WorkflowStatus.Executing;

        try
        {
            // === Step 1: Inventory Analysis ===
            var invResult = await _inventoryAgent.AnalyzeAsync(state, ct);
            await PersistStepAsync(dbWorkflow, state.Steps.Last(), ct);

            if (!invResult.Success)
                return await FailAsync(dbWorkflow, state, "InventoryAnalystAgent failed.", ct);

            if (!invResult.Items.Any())
            {
                _logger.LogInformation("Workflow {Id}: No low-stock items found. Completing.", workflowId);
                dbWorkflow.Status = WorkflowStatus.Completed;
                dbWorkflow.CompletedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync(ct);
                return workflowId;
            }

            // === Step 2: Demand Context ===
            await _demandAgent.AnalyzeAsync(state, ct);
            await PersistStepAsync(dbWorkflow, state.Steps.Last(), ct);

            // === Step 3: Field Context ===
            await _fieldAgent.EnrichAsync(state, ct);
            await PersistStepAsync(dbWorkflow, state.Steps.Last(), ct);

            // === Step 4: Reorder Proposals ===
            var proposals = await _advisorAgent.ProposeAsync(state, ct);
            await PersistStepAsync(dbWorkflow, state.Steps.Last(), ct);

            // === Step 5: Validation ===
            var validationResult = _validatorAgent.ValidateProposals(state);
            await PersistStepAsync(dbWorkflow, state.Steps.Last(), ct);

            if (!validationResult.Passed)
                return await FailAsync(dbWorkflow, state,
                    $"Validation failed: {string.Join("; ", validationResult.AllErrors)}", ct);

            // === Persist Proposals to DB ===
            foreach (var p in proposals)
            {
                _db.ReorderProposals.Add(new ReorderProposal
                {
                    AgentWorkflowId = workflowId,
                    ProductId = p.ProductId,
                    ProductName = p.ProductName,
                    ProductSku = p.ProductSku,
                    CurrentStock = p.CurrentStock,
                    ProposedQuantity = p.ProposedQuantity,
                    EstimatedCost = p.EstimatedCost,
                    Justification = p.Justification,
                    ConfidenceScore = p.ConfidenceScore
                });
            }

            // === HUMAN-IN-THE-LOOP GATE ===
            // Workflow stops here. NO stock mutation occurs until Manager explicitly approves.
            var proposalSummary = System.Text.Json.JsonSerializer.Serialize(proposals.Select(p => new
            {
                p.ProductName, p.ProductSku, p.CurrentStock, p.ProposedQuantity, p.EstimatedCost, p.ConfidenceScore
            }));

            _db.ApprovalGates.Add(new ApprovalGate
            {
                AgentWorkflowId = workflowId,
                Status = ApprovalStatus.Pending,
                ProposalSummaryJson = proposalSummary,
                ExpiresAt = DateTime.UtcNow.AddHours(48)
            });

            dbWorkflow.Status = WorkflowStatus.PendingManagerApproval;
            state.Status = WorkflowStatus.PendingManagerApproval;
            _stateStore.Save(state);
            await _db.SaveChangesAsync(ct);

            _logger.LogInformation("Workflow {Id} paused at PendingManagerApproval with {Count} proposals.", workflowId, proposals.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Workflow {Id} crashed during orchestration.", workflowId);
            await FailAsync(dbWorkflow, state, ex.Message, ct);
        }

        return workflowId;
    }

    private async Task PersistStepAsync(AgentWorkflow workflow, StepState step, CancellationToken ct)
    {
        var dbStep = new WorkflowStep
        {
            AgentWorkflowId = workflow.Id,
            StepOrder = step.Order,
            AgentName = step.AgentName,
            Status = step.Status,
            OutputJson = step.OutputJson,
            ErrorMessage = step.ErrorMessage,
            StartedAt = DateTime.UtcNow,
            CompletedAt = DateTime.UtcNow
        };

        foreach (var tc in step.ToolCalls)
        {
            dbStep.ToolCallLogs.Add(new ToolCallLog
            {
                ToolName = tc.ToolName,
                InputJson = tc.InputJson,
                OutputJson = tc.OutputJson,
                Success = tc.Success,
                DurationMs = tc.DurationMs,
                CalledAt = DateTime.UtcNow
            });
        }

        if (step.AgentName.Contains("Validator") && !string.IsNullOrEmpty(step.OutputJson))
        {
            try
            {
                using var doc = System.Text.Json.JsonDocument.Parse(step.OutputJson);
                var root = doc.RootElement;
                if (root.TryGetProperty("SchemaValidation", out var sv))
                {
                    bool svPassed = sv.TryGetProperty("Passed", out var p) && p.GetBoolean();
                    string? errs = sv.TryGetProperty("Errors", out var e) ? e.ToString() : null;
                    dbStep.ValidationResults.Add(new ValidationResult
                    {
                        ValidatorName = "Schema Validator",
                        Passed = svPassed,
                        FailureReasons = errs,
                        ValidatedAt = DateTime.UtcNow
                    });
                }
                if (root.TryGetProperty("BusinessRuleValidation", out var bv))
                {
                    bool bvPassed = bv.TryGetProperty("Passed", out var bp) && bp.GetBoolean();
                    string? errs = bv.TryGetProperty("Errors", out var be) ? be.ToString() : null;
                    dbStep.ValidationResults.Add(new ValidationResult
                    {
                        ValidatorName = "Business Rule Validator",
                        Passed = bvPassed,
                        FailureReasons = errs,
                        ValidatedAt = DateTime.UtcNow
                    });
                }
            }
            catch { }
        }

        await _db.WorkflowSteps.AddAsync(dbStep, ct);
        await _db.SaveChangesAsync(ct);
    }

    private async Task<Guid> FailAsync(AgentWorkflow workflow, WorkflowState state, string reason, CancellationToken ct)
    {
        workflow.Status = WorkflowStatus.Failed;
        workflow.FailureReason = reason;
        state.Status = WorkflowStatus.Failed;
        state.FailureReason = reason;
        _stateStore.Save(state);
        await _db.SaveChangesAsync(ct);
        _logger.LogError("Workflow {Id} failed: {Reason}", workflow.Id, reason);
        return workflow.Id;
    }
}
