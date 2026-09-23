using Microsoft.Extensions.Logging;
using StockFlow.Application.DTOs.Field;
using StockFlow.Application.Interfaces;
using StockFlow.Domain.Entities.Field;

namespace StockFlow.Application.Services;

public class FieldService : IFieldService
{
    private readonly IFieldRepository _fieldRepo;
    private readonly INotificationService _notifications;
    private readonly ILogger<FieldService> _logger;

    public FieldService(
        IFieldRepository fieldRepo,
        INotificationService notifications,
        ILogger<FieldService> logger)
    {
        _fieldRepo = fieldRepo;
        _notifications = notifications;
        _logger = logger;
    }

    public async Task<FieldAgentDto?> GetProfileByUserIdAsync(Guid userId, CancellationToken ct = default)
    {
        var profile = await _fieldRepo.GetProfileByUserIdAsync(userId, ct);
        if (profile is null) return null;
        var user = await _fieldRepo.GetUserAsync(userId, ct);
        return new FieldAgentDto(
            profile.Id,
            userId,
            profile.EmployeeCode,
            user?.FullName ?? "Field Sales Officer",
            profile.Region,
            profile.VehicleNumber,
            profile.IsOnDuty,
            profile.LastActiveAt,
            user?.PhoneNumber,
            user?.Email);
    }

    public async Task<List<CustomerVisitDto>> GetVisitsAsync(Guid fieldAgentId, CancellationToken ct = default)
    {
        var visits = await _fieldRepo.GetVisitsAsync(fieldAgentId, ct);
        return visits.Select(v => ToDto(v)).ToList();
    }

