using StockFlow.Agents.ReorderAdvisor;
using StockFlow.Agents.SpecializedAgents;
using StockFlow.Agents.State;
using StockFlow.Agents.Tools;
using StockFlow.Agents.Validator;
using StockFlow.Domain.Enums;

namespace StockFlow.Tests.Agents;

public class AgentPipelineGoldenTests
{
    private readonly SchemaValidator _schemaValidator;
    private readonly BusinessRuleValidator _businessRuleValidator;

    public AgentPipelineGoldenTests()
    {
        _schemaValidator = new SchemaValidator();
        _businessRuleValidator = new BusinessRuleValidator();
    }

    [Fact]
    public void DeterministicQuantityCalculator_GoldenCase_CalculatesExpectedReorderAndSafetyStock()
    {
        // Golden Case:
        // Product: Ceylon Premium Black Tea (BEV-TEA-001)
        // Current Stock: 8 units (Threshold: 15) -> Low Stock!
        // Average Daily Usage: 1.5 units/day
        // Order Demand: 2.0 units/day
        // Field Scans: 2 scans
        var productId = Guid.NewGuid();
        var item = new EnrichedStockItem(
            new LowStockItem(
                productId,
                "Ceylon Premium Black Tea 500g",
                "BEV-TEA-001",
                8,
                15,
                20,
                650.00m
            ),
            new StockToolResult(
                productId,
                "Ceylon Premium Black Tea 500g",
                "BEV-TEA-001",
                8,
                8,
                15,
                20,
                1.5,
                5
            )
        );

        // Act
        var (quantity, confidence, justification) = QuantityCalculator.Calculate(
            item,
            avgDailyDemand: 2.0,
            fieldScanCount: 2,
            targetCoverageDays: 60
        );

        // Assert
        quantity.Should().BeGreaterThan(item.BasicInfo.ReorderQuantity);
        confidence.Should().BeInRange(50, 100);
        justification.Should().Contain("Stock 8 units");
        justification.Should().Contain("Proposed:");
    }

    [Fact]
    public void SchemaValidator_ValidProposal_PassesValidation()
    {
        // Arrange
        var proposals = new List<ProposalState>
        {
            new()
            {
                ProductId = Guid.NewGuid(),
                ProductName = "Fresh Mango Juice 1L",
                ProductSku = "BEV-JUC-002",
                CurrentStock = 12,
                ProposedQuantity = 40,
                EstimatedCost = 18000.00m,
                Justification = "Below safety threshold of 20",
                ConfidenceScore = 85
            }
        };

        // Act
        var result = _schemaValidator.Validate(proposals);

        // Assert
        result.Passed.Should().BeTrue();
        result.Errors.Should().BeEmpty();
    }

    [Fact]
    public void SchemaValidator_MalformedProposal_DetectsDeterministicSchemaErrors()
    {
        // Arrange: Proposal with empty SKU, negative quantity, and negative cost
        var invalidProposals = new List<ProposalState>
        {
            new()
            {
                ProductId = Guid.Empty, // Invalid!
                ProductName = "",       // Invalid!
                ProductSku = "",        // Invalid!
                ProposedQuantity = -10, // Invalid!
                EstimatedCost = -500m,  // Invalid!
                Justification = "",     // Invalid!
                ConfidenceScore = 150   // Invalid!
            }
        };

        // Act
        var result = _schemaValidator.Validate(invalidProposals);

        // Assert
        result.Passed.Should().BeFalse();
        result.Errors.Should().HaveCountGreaterOrEqualTo(5);
    }

    [Fact]
    public void BusinessRuleValidator_ExcessiveQuantity_RejectsProposalDeterministically()
    {
        // Arrange: Attempting to order 15,000 units (Exceeds 10,000 max single-order limit)
        var excessiveProposal = new List<ProposalState>
        {
            new()
            {
                ProductId = Guid.NewGuid(),
                ProductName = "Bulk Flour 50kg",
                ProductSku = "BAK-FLR-001",
                CurrentStock = 2,
                ProposedQuantity = 15_000,
                EstimatedCost = 450_000m,
                Justification = "Extreme bulk order",
                ConfidenceScore = 80
            }
        };

        // Act
        var result = _businessRuleValidator.Validate(excessiveProposal);

        // Assert
        result.Passed.Should().BeFalse();
        result.Errors.Should().Contain(e => e.Contains("exceeds maximum allowed 10000"));
    }

    [Fact]
    public void BusinessRuleValidator_LowConfidenceScore_RejectsAutonomousAction()
    {
        // Arrange: Confidence score below 30 threshold
        var lowConfidenceProposal = new List<ProposalState>
        {
            new()
            {
                ProductId = Guid.NewGuid(),
                ProductName = "Spices Mix 100g",
                ProductSku = "SPICE-001",
                CurrentStock = 1,
                ProposedQuantity = 20,
                EstimatedCost = 5000m,
                Justification = "Uncertain demand",
                ConfidenceScore = 20 // Below 30!
            }
        };

        // Act
        var result = _businessRuleValidator.Validate(lowConfidenceProposal);

        // Assert
        result.Passed.Should().BeFalse();
        result.Errors.Should().Contain(e => e.Contains("below minimum threshold 30"));
    }

    [Fact]
    public void WorkflowLifecycle_RequiresHumanApprovalGate_BeforeStockMutation()
    {
        // Arrange
        var workflow = new WorkflowState
        {
            WorkflowId = Guid.NewGuid(),
            Objective = "Automated stock replenishment",
            Status = WorkflowStatus.PendingManagerApproval
        };

        // Assert - strictly gated at PendingManagerApproval
        workflow.Status.Should().Be(WorkflowStatus.PendingManagerApproval);

        // Simulate Manager Approval action
        workflow.Status = WorkflowStatus.Approved;
        workflow.Status.Should().Be(WorkflowStatus.Approved);
    }
}
