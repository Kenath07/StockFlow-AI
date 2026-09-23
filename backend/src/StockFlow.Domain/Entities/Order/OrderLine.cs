using StockFlow.Domain.Entities.Product;

namespace StockFlow.Domain.Entities.Order;

public class OrderLine : BaseEntity
{
    public Guid SalesOrderId { get; set; }
    public SalesOrder SalesOrder { get; set; } = null!;

    public Guid ProductId { get; set; }
    public Domain.Entities.Product.Product Product { get; set; } = null!;

    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice => Quantity * UnitPrice;
}
