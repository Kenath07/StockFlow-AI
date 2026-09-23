using System.Text.Json;
using StockFlow.Agents.State;

namespace StockFlow.Agents.Validator;

/// <summary>
/// Validates that proposals conform to the expected JSON schema (structural validation).
/// </summary>
public class SchemaValidator
{
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    public ValidationReport Validate(List<ProposalState> proposals)
    {
        var errors = new List<string>();

        for (var i = 0; i < proposals.Count; i++)
        {
            var p = proposals[i];
            if (p.ProductId == Guid.Empty) errors.Add($"Proposal[{i}]: ProductId is empty.");
            if (string.IsNullOrWhiteSpace(p.ProductName)) errors.Add($"Proposal[{i}]: ProductName is required.");
            if (string.IsNullOrWhiteSpace(p.ProductSku)) errors.Add($"Proposal[{i}]: ProductSku is required.");
            if (p.ProposedQuantity <= 0) errors.Add($"Proposal[{i}]: ProposedQuantity must be > 0.");
            if (p.EstimatedCost < 0) errors.Add($"Proposal[{i}]: EstimatedCost cannot be negative.");
            if (string.IsNullOrWhiteSpace(p.Justification)) errors.Add($"Proposal[{i}]: Justification is required.");
            if (p.ConfidenceScore < 0 || p.ConfidenceScore > 100) errors.Add($"Proposal[{i}]: ConfidenceScore must be 0-100.");
        }

        return new ValidationReport("SchemaValidator", errors.Count == 0, errors);
    }
}

/// <summary>
/// Validates business rules deterministically before any state mutation.
/// </summary>
public class BusinessRuleValidator
{
    // Maximum single reorder quantity
    private const int MaxReorderQuantity = 10_000;
    // Minimum confidence threshold to allow auto-proposal
    private const int MinConfidenceThreshold = 30;

    public ValidationReport Validate(List<ProposalState> proposals)
    {
        var errors = new List<string>();

        foreach (var p in proposals)
        {
            if (p.ProposedQuantity > MaxReorderQuantity)
                errors.Add($"{p.ProductSku}: ProposedQuantity {p.ProposedQuantity} exceeds maximum allowed {MaxReorderQuantity}.");

            if (p.ConfidenceScore < MinConfidenceThreshold)
                errors.Add($"{p.ProductSku}: ConfidenceScore {p.ConfidenceScore} below minimum threshold {MinConfidenceThreshold}.");

            if (p.CurrentStock < 0)
                errors.Add($"{p.ProductSku}: CurrentStock cannot be negative.");

            if (p.EstimatedCost > 5_000_000m)
                errors.Add($"{p.ProductSku}: EstimatedCost {p.EstimatedCost:C} exceeds single-order limit.");
        }

        return new ValidationReport("BusinessRuleValidator", errors.Count == 0, errors);
    }
}

public record ValidationReport(string ValidatorName, bool Passed, List<string> Errors);
