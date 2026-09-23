using System.Text.Json;
using Microsoft.Extensions.Logging;
using StockFlow.Agents.State;
using StockFlow.Agents.Tools;

namespace StockFlow.Agents.SpecializedAgents;

/// <summary>
/// Component A (Student 1): Analyzes current stock levels, calculates velocity,
/// and identifies items that are below the low-stock threshold.
/// </summary>
public class InventoryAnalystAgent
{
    private readonly ToolRegistry _tools;
    private readonly ILogger<InventoryAnalystAgent> _logger;

    public InventoryAnalystAgent(ToolRegistry tools, ILogger<InventoryAnalystAgent> logger)
    {
        _tools = tools;
        _logger = logger;
    }

    public async Task<InventoryAnalysisResult> AnalyzeAsync(WorkflowState state, CancellationToken ct = default)
    {
        _logger.LogInformation("InventoryAnalystAgent starting for workflow {Id}", state.WorkflowId);

        var stepState = new StepState
        {
            Order = 1,
            AgentName = nameof(InventoryAnalystAgent),
            Status = "Running"
        };

        // Use allow-listed tool to fetch low-stock items
        var (lowStockJson, success) = await _tools.ExecuteAsync(
            "GetLowStockItems", new Dictionary<string, object?>(), stepState, ct);

        if (!success)
        {
            stepState.Status = "Failed";
            stepState.ErrorMessage = "Failed to retrieve low stock items.";
            state.Steps.Add(stepState);
            return new InventoryAnalysisResult(false, new(), "Tool call failed.");
        }

        var lowStockItems = JsonSerializer.Deserialize<List<LowStockItem>>(lowStockJson,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new();

        // Enrich each item with detailed stock info
        var enriched = new List<EnrichedStockItem>();
        foreach (var item in lowStockItems.Take(10)) // limit to top 10 most critical
        {
            var (infoJson, ok) = await _tools.ExecuteAsync(
                "GetStockInfo", new Dictionary<string, object?> { ["productId"] = item.ProductId.ToString() }, stepState, ct);

            if (ok)
            {
                var info = JsonSerializer.Deserialize<StockToolResult>(infoJson,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                if (info is not null)
                    enriched.Add(new EnrichedStockItem(item, info));
            }
        }

        // Share context with downstream agents
        state.SharedContext["LowStockItems"] = enriched;
        stepState.Status = "Completed";
        stepState.OutputJson = JsonSerializer.Serialize(enriched);
        state.Steps.Add(stepState);

        _logger.LogInformation("InventoryAnalystAgent found {Count} low-stock items", enriched.Count);
        return new InventoryAnalysisResult(true, enriched, null);
    }
}

public record InventoryAnalysisResult(bool Success, List<EnrichedStockItem> Items, string? ErrorMessage);
public record EnrichedStockItem(LowStockItem BasicInfo, StockToolResult DetailedInfo);

internal static class StepStateExtensions
{
    internal static DateTime? StartedAt { get; set; }
}

public static class StepStateHelper
{
    public static DateTime? GetStartTime(this StepState step) => null;
}
