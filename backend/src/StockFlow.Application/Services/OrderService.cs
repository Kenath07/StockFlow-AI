using Microsoft.Extensions.Logging;
using StockFlow.Application.DTOs.Order;
using StockFlow.Application.Interfaces;
using StockFlow.Domain.Entities.Order;
using StockFlow.Domain.Entities.Product;
using StockFlow.Domain.Enums;

namespace StockFlow.Application.Services;

public class OrderService : IOrderService
{
    private readonly IOrderRepository _orderRepo;
    private readonly IStockRepository _stockRepo;
    private readonly IProductRepository _productRepo;
    private readonly INotificationService _notifications;
    private readonly ILogger<OrderService> _logger;

    public OrderService(
        IOrderRepository orderRepo,
        IStockRepository stockRepo,
        IProductRepository productRepo,
        INotificationService notifications,
        ILogger<OrderService> logger)
    {
        _orderRepo = orderRepo;
        _stockRepo = stockRepo;
        _productRepo = productRepo;
        _notifications = notifications;
        _logger = logger;
    }

    public async Task<List<SalesOrderDto>> GetAllAsync(string? status = null, CancellationToken ct = default)
    {
        OrderStatus? orderStatus = null;
        if (status is not null)
        {
            var normalized = status.Equals("Pending", StringComparison.OrdinalIgnoreCase) ? nameof(OrderStatus.Submitted) : status;
            if (Enum.TryParse<OrderStatus>(normalized, ignoreCase: true, out var s))
                orderStatus = s;
        }

        var orders = await _orderRepo.GetAllAsync(orderStatus, ct);
        return orders.Select(o => ToDto(o)).ToList();
    }

