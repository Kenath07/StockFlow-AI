namespace StockFlow.Agents.Tools;

public interface IFieldContextTool
{
    Task<List<FieldContextSignal>> GetRecentFieldSignalsAsync(int lookbackHours = 24, CancellationToken ct = default);
    Task<DeviceVerificationResult> VerifyDeviceCaptureAsync(string identifier, CancellationToken ct = default);
}

public record FieldContextSignal(
    Guid VisitId,
    Guid FieldAgentId,
    string AgentCode,
    string CustomerName,
    double Latitude,
    double Longitude,
    DateTime VisitedAt,
    int CaptureCount,
    List<string> ScannedSkus);

public record DeviceVerificationResult(
    bool IsVerified,
    string? ProductSku,
    string? ProductName,
    int? CurrentStock,
    string? FailureReason);
