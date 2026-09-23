using Microsoft.EntityFrameworkCore;
using StockFlow.Application.Interfaces;
using StockFlow.Domain.Entities.Field;
using StockFlow.Domain.Entities.Identity;
using StockFlow.Infrastructure.Persistence;

namespace StockFlow.Infrastructure.Repositories;

public class FieldRepository : IFieldRepository
{
    private readonly ApplicationDbContext _context;

    public FieldRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<FieldAgentProfile?> GetProfileByUserIdAsync(Guid userId, CancellationToken ct = default)
    {
        var profile = await _context.FieldAgentProfiles
            .FirstOrDefaultAsync(f => f.UserId == userId, ct);

        if (profile == null)
        {
            var user = await _context.Users.FindAsync(new object[] { userId }, ct);
            if (user != null && user.Role == Domain.Enums.UserRole.FieldSales)
            {
                var count = await _context.FieldAgentProfiles.CountAsync(ct) + 1;
                profile = new FieldAgentProfile
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    EmployeeCode = $"FA-{count:D3}",
                    Region = "Western Province (Colombo)",
                    VehicleNumber = $"WP-CAB-{new Random().Next(1000, 9999)}",
                    IsOnDuty = true,
                    LastActiveAt = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow
                };
                await _context.FieldAgentProfiles.AddAsync(profile, ct);
                await _context.SaveChangesAsync(ct);
            }
        }

        return profile;
    }

    public async Task<ApplicationUser?> GetUserAsync(Guid userId, CancellationToken ct = default)
    {
        return await _context.Users.FindAsync(new object[] { userId }, ct);
    }

    public async Task<List<CustomerVisit>> GetVisitsAsync(Guid fieldAgentId, CancellationToken ct = default)
    {
        return await _context.CustomerVisits
            .Include(v => v.FieldAgent)
            .Include(v => v.DeviceCaptures)
            .Where(v => v.FieldAgentId == fieldAgentId)
            .OrderByDescending(v => v.VisitedAt)
            .ToListAsync(ct);
    }

    public async Task<FieldAgentProfile?> GetProfileByIdAsync(Guid fieldAgentId, CancellationToken ct = default)
    {
        return await _context.FieldAgentProfiles.FindAsync(new object[] { fieldAgentId }, ct);
    }

    public async Task AddVisitAsync(CustomerVisit visit, CancellationToken ct = default)
    {
        await _context.CustomerVisits.AddAsync(visit, ct);
        await _context.SaveChangesAsync(ct);
    }

    public async Task UpdateProfileAsync(FieldAgentProfile profile, CancellationToken ct = default)
    {
        _context.FieldAgentProfiles.Update(profile);
        await _context.SaveChangesAsync(ct);
    }

    public async Task<CustomerVisit?> GetVisitByIdAsync(Guid visitId, CancellationToken ct = default)
    {
        return await _context.CustomerVisits
            .Include(v => v.DeviceCaptures)
            .FirstOrDefaultAsync(v => v.Id == visitId, ct);
    }

    public async Task UpdateVisitAsync(CustomerVisit visit, CancellationToken ct = default)
    {
        _context.CustomerVisits.Update(visit);
        await _context.SaveChangesAsync(ct);
    }

    public async Task AddDeviceCaptureAsync(DeviceCapture capture, CancellationToken ct = default)
    {
        await _context.DeviceCaptures.AddAsync(capture, ct);
        await _context.SaveChangesAsync(ct);
    }

    public async Task<Domain.Entities.Product.Product?> GetProductByIdentifierAsync(string identifier, CancellationToken ct = default)
    {
        return await _context.Products
            .FirstOrDefaultAsync(p =>
                p.Barcode == identifier ||
                p.QrCode == identifier ||
                p.Sku == identifier, ct);
    }

    public async Task AddOfflineSyncAsync(OfflineSyncQueue queue, CancellationToken ct = default)
    {
        await _context.OfflineSyncQueues.AddAsync(queue, ct);
        await _context.SaveChangesAsync(ct);
    }

    public async Task<List<OfflineSyncQueue>> GetOfflineSyncStatusAsync(Guid fieldAgentId, CancellationToken ct = default)
    {
        return await _context.OfflineSyncQueues
            .Where(q => q.FieldAgentId == fieldAgentId)
            .OrderByDescending(q => q.CreatedAt)
            .Take(20)
            .ToListAsync(ct);
    }

    public async Task<List<FieldAgentProfile>> GetAllProfilesAsync(CancellationToken ct = default)
    {
        // Auto-provision profile for any newly registered FieldSales users who don't have one yet
        var fieldSalesUsers = await _context.Users
            .Where(u => u.Role == Domain.Enums.UserRole.FieldSales)
            .ToListAsync(ct);

        var existingProfileUserIds = await _context.FieldAgentProfiles
            .Select(p => p.UserId)
            .ToListAsync(ct);

        var missingUsers = fieldSalesUsers
            .Where(u => !existingProfileUserIds.Contains(u.Id))
            .ToList();

        if (missingUsers.Any())
        {
            var count = await _context.FieldAgentProfiles.CountAsync(ct);
            foreach (var user in missingUsers)
            {
                count++;
                var newProfile = new FieldAgentProfile
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    EmployeeCode = $"FA-{count:D3}",
                    Region = "Western Province (Colombo)",
                    VehicleNumber = $"WP-CAB-{new Random().Next(1000, 9999)}",
                    IsOnDuty = true,
                    LastActiveAt = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow
                };
                await _context.FieldAgentProfiles.AddAsync(newProfile, ct);
            }
            await _context.SaveChangesAsync(ct);
        }

        return await _context.FieldAgentProfiles
            .OrderBy(p => p.EmployeeCode)
            .ToListAsync(ct);
    }

    public async Task<List<CustomerVisit>> GetAllVisitsAsync(CancellationToken ct = default)
    {
        return await _context.CustomerVisits
            .Include(v => v.FieldAgent)
            .Include(v => v.DeviceCaptures)
            .OrderByDescending(v => v.VisitedAt)
            .ToListAsync(ct);
    }

    public async Task<List<DeviceCapture>> GetAllCapturesAsync(CancellationToken ct = default)
    {
        return await _context.DeviceCaptures
            .Include(c => c.CustomerVisit).ThenInclude(v => v.FieldAgent)
            .OrderByDescending(c => c.CapturedAt)
            .ToListAsync(ct);
    }

    public async Task<List<OfflineSyncQueue>> GetAllSyncQueuesAsync(CancellationToken ct = default)
    {
        return await _context.OfflineSyncQueues
            .OrderByDescending(q => q.CreatedAt)
            .ToListAsync(ct);
    }
}
