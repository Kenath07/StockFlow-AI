using System.Text.Json;
using Microsoft.Extensions.Logging;
using StockFlow.Agents.State;

namespace StockFlow.Agents.Tools;

/// <summary>
/// Dispatches allow-listed tool calls and records every invocation in the WorkflowState.
/// </summary>
public class ToolRegistry
{
    private readonly IStockTool _stockTool;
    private readonly IOrderHistoryTool _orderTool;
    private readonly IFieldContextTool _fieldTool;
    private readonly ILogger<ToolRegistry> _logger;

    // Allow-list: only these exact tool names can be invoked by agents
    private static readonly HashSet<string> AllowedTools = new(StringComparer.OrdinalIgnoreCase)
    {
        "GetStockInfo",
        "GetLowStockItems",
        "GetDemandSignals",
        "GetCustomerPattern",
        "GetRecentFieldSignals",
        "VerifyDeviceCapture"
    };

    public ToolRegistry(IStockTool stockTool, IOrderHistoryTool orderTool, IFieldContextTool fieldTool, ILogger<ToolRegistry> logger)
    {
        _stockTool = stockTool;
        _orderTool = orderTool;
        _fieldTool = fieldTool;
        _logger = logger;
    }

    public async Task<(string OutputJson, bool Success)> ExecuteAsync(
        string toolName, Dictionary<string, object?> args, StepState stepState, CancellationToken ct = default)
    {
        if (!AllowedTools.Contains(toolName))
        {
            var err = $"Tool '{toolName}' is not in the allow-list.";
            _logger.LogWarning(err);
            return ($"{{\"error\":\"{err}\"}}", false);
        }

        var sw = System.Diagnostics.Stopwatch.StartNew();
        var inputJson = JsonSerializer.Serialize(args);
        string outputJson;
        bool success;

        try
        {
            object? result = toolName.ToLower() switch
            {
                "getstockinfo" => await _stockTool.GetStockInfoAsync(GetGuid(args, "productId"), ct),
                "getlowstockitems" => await _stockTool.GetLowStockItemsAsync(ct),
                "getdemandsignals" => await _orderTool.GetDemandSignalsAsync(GetGuid(args, "productId"), GetInt(args, "lookbackDays", 30), ct),
                "getcustomerpattern" => await _orderTool.GetCustomerPatternAsync(GetGuid(args, "customerId"), ct),
                "getrecentfieldsignals" => await _fieldTool.GetRecentFieldSignalsAsync(GetInt(args, "lookbackHours", 24), ct),
                "verifydevicecapture" => await _fieldTool.VerifyDeviceCaptureAsync(GetString(args, "identifier"), ct),
                _ => throw new InvalidOperationException($"Unhandled tool: {toolName}")
            };
            outputJson = JsonSerializer.Serialize(result);
            success = true;
        }
        catch (Exception ex)
        {
            outputJson = JsonSerializer.Serialize(new { error = ex.Message });
            success = false;
            _logger.LogError(ex, "Tool {Tool} failed", toolName);
        }

        sw.Stop();
        stepState.ToolCalls.Add(new ToolCallState
        {
            ToolName = toolName,
            InputJson = inputJson,
            OutputJson = outputJson,
            Success = success,
            DurationMs = (int)sw.ElapsedMilliseconds
        });

        return (outputJson, success);
    }

    private static Guid GetGuid(Dictionary<string, object?> args, string key)
        => Guid.Parse(args[key]?.ToString() ?? throw new ArgumentException($"Missing argument: {key}"));

    private static int GetInt(Dictionary<string, object?> args, string key, int defaultVal = 0)
        => args.TryGetValue(key, out var v) && int.TryParse(v?.ToString(), out var i) ? i : defaultVal;

    private static string GetString(Dictionary<string, object?> args, string key)
        => args[key]?.ToString() ?? throw new ArgumentException($"Missing argument: {key}");
}
