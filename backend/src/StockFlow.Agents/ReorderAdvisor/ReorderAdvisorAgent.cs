using Microsoft.Extensions.Logging;
using StockFlow.Agents.SpecializedAgents;
using StockFlow.Agents.State;
using StockFlow.Agents.Tools;

namespace StockFlow.Agents.ReorderAdvisor;

/// <summary>
/// Component D (Student 4): Calculates optimal reorder proposals using the QuantityCalculator
/// based on data gathered by all three specialized agents. Does NOT mutate stock directly.
/// </summary>
public class ReorderAdvisorAgent
{
    private readonly ILogger<ReorderAdvisorAgent> _logger;

    public ReorderAdvisorAgent(ILogger<ReorderAdvisorAgent> logger)
    {
        _logger = logger;
    }

    public Task<List<ProposalState>> ProposeAsync(WorkflowState state, CancellationToken ct = default)
    {
        _logger.LogInformation("ReorderAdvisorAgent generating proposals for workflow {Id}", state.WorkflowId);

        var stepState = new StepState
        {
            Order = 4,
            AgentName = nameof(ReorderAdvisorAgent),
            Status = "Running"
        };

        var lowStockItems = state.SharedContext.TryGetValue("LowStockItems", out var ctx)
            ? ctx as List<EnrichedStockItem> ?? new()
            : new List<EnrichedStockItem>();

        var demandSignals = state.SharedContext.TryGetValue("DemandSignals", out var ds)
            ? ds as List<OrderDemandSignal> ?? new()
            : new List<OrderDemandSignal>();

        var fieldEvidenceMap = state.SharedContext.TryGetValue("FieldEvidenceMap", out var fe)
            ? fe as Dictionary<string, int> ?? new()
            : new Dictionary<string, int>();

        var proposals = new List<ProposalState>();
        foreach (var item in lowStockItems)
        {
            ct.ThrowIfCancellationRequested();

            var demand = demandSignals.FirstOrDefault(s => s.ProductId == item.BasicInfo.ProductId);
            var fieldScans = fieldEvidenceMap.TryGetValue(item.BasicInfo.Sku, out var fc) ? fc : 0;
            var avgDemand = demand?.AverageDailyDemand ?? 0;

            var (qty, confidence, justification) = QuantityCalculator.Calculate(item, avgDemand, fieldScans);

            var unitCost = item.BasicInfo.UnitCost > 0 ? item.BasicInfo.UnitCost : 250.00m;

            proposals.Add(new ProposalState
            {
                ProductId = item.BasicInfo.ProductId,
                ProductName = item.BasicInfo.ProductName,
                ProductSku = item.BasicInfo.Sku,
                CurrentStock = item.BasicInfo.QuantityOnHand,
                ProposedQuantity = qty,
                EstimatedCost = qty * unitCost,
                Justification = justification,
                ConfidenceScore = confidence
            });
        }

        // Sort by confidence desc
        proposals = proposals.OrderByDescending(p => p.ConfidenceScore).ToList();
        state.Proposals = proposals;
        stepState.Status = "Completed";
        state.Steps.Add(stepState);

        _logger.LogInformation("ReorderAdvisorAgent generated {Count} proposals", proposals.Count);
        return Task.FromResult(proposals);
    }
}
