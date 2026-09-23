using Microsoft.EntityFrameworkCore;
using StockFlow.Infrastructure.Persistence;

namespace StockFlow.Agents.Tools;

public class DbFieldContextTool : IFieldContextTool
{
    private readonly ApplicationDbContext _db;
    public DbFieldContextTool(ApplicationDbContext db) { _db = db; }

    public async Task<List<FieldContextSignal>> GetRecentFieldSignalsAsync(int lookbackHours = 24, CancellationToken ct = default)
    {
        var since = DateTime.UtcNow.AddHours(-lookbackHours);
        var visits = await _db.CustomerVisits
            .Include(v => v.FieldAgent)
            .Include(v => v.DeviceCaptures)
            .Where(v => v.VisitedAt >= since)
            .ToListAsync(ct);

        return visits.Select(v => new FieldContextSignal(
            v.Id, v.FieldAgentId, v.FieldAgent?.EmployeeCode ?? string.Empty,
            v.CustomerName, v.Latitude, v.Longitude, v.VisitedAt,
            v.DeviceCaptures.Count,
            v.DeviceCaptures.Where(c => c.ProductSku != null).Select(c => c.ProductSku!).Distinct().ToList()
        )).ToList();
    }

    public async Task<DeviceVerificationResult> VerifyDeviceCaptureAsync(string identifier, CancellationToken ct = default)
    {
        var product = await _db.Products
            .Include(p => p.StockLevel)
            .FirstOrDefaultAsync(p => p.Sku == identifier || p.Barcode == identifier || p.QrCode == identifier, ct);

        if (product is null)
            return new DeviceVerificationResult(false, null, null, null, $"No product found for identifier: {identifier}");

        return new DeviceVerificationResult(true, product.Sku, product.Name, product.StockLevel?.QuantityOnHand, null);
    }
}

public class MockFieldContextTool : IFieldContextTool
{
    public Task<List<FieldContextSignal>> GetRecentFieldSignalsAsync(int lookbackHours = 24, CancellationToken ct = default)
        => Task.FromResult(new List<FieldContextSignal>
        {
            new(Guid.NewGuid(), Guid.NewGuid(), "FA-001", "Test Customer",
                6.9271, 79.8612, DateTime.UtcNow.AddHours(-2), 3, new() { "TST-001" })
        });

    public Task<DeviceVerificationResult> VerifyDeviceCaptureAsync(string identifier, CancellationToken ct = default)
        => Task.FromResult(new DeviceVerificationResult(true, "TST-001", "Test Product", 15, null));
}
