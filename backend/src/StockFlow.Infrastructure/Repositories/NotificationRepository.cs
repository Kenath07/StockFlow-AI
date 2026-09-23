using Microsoft.EntityFrameworkCore;
using StockFlow.Application.Interfaces;
using StockFlow.Domain.Entities.Notification;
using StockFlow.Domain.Enums;
using StockFlow.Infrastructure.Persistence;

namespace StockFlow.Infrastructure.Repositories;

public class NotificationRepository : INotificationRepository
{
    private readonly ApplicationDbContext _db;

    public NotificationRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<NotificationLog>> GetUserNotificationsAsync(string userId, CancellationToken ct = default)
    {
        return await _db.NotificationLogs
            .Where(n => n.Recipient == userId && n.Channel == NotificationChannel.Push)
            .OrderByDescending(n => n.CreatedAt)
            .Take(50)
            .ToListAsync(ct);
    }

    public async Task<NotificationLog?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.NotificationLogs.FindAsync(new object[] { id }, ct);
    }

    public async Task UpdateAsync(NotificationLog notification, CancellationToken ct = default)
    {
        _db.NotificationLogs.Update(notification);
        await _db.SaveChangesAsync(ct);
    }

    public async Task MarkAllAsReadAsync(string userId, CancellationToken ct = default)
    {
        await _db.NotificationLogs
            .Where(n => n.Recipient == userId && n.Channel == NotificationChannel.Push && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true), ct);
    }
}
