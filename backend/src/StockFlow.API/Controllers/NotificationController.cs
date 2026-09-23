using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StockFlow.Application.Interfaces;

using System.Security.Claims;

namespace StockFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationController : ControllerBase
{
    private readonly INotificationService _notifications;

    public NotificationController(INotificationService notifications) => _notifications = notifications;

    /// <summary>Send a manual SMS notification.</summary>
    [HttpPost("sms")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> SendSms([FromBody] SendNotificationRequest dto, CancellationToken ct)
    {
        var id = await _notifications.SendSmsAsync(dto.Recipient, dto.Subject, dto.Message, ct: ct);
        return Ok(new { NotificationLogId = id });
    }

    /// <summary>Send a manual email notification.</summary>
    [HttpPost("email")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> SendEmail([FromBody] SendNotificationRequest dto, CancellationToken ct)
    {
        var id = await _notifications.SendEmailAsync(dto.Recipient, dto.Subject, dto.Message, ct: ct);
        return Ok(new { NotificationLogId = id });
    }

    /// <summary>Get current user's in-app notifications.</summary>
    [HttpGet]
    public async Task<IActionResult> GetMyNotifications(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var notifications = await _notifications.GetUserNotificationsAsync(userId, ct);
        return Ok(notifications);
    }

    /// <summary>Mark a notification as read.</summary>
    [HttpPut("{id:guid}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        await _notifications.MarkAsReadAsync(id, userId, ct);
        return NoContent();
    }

    /// <summary>Mark all notifications as read.</summary>
    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllAsRead(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        await _notifications.MarkAllAsReadAsync(userId, ct);
        return NoContent();
    }
}

public record SendNotificationRequest(string Recipient, string Subject, string Message);