    public async Task<CustomerVisitDto> CreateVisitAsync(Guid fieldAgentId, CreateCustomerVisitDto dto, Guid? authUserId = null, CancellationToken ct = default)
    {
        // 1. Try finding profile by ID
        var profile = await _fieldRepo.GetProfileByIdAsync(fieldAgentId, ct);

        // 2. If not found, try fieldAgentId as UserId
        if (profile == null)
        {
            profile = await _fieldRepo.GetProfileByUserIdAsync(fieldAgentId, ct);
        }

        // 3. If not found, try by authenticated user's ID
        if (profile == null && authUserId.HasValue)
        {
            profile = await _fieldRepo.GetProfileByUserIdAsync(authUserId.Value, ct);
        }

        // 4. Fallback to any existing profile
        if (profile == null)
        {
            var all = await _fieldRepo.GetAllProfilesAsync(ct);
            profile = all.FirstOrDefault();
        }

        if (profile == null)
        {
            throw new KeyNotFoundException("No field agent profile exists in the system.");
        }

        var visit = new CustomerVisit
        {
            Id = Guid.NewGuid(),
            FieldAgentId = profile.Id,
            CustomerId = dto.CustomerId,
            CustomerName = dto.CustomerName,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            AddressSnapshot = dto.AddressSnapshot,
            Notes = dto.Notes,
            SalesOrderId = dto.SalesOrderId,
            VisitedAt = DateTime.UtcNow,
            CheckOutAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        profile.LastActiveAt = DateTime.UtcNow;
        profile.IsOnDuty = true;
        await _fieldRepo.UpdateProfileAsync(profile, ct);
        await _fieldRepo.AddVisitAsync(visit, ct);

        var user = await _fieldRepo.GetUserAsync(profile.UserId, ct);
        var agentName = user?.FullName ?? profile.EmployeeCode;
        return new CustomerVisitDto(
            visit.Id,
            visit.FieldAgentId,
            $"{agentName} ({profile.EmployeeCode})",
            visit.CustomerId,
            visit.CustomerName,
            visit.Latitude,
            visit.Longitude,
            visit.VisitedAt,
            visit.CheckOutAt,
            visit.Notes,
            visit.SalesOrderId,
            visit.DeviceCaptures.Count);
    }

    public async Task<CustomerVisitDto> CheckOutAsync(Guid visitId, CancellationToken ct = default)
    {
        var visit = await _fieldRepo.GetVisitByIdAsync(visitId, ct)
            ?? throw new KeyNotFoundException($"Visit {visitId} not found.");
        visit.CheckOutAt = DateTime.UtcNow;
        await _fieldRepo.UpdateVisitAsync(visit, ct);

        // Support delivery or visit-related alerts
        try
        {
            await _notifications.SendEmailAsync(
                "manager@stockflow.local",
                $"Field Visit Completed: {visit.CustomerName}",
                $"Field Agent checked out from customer site '{visit.CustomerName}' at {visit.CheckOutAt:HH:mm UTC}. Notes: {visit.Notes ?? "Routine audit completed."}",
                "CustomerVisit",
                visit.Id,
                ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to send visit alert for visit {Id}", visit.Id);
        }

        return ToDto(visit);
    }

    public async Task<DeviceCaptureDto> RecordCaptureAsync(CreateDeviceCaptureDto dto, CancellationToken ct = default)
    {
        var visit = await _fieldRepo.GetVisitByIdAsync(dto.CustomerVisitId, ct)
            ?? throw new KeyNotFoundException($"Visit {dto.CustomerVisitId} not found.");

        var capture = new DeviceCapture
        {
            CustomerVisitId = dto.CustomerVisitId,
            CaptureType = dto.CaptureType,
            BarcodeData = dto.BarcodeData,
            QrCodeData = dto.QrCodeData,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            CapturedAt = DateTime.UtcNow
        };

        // Auto-resolve product SKU from QR/barcode
        if (!string.IsNullOrEmpty(dto.QrCodeData) || !string.IsNullOrEmpty(dto.BarcodeData))
        {
            var identifier = dto.QrCodeData ?? dto.BarcodeData;
            var product = await _fieldRepo.GetProductByIdentifierAsync(identifier, ct);
            if (product is not null)
            {
                capture.ProductSku = product.Sku;
                capture.IsVerified = true;
            }
        }

        await _fieldRepo.AddDeviceCaptureAsync(capture, ct);
        return new DeviceCaptureDto(capture.Id, capture.CustomerVisitId, capture.CaptureType,
            capture.BarcodeData, capture.QrCodeData, capture.ProductSku,
            capture.Latitude, capture.Longitude, capture.CapturedAt, capture.IsVerified);
    }

    public async Task<Guid> ProcessOfflineSyncAsync(Guid fieldAgentId, OfflineSyncDto dto, CancellationToken ct = default)
    {
        var queue = new OfflineSyncQueue
        {
            FieldAgentId = fieldAgentId,
            EntityType = dto.EntityType,
            Payload = dto.Payload,
            DeviceId = dto.DeviceId,
            Status = "Pending"
        };
        await _fieldRepo.AddOfflineSyncAsync(queue, ct);
        _logger.LogInformation("Offline sync queued: {Type} for agent {AgentId}", dto.EntityType, fieldAgentId);
        return queue.Id;
    }

    public async Task<List<object>> GetOfflineSyncStatusAsync(Guid fieldAgentId, CancellationToken ct = default)
    {
        var queues = await _fieldRepo.GetOfflineSyncStatusAsync(fieldAgentId, ct);
        return queues.Select(q => (object)new { q.Id, q.EntityType, q.Status, q.CreatedAt, q.SyncedAt, q.RetryCount }).ToList();
    }

    public async Task<List<FieldAgentDto>> GetAllAgentsAsync(CancellationToken ct = default)
    {
        var profiles = await _fieldRepo.GetAllProfilesAsync(ct);
        var list = new List<FieldAgentDto>();
        foreach (var p in profiles)
        {
            var user = await _fieldRepo.GetUserAsync(p.UserId, ct);
            list.Add(new FieldAgentDto(
                p.Id,
                p.UserId,
                p.EmployeeCode,
                user?.FullName ?? "Field Sales Officer",
                p.Region,
                p.VehicleNumber,
                p.IsOnDuty,
                p.LastActiveAt,
                user?.PhoneNumber,
                user?.Email));
        }
        return list;
    }

    public async Task<List<CustomerVisitDto>> GetAllVisitsAsync(CancellationToken ct = default)
    {
        var visits = await _fieldRepo.GetAllVisitsAsync(ct);
        var list = new List<CustomerVisitDto>();
        foreach (var v in visits)
        {
            string agentName = v.FieldAgent?.EmployeeCode ?? "Field Agent";
            if (v.FieldAgent != null)
            {
                var user = await _fieldRepo.GetUserAsync(v.FieldAgent.UserId, ct);
                if (!string.IsNullOrWhiteSpace(user?.FullName))
                {
                    agentName = $"{user.FullName} ({v.FieldAgent.EmployeeCode})";
                }
            }
            list.Add(new CustomerVisitDto(
                v.Id,
                v.FieldAgentId,
                agentName,
                v.CustomerId,
                v.CustomerName,
                v.Latitude,
                v.Longitude,
                v.VisitedAt,
                v.CheckOutAt,
                v.Notes,
                v.SalesOrderId,
                v.DeviceCaptures.Count));
        }
        return list;
    }

    public async Task<List<DeviceCaptureDto>> GetAllCapturesAsync(CancellationToken ct = default)
    {
        var captures = await _fieldRepo.GetAllCapturesAsync(ct);
        return captures.Select(c => new DeviceCaptureDto(
            c.Id,
            c.CustomerVisitId,
            c.CaptureType,
            c.BarcodeData,
            c.QrCodeData,
            c.ProductSku,
            c.Latitude,
            c.Longitude,
            c.CapturedAt,
            c.IsVerified)).ToList();
    }

    public async Task<List<object>> GetAllSyncQueuesAsync(CancellationToken ct = default)
    {
        var queues = await _fieldRepo.GetAllSyncQueuesAsync(ct);
        return queues.Select(q => (object)new {
            q.Id,
            q.FieldAgentId,
            q.EntityType,
            q.Payload,
            q.DeviceId,
            q.Status,
            q.CreatedAt,
            q.SyncedAt,
            q.RetryCount,
            q.ErrorMessage
        }).ToList();
    }

    private static CustomerVisitDto ToDto(CustomerVisit v) => new(
        v.Id, v.FieldAgentId, v.FieldAgent?.EmployeeCode ?? string.Empty,
        v.CustomerId, v.CustomerName, v.Latitude, v.Longitude,
        v.VisitedAt, v.CheckOutAt, v.Notes, v.SalesOrderId, v.DeviceCaptures.Count);
}
