namespace StockFlow.Domain.Entities.Order;

public class Customer : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = "Colombo";
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<SalesOrder> Orders { get; set; } = new List<SalesOrder>();
}
