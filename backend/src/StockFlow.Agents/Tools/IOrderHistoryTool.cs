namespace StockFlow.Agents.Tools;

public interface IOrderHistoryTool
{
    Task<List<OrderDemandSignal>> GetDemandSignalsAsync(Guid productId, int lookbackDays = 30, CancellationToken ct = default);
    Task<CustomerOrderPattern> GetCustomerPatternAsync(Guid customerId, CancellationToken ct = default);
}

public record OrderDemandSignal(
    Guid ProductId,
    string ProductName,
    int TotalUnitsSold,
    int OrderCount,
    double AverageDailyDemand,
    double DemandTrend, // positive = growing demand
    DateTime PeriodStart,
    DateTime PeriodEnd,
    List<Guid> TopCustomerIds);

public record CustomerOrderPattern(
    Guid CustomerId,
    string CustomerName,
    int TotalOrders,
    decimal TotalSpend,
    double AverageOrderFrequencyDays,
    List<string> TopProductSkus);
