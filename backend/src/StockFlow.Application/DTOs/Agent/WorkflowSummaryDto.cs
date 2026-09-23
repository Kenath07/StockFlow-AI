namespace StockFlow.Application.DTOs.Agent;

public record StartReorderRequestDto(
    string? Objective = "Automated Inventory Replenishment Analysis",
    string? TriggerSource = "Manager");

public record ReorderProposalDto(
    Guid Id,
    Guid ProductId,
    string ProductName,
    string ProductSku,
    int CurrentStock,
    int ProposedQuantity,
    decimal EstimatedCost,
    string Justification,
    int ConfidenceScore,
    bool IsApproved);

public record WorkflowSummaryDto(
    Guid Id,
    string Objective,
    string Status,
    string TriggerSource,
    string? InitiatedBy,
    DateTime CreatedAt,
    DateTime? CompletedAt,
    int TotalSteps,
    int CompletedSteps,
    List<ReorderProposalDto> Proposals,
    ApprovalGateSummaryDto? ApprovalGate,
    List<WorkflowStepDto>? Steps = null,
    List<ToolCallLogDto>? ToolCallLogs = null,
    List<ValidationResultDto>? ValidationResults = null,
    string? FailureReason = null);

public record WorkflowStepDto(
    Guid Id,
    int StepOrder,
    string AgentName,
    string Status,
    string? OutputJson,
    string? ErrorMessage,
    DateTime? StartedAt,
    DateTime? CompletedAt,
    int DurationMs,
    List<ToolCallLogDto> ToolCalls);

public record ToolCallLogDto(
    Guid Id,
    string ToolName,
    string InputJson,
    string? OutputJson,
    bool Success,
    int DurationMs,
    DateTime CalledAt);

public record ValidationResultDto(
    Guid Id,
    string ValidatorName,
    bool Passed,
    string? FailureReasons,
    DateTime ValidatedAt);

public record ApprovalGateSummaryDto(
    Guid Id,
    string Status,
    string? ReviewedBy,
    DateTime? ReviewedAt,
    string? ManagerComments,
    DateTime ExpiresAt);

public record ApproveRejectDto(
    bool Approve,
    string? Comments);

public record AgentPlanDto(
    string Objective,
    List<AgentStepPlanDto> Steps);

public record AgentStepPlanDto(
    int Order,
    string AgentName,
    string Description,
    List<string> Tools);

