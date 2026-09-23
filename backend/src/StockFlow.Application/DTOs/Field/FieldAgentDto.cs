namespace StockFlow.Application.DTOs.Field;

public record FieldAgentDto(
    Guid Id,
    Guid UserId,
    string EmployeeCode,
    string FullName,
    string Region,
    string? VehicleNumber,
    bool IsOnDuty,
    DateTime? LastActiveAt,
    string? Phone = null,
    string? Email = null);

public record CustomerVisitDto(
    Guid Id,
    Guid FieldAgentId,
    string FieldAgentName,
    Guid CustomerId,
    string CustomerName,
    double Latitude,
    double Longitude,
    DateTime VisitedAt,
    DateTime? CheckOutAt,
    string? Notes,
    Guid? SalesOrderId,
    int CaptureCount);

public record CreateCustomerVisitDto(
    Guid CustomerId,
    string CustomerName,
    double Latitude,
    double Longitude,
    string? AddressSnapshot,
    string? Notes,
    Guid? SalesOrderId);

public record DeviceCaptureDto(
    Guid Id,
    Guid CustomerVisitId,
    string CaptureType,
    string? BarcodeData,
    string? QrCodeData,
    string? ProductSku,
    double? Latitude,
    double? Longitude,
    DateTime CapturedAt,
    bool IsVerified);

public record CreateDeviceCaptureDto(
    Guid CustomerVisitId,
    string CaptureType,
    string? BarcodeData,
    string? QrCodeData,
    double? Latitude,
    double? Longitude);

public record OfflineSyncDto(
    string EntityType,
    string Payload,
    string? DeviceId);
