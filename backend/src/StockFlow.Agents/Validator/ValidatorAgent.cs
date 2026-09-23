using Microsoft.Extensions.Logging;
using StockFlow.Agents.State;

namespace StockFlow.Agents.Validator;

/// <summary>
/// Component D (Student 4): Orchestrates both SchemaValidator and BusinessRuleValidator
/// and records results into the workflow state.
/// </summary>
public class ValidatorAgent
{
    private readonly SchemaValidator _schemaValidator;
    private readonly BusinessRuleValidator _businessRuleValidator;
    private readonly ILogger<ValidatorAgent> _logger;

    public ValidatorAgent(
        SchemaValidator schemaValidator,
        BusinessRuleValidator businessRuleValidator,
        ILogger<ValidatorAgent> logger)
    {
        _schemaValidator = schemaValidator;
        _businessRuleValidator = businessRuleValidator;
        _logger = logger;
    }

    public ValidatorResult ValidateProposals(WorkflowState state)
    {
        var stepState = new StepState
        {
            Order = 5,
            AgentName = nameof(ValidatorAgent),
            Status = "Running"
        };

        var schemaResult = _schemaValidator.Validate(state.Proposals);
        var businessResult = _businessRuleValidator.Validate(state.Proposals);

        var allErrors = schemaResult.Errors.Concat(businessResult.Errors).ToList();
        var passed = schemaResult.Passed && businessResult.Passed;

        stepState.Status = passed ? "Completed" : "Failed";
        stepState.OutputJson = System.Text.Json.JsonSerializer.Serialize(new
        {
            SchemaValidation = schemaResult,
            BusinessRuleValidation = businessResult,
            OverallPassed = passed
        });

        state.Steps.Add(stepState);

        if (!passed)
            _logger.LogWarning("ValidatorAgent FAILED for workflow {Id}: {Errors}", state.WorkflowId, string.Join("; ", allErrors));
        else
            _logger.LogInformation("ValidatorAgent PASSED for workflow {Id}", state.WorkflowId);

        return new ValidatorResult(passed, allErrors, schemaResult, businessResult);
    }
}

public record ValidatorResult(
    bool Passed,
    List<string> AllErrors,
    ValidationReport SchemaReport,
    ValidationReport BusinessReport);
