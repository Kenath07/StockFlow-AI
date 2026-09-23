namespace StockFlow.Domain.Enums;

public enum OrderStatus
{
    Draft,
    Submitted,
    Confirmed,
    Processing,
    Dispatched,
    Fulfilled,
    Cancelled
}
