using StockFlow.Domain.Entities.Field;
using StockFlow.Domain.Entities.Identity;

namespace StockFlow.Application.Interfaces;

public interface IFieldRepository
{
    Task<FieldAgentProfile?> GetProfileByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task<ApplicationUser?> GetUserAsync(Guid userId, CancellationToken ct = default);
    Task<List<CustomerVisit>> GetVisitsAsync(Guid fieldAgentId, CancellationToken ct = default);
    Task<FieldAgentProfile?> GetProfileByIdAsync(Guid fieldAgentId, CancellationToken ct = default);
    Task AddVisitAsync(CustomerVisit visit, CancellationToken ct = default);
    Task UpdateProfileAsync(FieldAgentProfile profile, CancellationToken ct = default);
    Task<CustomerVisit?> GetVisitByIdAsync(Guid visitId, CancellationToken ct = default);
    Task UpdateVisitAsync(CustomerVisit visit, CancellationToken ct = default);
    Task AddDeviceCaptureAsync(DeviceCapture capture, CancellationToken ct = default);
    Task<Domain.Entities.Product.Product?> GetProductByIdentifierAsync(string identifier, CancellationToken ct = default);
    Task AddOfflineSyncAsync(OfflineSyncQueue queue, CancellationToken ct = default);
    Task<List<OfflineSyncQueue>> GetOfflineSyncStatusAsync(Guid fieldAgentId, CancellationToken ct = default);
    Task<List<FieldAgentProfile>> GetAllProfilesAsync(CancellationToken ct = default);
    Task<List<CustomerVisit>> GetAllVisitsAsync(CancellationToken ct = default);
    Task<List<DeviceCapture>> GetAllCapturesAsync(CancellationToken ct = default);
    Task<List<OfflineSyncQueue>> GetAllSyncQueuesAsync(CancellationToken ct = default);
}
