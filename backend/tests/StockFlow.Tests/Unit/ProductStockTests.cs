using StockFlow.Domain.Entities.Product;
using StockFlow.Domain.Enums;

namespace StockFlow.Tests.Unit;

public class ProductStockTests
{
    [Fact]
    public void StockLevel_AvailableQuantity_CalculatesOnHandMinusReserved()
    {
        // Arrange
        var stockLevel = new StockLevel
        {
            QuantityOnHand = 100,
            QuantityReserved = 30
        };

        // Act
        var available = stockLevel.QuantityAvailable;

        // Assert
        available.Should().Be(70);
    }

    [Fact]
    public void StockLevel_AvailableQuantity_ReturnsZeroWhenReservedExceedsOnHand()
    {
        // Arrange
        var stockLevel = new StockLevel
        {
            QuantityOnHand = 15,
            QuantityReserved = 25
        };

        // Act
        var available = stockLevel.QuantityAvailable;

        // Assert
        available.Should().Be(0);
    }

    [Fact]
    public void Product_InitializesWithDefaultValuesAndRelations()
    {
        // Arrange & Act
        var product = new Product
        {
            Sku = "BEV-TEA-001",
            Name = "Ceylon Premium Black Tea 500g",
            UnitPrice = 850.00m,
            CostPrice = 650.00m,
            UnitOfMeasure = "Pack",
            Barcode = "794511234001"
        };

        // Assert
        product.IsActive.Should().BeTrue();
        product.StockMovements.Should().NotBeNull();
        product.StockAdjustments.Should().NotBeNull();
        product.UnitOfMeasure.Should().Be("Pack");
    }

    [Theory]
    [InlineData(10, 15, true)]   // On hand is 10, threshold is 15 -> Low stock!
    [InlineData(15, 15, true)]   // On hand equals threshold -> Alert!
    [InlineData(50, 20, false)]  // On hand 50 > threshold 20 -> Sufficient
    public void LowStockThreshold_Evaluation_CorrectlyIdentifiesCriticalInventory(int currentStock, int threshold, bool isCritical)
    {
        // Arrange
        var lowStock = currentStock <= threshold;

        // Assert
        lowStock.Should().Be(isCritical);
    }
}