    public async Task<SalesOrderDto?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var o = await _orderRepo.GetByIdAsync(id, ct);
        return o is null ? null : ToDto(o);
    }

    public async Task<List<SalesOrderDto>> GetByFieldAgentAsync(Guid fieldAgentId, CancellationToken ct = default)
    {
        var orders = await _orderRepo.GetByFieldAgentAsync(fieldAgentId, ct);
        return orders.Select(o => ToDto(o)).ToList();
    }

    public async Task<SalesOrderDto> CreateAsync(CreateOrderDto dto, string createdBy, Guid? fieldAgentId = null, CancellationToken ct = default)
    {
        // Validate stock availability for all lines
        foreach (var line in dto.Lines)
        {
            var stockLevel = await _stockRepo.GetStockLevelByProductAsync(line.ProductId, ct)
                ?? throw new InvalidOperationException($"No stock level for product {line.ProductId}.");
            if (stockLevel.QuantityAvailable < line.Quantity)
                throw new InvalidOperationException($"Insufficient stock for product {line.ProductId}. Available: {stockLevel.QuantityAvailable}, Requested: {line.Quantity}.");
        }

        var orderNumber = $"ORD-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}";
        var order = new SalesOrder
        {
            OrderNumber = orderNumber,
            CustomerId = dto.CustomerId,
            FieldAgentId = fieldAgentId,
            Notes = dto.Notes,
            DeliveryAddress = dto.DeliveryAddress,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            PreferredDeliveryDate = dto.PreferredDeliveryDate.HasValue
                ? (dto.PreferredDeliveryDate.Value.Kind == DateTimeKind.Unspecified
                    ? DateTime.SpecifyKind(dto.PreferredDeliveryDate.Value, DateTimeKind.Utc)
                    : dto.PreferredDeliveryDate.Value.ToUniversalTime())
                : null,
            Status = OrderStatus.Submitted,
            CreatedBy = createdBy
        };

        foreach (var lineDto in dto.Lines)
        {
            var product = await _productRepo.GetByIdAsync(lineDto.ProductId, ct);
            order.Lines.Add(new OrderLine
            {
                ProductId = lineDto.ProductId,
                Quantity = lineDto.Quantity,
                UnitPrice = lineDto.UnitPrice
            });

            // Reserve stock
            var sl = await _stockRepo.GetStockLevelByProductAsync(lineDto.ProductId, ct);
            if (sl is not null)
            {
                sl.QuantityReserved += lineDto.Quantity;
                await _stockRepo.UpdateStockLevelAsync(sl, ct);
            }
        }

        order.TotalAmount = order.Lines.Sum(l => l.TotalPrice);

        // Status history
        order.StatusHistory.Add(new OrderStatusHistory
        {
            FromStatus = OrderStatus.Draft,
            ToStatus = OrderStatus.Submitted,
            ChangedBy = createdBy,
            ChangedAt = DateTime.UtcNow
        });

        await _orderRepo.AddAsync(order, ct);
        _logger.LogInformation("Order {OrderNumber} created by {User}", orderNumber, createdBy);

        var createdOrder = await GetByIdAsync(order.Id, ct) ?? ToDto(order);

        // Send order confirmation to customer via email and SMS
        var savedOrder = await _orderRepo.GetByIdAsync(order.Id, ct);
        if (savedOrder?.Customer != null && (!string.IsNullOrEmpty(savedOrder.Customer.Email) || !string.IsNullOrEmpty(savedOrder.Customer.Phone)))
        {
            try
            {
                await _notifications.NotifyOrderConfirmationAsync(
                    savedOrder.Id,
                    savedOrder.OrderNumber,
                    savedOrder.Customer.Email ?? string.Empty,
                    savedOrder.Customer.Phone ?? string.Empty,
                    ct);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send order confirmation notification for {OrderNumber}", orderNumber);
            }
        }

        // Check low-stock situations for all lines and notify managers / storekeepers
        foreach (var lineDto in dto.Lines)
        {
            try
            {
                var sl = await _stockRepo.GetStockLevelByProductAsync(lineDto.ProductId, ct);
                var threshold = await _stockRepo.GetThresholdAsync(lineDto.ProductId, ct);
                if (sl is not null && threshold is not null && sl.QuantityAvailable <= threshold.MinThreshold)
                {
                    var product = await _productRepo.GetByIdAsync(lineDto.ProductId, ct);
                    await _notifications.NotifyLowStockAsync(
                        lineDto.ProductId,
                        product?.Name ?? "Product",
                        sl.QuantityAvailable,
                        threshold.MinThreshold,
                        ct);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to check/send low stock notification for product {ProductId}", lineDto.ProductId);
            }
        }

        return createdOrder;
    }

    public async Task<SalesOrderDto> UpdateStatusAsync(Guid id, OrderStatusUpdateDto dto, string changedBy, CancellationToken ct = default)
    {
        var order = await _orderRepo.GetByIdAsync(id, ct)
            ?? throw new KeyNotFoundException($"Order {id} not found.");

        var statusStr = dto.NewStatus;
        if (string.Equals(statusStr, "Pending", StringComparison.OrdinalIgnoreCase))
            statusStr = nameof(OrderStatus.Submitted);

        if (!Enum.TryParse<OrderStatus>(statusStr, ignoreCase: true, out var newStatus))
            throw new ArgumentException($"Invalid status '{dto.NewStatus}'.");

        var history = new OrderStatusHistory
        {
            SalesOrderId = order.Id,
            FromStatus = order.Status,
            ToStatus = newStatus,
            ChangedBy = changedBy,
            Reason = dto.Reason,
            ChangedAt = DateTime.UtcNow
        };

        await _orderRepo.AddStatusHistoryAsync(history, ct);
        order.Status = newStatus;
        order.UpdatedAt = DateTime.UtcNow;
        order.UpdatedBy = changedBy;

        // If fulfilled, release reservations and record stock movement
        if (newStatus == OrderStatus.Fulfilled)
        {
            foreach (var line in order.Lines)
            {
                var sl = await _stockRepo.GetStockLevelByProductAsync(line.ProductId, ct);
                if (sl is not null)
                {
                    sl.QuantityReserved = Math.Max(0, sl.QuantityReserved - line.Quantity);
                    sl.QuantityOnHand = Math.Max(0, sl.QuantityOnHand - line.Quantity);
                    await _stockRepo.UpdateStockLevelAsync(sl, ct);

                    // Record audit trail movement
                    await _stockRepo.AddMovementAsync(new StockMovement
                    {
                        Id = Guid.NewGuid(),
                        ProductId = line.ProductId,
                        Type = MovementType.Sale,
                        Quantity = -line.Quantity,
                        Notes = $"Order fulfillment: {order.OrderNumber}",
                        ReferenceNumber = order.OrderNumber,
                        PerformedBy = changedBy,
                        PerformedAt = DateTime.UtcNow
                    }, ct);
                }
            }
        }

        await _orderRepo.UpdateAsync(order, ct);

        // Notify customer on status update (Confirmed, Dispatched, Fulfilled, etc.)
        if (order.Customer != null && (!string.IsNullOrEmpty(order.Customer.Email) || !string.IsNullOrEmpty(order.Customer.Phone)))
        {
            try
            {
                var statusMsg = $"Your order {order.OrderNumber} status has been updated to '{newStatus}'. Reason: {dto.Reason ?? "Status updated"}";
                if (!string.IsNullOrEmpty(order.Customer.Email))
                {
                    await _notifications.SendEmailAsync(
                        order.Customer.Email,
                        $"Order {order.OrderNumber} Status: {newStatus}",
                        statusMsg,
                        "Order",
                        order.Id,
                        ct);
                }
                if (!string.IsNullOrEmpty(order.Customer.Phone))
                {
                    await _notifications.SendSmsAsync(
                        order.Customer.Phone,
                        $"Order {order.OrderNumber}",
                        statusMsg,
                        "Order",
                        order.Id,
                        ct);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send status update notification for order {Id}", order.Id);
            }
        }

        return ToDto(order);
    }

    public async Task<bool> CancelAsync(Guid id, string reason, string cancelledBy, CancellationToken ct = default)
    {
        var order = await _orderRepo.GetByIdAsync(id, ct);
        if (order is null) return false;
        if (order.Status == OrderStatus.Fulfilled || order.Status == OrderStatus.Cancelled)
            throw new InvalidOperationException("Cannot cancel a fulfilled or already cancelled order.");

        // Release reservations
        foreach (var line in order.Lines)
        {
            var sl = await _stockRepo.GetStockLevelByProductAsync(line.ProductId, ct);
            if (sl is not null)
            {
                sl.QuantityReserved = Math.Max(0, sl.QuantityReserved - line.Quantity);
                await _stockRepo.UpdateStockLevelAsync(sl, ct);
            }
        }

        await _orderRepo.AddStatusHistoryAsync(new OrderStatusHistory
        {
            SalesOrderId = order.Id,
            FromStatus = order.Status,
            ToStatus = OrderStatus.Cancelled,
            ChangedBy = cancelledBy,
            Reason = reason,
            ChangedAt = DateTime.UtcNow
        }, ct);

        order.Status = OrderStatus.Cancelled;
        order.UpdatedAt = DateTime.UtcNow;
        order.UpdatedBy = cancelledBy;
        await _orderRepo.UpdateAsync(order, ct);
        return true;
    }

    private static SalesOrderDto ToDto(SalesOrder o) => new(
        o.Id, o.OrderNumber, o.CustomerId, o.Customer?.Name ?? string.Empty,
        o.Status.ToString(), o.TotalAmount, o.Notes, o.OrderDate,
        o.PreferredDeliveryDate, o.Latitude, o.Longitude,
        o.Lines.Select(l => new OrderLineDto(
            l.Id, l.ProductId, l.Product?.Name ?? string.Empty,
            l.Product?.Sku ?? string.Empty, l.Quantity, l.UnitPrice, l.TotalPrice)).ToList(),
        o.CreatedAt);
}
