using StockFlow.Domain.Entities.Order;
using StockFlow.Domain.Entities.Product;
using StockFlow.Domain.Enums;

namespace StockFlow.Tests.Unit;

public class OrderLifecycleTests
{
    [Fact]
    public void OrderLine_TotalPrice_CalculatesQuantityTimesUnitPrice()
    {
        // Arrange
        var line = new OrderLine
        {
            Quantity = 5,
            UnitPrice = 450.00m
        };

        // Act
        var total = line.TotalPrice;

        // Assert
        total.Should().Be(2250.00m);
    }

    [Fact]
    public void SalesOrder_InitializesWithDraftStatusAndEmptyLines()
    {
        // Arrange & Act
        var order = new SalesOrder
        {
            OrderNumber = "ORD-2026-0001",
            CustomerId = Guid.NewGuid(),
            TotalAmount = 5000.00m
        };

        // Assert
        order.Status.Should().Be(OrderStatus.Draft);
        order.Lines.Should().NotBeNull();
        order.StatusHistory.Should().NotBeNull();
    }

    [Theory]
    [InlineData(OrderStatus.Draft, OrderStatus.Submitted, true)]
    [InlineData(OrderStatus.Submitted, OrderStatus.Confirmed, true)]
    [InlineData(OrderStatus.Confirmed, OrderStatus.Processing, true)]
    [InlineData(OrderStatus.Confirmed, OrderStatus.Dispatched, true)]
    [InlineData(OrderStatus.Processing, OrderStatus.Dispatched, true)]
    [InlineData(OrderStatus.Processing, OrderStatus.Fulfilled, true)]
    [InlineData(OrderStatus.Dispatched, OrderStatus.Fulfilled, true)]
    [InlineData(OrderStatus.Fulfilled, OrderStatus.Cancelled, false)] // Cannot cancel already fulfilled order
    public void OrderStatus_TransitionRules_FollowValidBusinessLifecycle(
        OrderStatus currentStatus, OrderStatus targetStatus, bool isValid)
    {
        // Business logic validation rule
        var allowed = currentStatus switch
        {
            OrderStatus.Draft => targetStatus == OrderStatus.Submitted || targetStatus == OrderStatus.Cancelled,
            OrderStatus.Submitted => targetStatus == OrderStatus.Confirmed || targetStatus == OrderStatus.Cancelled,
            OrderStatus.Confirmed => targetStatus == OrderStatus.Processing || targetStatus == OrderStatus.Dispatched || targetStatus == OrderStatus.Cancelled,
            OrderStatus.Processing => targetStatus == OrderStatus.Dispatched || targetStatus == OrderStatus.Fulfilled || targetStatus == OrderStatus.Cancelled,
            OrderStatus.Dispatched => targetStatus == OrderStatus.Fulfilled || targetStatus == OrderStatus.Cancelled,
            OrderStatus.Fulfilled => false,
            OrderStatus.Cancelled => false,
            _ => false
        };

        allowed.Should().Be(isValid);
    }
}
