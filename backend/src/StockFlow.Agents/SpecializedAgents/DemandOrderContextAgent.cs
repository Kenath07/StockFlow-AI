using System.Text.Json;
using Microsoft.Extensions.Logging;
using StockFlow.Agents.State;
using StockFlow.Agents.Tools;

namespace StockFlow.Agents.SpecializedAgents;

/// <summary>
/// Component B (Student 2): Analyzes historical orders and demand patterns
/// to provide demand signals that inform reorder quantity decisions.
/// </summary>
public class DemandOrderContextAgent
{
    private readonly ToolRegistry _tools;
    private readonly ILogger<DemandOrderContextAgent> _logger;

    public DemandOrderContextAgent(ToolRegistry tools, ILogger<DemandOrderContextAgent> logger)
    {
        _tools = tools;
        _logger = logger;
    }

    public async Task<DemandAnalysisResult> AnalyzeAsync(WorkflowState state, CancellationToken ct = default)
    {
        _logger.LogInformation("DemandOrderContextAgent starting for workflow {Id}", state.WorkflowId);

        var stepState = new StepState
        {
            Order = 2,
            AgentName = nameof(DemandOrderContextAgent),
            Status = "Running"
        };

        var lowStockItems = state.SharedContext.TryGetValue("LowStockItems", out var ctx)
            ? ctx as List<EnrichedStockItem> ?? new()
            : new List<EnrichedStockItem>();

        var signals = new List<OrderDemandSignal>();
        var customerPatterns = new List<CustomerOrderPattern>();
        var processedCustomerIds = new HashSet<Guid>();

        foreach (var item in lowStockItems)
        {
            var (json, ok) = await _tools.ExecuteAsync("GetDemandSignals",
                new Dictionary<string, object?> { ["productId"] = item.BasicInfo.ProductId.ToString(), ["lookbackDays"] = 30 },
                stepState, ct);

            if (ok)
            {
                var itemSignals = JsonSerializer.Deserialize<List<OrderDemandSignal>>(json,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new();
                signals.AddRange(itemSignals);

                // Fetch customer patterns for top customers
                foreach (var signal in itemSignals)
                {
                    foreach (var customerId in signal.TopCustomerIds ?? new())
                    {
                        if (processedCustomerIds.Add(customerId))
                        {
                            var (custJson, custOk) = await _tools.ExecuteAsync("GetCustomerPattern",
                                new Dictionary<string, object?> { ["customerId"] = customerId.ToString() }, stepState, ct);

                            if (custOk)
                            {
                                var pattern = JsonSerializer.Deserialize<CustomerOrderPattern>(custJson,
                                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                                if (pattern != null)
                                {
                                    customerPatterns.Add(pattern);
                                }
                            }
                        }
                    }
                }
            }
        }

        state.SharedContext["DemandSignals"] = signals;
        state.SharedContext["CustomerPatterns"] = customerPatterns;
        stepState.Status = "Completed";
        stepState.OutputJson = JsonSerializer.Serialize(new { Signals = signals, CustomerPatterns = customerPatterns });
        state.Steps.Add(stepState);

        _logger.LogInformation("DemandOrderContextAgent analyzed {Count} demand signals and {CustCount} customer patterns", signals.Count, customerPatterns.Count);
        return new DemandAnalysisResult(true, signals, customerPatterns, null);
    }
}

public record DemandAnalysisResult(bool Success, List<OrderDemandSignal> Signals, List<CustomerOrderPattern> CustomerPatterns, string? ErrorMessage);
