using StockFlow.Application.DTOs.Field;

namespace StockFlow.Application.Interfaces;

public interface IFieldService
{
    Task<FieldAgentDto?> GetProfileByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task<List<CustomerVisitDto>> GetVisitsAsync(Guid fieldAgentId, CancellationToken ct = default);
    Task<CustomerVisitDto> CreateVisitAsync(Guid fieldAgentId, CreateCustomerVisitDto dto, Guid? authUserId = null, CancellationToken ct = default);
    Task<CustomerVisitDto> CheckOutAsync(Guid visitId, CancellationToken ct = default);
    Task<DeviceCaptureDto> RecordCaptureAsync(CreateDeviceCaptureDto dto, CancellationToken ct = default);
    Task<Guid> ProcessOfflineSyncAsync(Guid fieldAgentId, OfflineSyncDto dto, CancellationToken ct = default);
    Task<List<object>> GetOfflineSyncStatusAsync(Guid fieldAgentId, CancellationToken ct = default);
    Task<List<FieldAgentDto>> GetAllAgentsAsync(CancellationToken ct = default);
    Task<List<CustomerVisitDto>> GetAllVisitsAsync(CancellationToken ct = default);
    Task<List<DeviceCaptureDto>> GetAllCapturesAsync(CancellationToken ct = default);
    Task<List<object>> GetAllSyncQueuesAsync(CancellationToken ct = default);
}
