namespace StockFlow.Domain.Entities.Field;

public class DeviceCapture : BaseEntity
{
    public Guid CustomerVisitId { get; set; }
    public CustomerVisit CustomerVisit { get; set; } = null!;

    public string CaptureType { get; set; } = "QrCode"; // QrCode | Barcode | Photo
    public string? BarcodeData { get; set; }
    public string? QrCodeData { get; set; }
    public string? ProductSku { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public DateTime CapturedAt { get; set; } = DateTime.UtcNow;
    public string? DeviceId { get; set; }
    public bool IsVerified { get; set; } = false;
}
