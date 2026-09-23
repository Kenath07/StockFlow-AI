using System.Text.Json;
using Microsoft.Extensions.Logging;
using StockFlow.Agents.State;
using StockFlow.Agents.Tools;

namespace StockFlow.Agents.SpecializedAgents;

/// <summary>
/// Component C (Student 3): Enriches the reorder planning context with
/// field sales visit data, GPS coordinates, and QR/barcode scan evidence.
/// </summary>
public class FieldContextAgent
{
    private readonly ToolRegistry _tools;
    private readonly ILogger<FieldContextAgent> _logger;

    public FieldContextAgent(ToolRegistry tools, ILogger<FieldContextAgent> logger)
    {
        _tools = tools;
        _logger = logger;
    }

    public async Task<FieldContextResult> EnrichAsync(WorkflowState state, CancellationToken ct = default)
    {
        _logger.LogInformation("FieldContextAgent starting for workflow {Id}", state.WorkflowId);

        var stepState = new StepState
        {
            Order = 3,
            AgentName = nameof(FieldContextAgent),
            Status = "Running"
        };

        var (json, ok) = await _tools.ExecuteAsync("GetRecentFieldSignals",
            new Dictionary<string, object?> { ["lookbackHours"] = 48 },
            stepState, ct);

        var signals = new List<FieldContextSignal>();
        if (ok)
        {
            signals = JsonSerializer.Deserialize<List<FieldContextSignal>>(json,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new();
        }

        // Cross-reference scanned SKUs with low-stock items
        var lowStockItems = state.SharedContext.TryGetValue("LowStockItems", out var ctx)
            ? ctx as List<EnrichedStockItem> ?? new()
            : new List<EnrichedStockItem>();

        var fieldEvidenceMap = new Dictionary<string, int>(); // sku -> field demand count
        var validationResults = new List<DeviceVerificationResult>();

        foreach (var signal in signals)
        {
            foreach (var sku in signal.ScannedSkus)
            {
                fieldEvidenceMap.TryAdd(sku, 0);
                fieldEvidenceMap[sku]++;
                
                // Verify the device capture for the specific SKU to validate stock-check claims
                var (verifyJson, verifyOk) = await _tools.ExecuteAsync("VerifyDeviceCapture",
                    new Dictionary<string, object?> { ["identifier"] = sku }, stepState, ct);
                
                if (verifyOk)
                {
                    var result = JsonSerializer.Deserialize<DeviceVerificationResult>(verifyJson,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (result != null)
                    {
                        validationResults.Add(result);
                    }
                }
            }
        }

        state.SharedContext["FieldSignals"] = signals;
        state.SharedContext["FieldEvidenceMap"] = fieldEvidenceMap;
        state.SharedContext["DeviceValidations"] = validationResults;
        stepState.Status = "Completed";
        stepState.OutputJson = JsonSerializer.Serialize(new { VisitCount = signals.Count, FieldEvidenceMap = fieldEvidenceMap, Validations = validationResults });
        state.Steps.Add(stepState);

        _logger.LogInformation("FieldContextAgent: {VisitCount} recent visits, {SkuCount} unique SKUs scanned, {ValidCount} validations",
            signals.Count, fieldEvidenceMap.Count, validationResults.Count);
        return new FieldContextResult(true, signals, fieldEvidenceMap, validationResults, null);
    }
}

public record FieldContextResult(bool Success, List<FieldContextSignal> Signals, Dictionary<string, int> FieldEvidenceMap, List<DeviceVerificationResult> Validations, string? ErrorMessage);
