namespace StockFlow.Domain.Entities.Field;

public class FieldAgentProfile : BaseEntity
{
    public Guid UserId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string? VehicleNumber { get; set; }
    public bool IsOnDuty { get; set; } = false;
    public DateTime? LastActiveAt { get; set; }

    public ICollection<CustomerVisit> Visits { get; set; } = new List<CustomerVisit>();
}
