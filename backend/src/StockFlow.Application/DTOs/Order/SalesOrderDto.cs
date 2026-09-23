namespace StockFlow.Application.DTOs.Order;

public record CustomerDto(
    Guid Id,
    string Name,
    string? ContactPerson,
    string Email,
    string Phone,
    string Address,
    string City,
    double? Latitude,
    double? Longitude,
    bool IsActive);

public record CreateCustomerDto(
    string Name,
    string? ContactPerson,
    string Email,
    string Phone,
    string Address,
    string City,
    double? Latitude,
    double? Longitude);

public record OrderLineDto(
    Guid Id,
    Guid ProductId,
    string ProductName,
    string ProductSku,
    int Quantity,
    decimal UnitPrice,
    decimal TotalPrice);

public record CreateOrderLineDto(Guid ProductId, int Quantity, decimal UnitPrice);

public record SalesOrderDto(
    Guid Id,
    string OrderNumber,
    Guid CustomerId,
    string CustomerName,
    string Status,
    decimal TotalAmount,
    string? Notes,
    DateTime OrderDate,
    DateTime? PreferredDeliveryDate,
    double? Latitude,
    double? Longitude,
    List<OrderLineDto> Lines,
    DateTime CreatedAt);

public record CreateOrderDto(
    Guid CustomerId,
    string? Notes,
    string? DeliveryAddress,
    double? Latitude,
    double? Longitude,
    DateTime? PreferredDeliveryDate,
    List<CreateOrderLineDto> Lines);

public record OrderStatusUpdateDto(string NewStatus, string? Reason);
