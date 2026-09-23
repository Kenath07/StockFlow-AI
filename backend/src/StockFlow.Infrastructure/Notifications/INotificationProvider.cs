namespace StockFlow.Infrastructure.Notifications;

public interface INotificationProvider
{
    string Channel { get; }
    Task<(bool Success, string Response)> SendAsync(string recipient, string subject, string message, CancellationToken ct = default);
}
