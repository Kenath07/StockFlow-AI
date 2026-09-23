using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StockFlow.Application.DTOs.Field;
using StockFlow.Application.Interfaces;
using System.Security.Claims;

namespace StockFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FieldController : ControllerBase
{
    private readonly IFieldService _field;
    private readonly IStockService _stock;

    public FieldController(IFieldService field, IStockService stock)
    {
        _field = field;
        _stock = stock;
    }

    /// <summary>Get field agent profile for the authenticated user.</summary>
    [HttpGet("my-profile")]
    [Authorize(Roles = "FieldSales")]
    public async Task<IActionResult> MyProfile(CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var profile = await _field.GetProfileByUserIdAsync(userId, ct);
        return profile is null ? NotFound() : Ok(profile);
    }

    /// <summary>Get all registered field agents (Admin & Manager supervisory view).</summary>
    [HttpGet("agents")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> GetAllAgents(CancellationToken ct)
        => Ok(await _field.GetAllAgentsAsync(ct));

    /// <summary>Get all customer visit logs across all agents.</summary>
    [HttpGet("visits")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> GetAllVisits(CancellationToken ct)
        => Ok(await _field.GetAllVisitsAsync(ct));

    /// <summary>Get all device captures (QR / GPS audit logs).</summary>
    [HttpGet("captures")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> GetAllCaptures(CancellationToken ct)
        => Ok(await _field.GetAllCapturesAsync(ct));

    /// <summary>Get all offline sync queue items.</summary>
    [HttpGet("sync")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> GetAllSyncQueues(CancellationToken ct)
        => Ok(await _field.GetAllSyncQueuesAsync(ct));

    /// <summary>Get visits for a specific field agent.</summary>
    [HttpGet("visits/{agentId:guid}")]
    [Authorize(Roles = "Admin,Manager,FieldSales")]
    public async Task<IActionResult> GetVisits(Guid agentId, CancellationToken ct)
        => Ok(await _field.GetVisitsAsync(agentId, ct));

    /// <summary>Log a new customer visit with GPS coordinates.</summary>
    [HttpPost("visits/{agentId:guid?}")]
    [HttpPost("visits")]
    [Authorize(Roles = "FieldSales,Admin")]
    public async Task<IActionResult> CreateVisit([FromRoute] Guid? agentId, [FromBody] CreateCustomerVisitDto dto, CancellationToken ct)
    {
        try
        {
            Guid? authUserId = null;
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.IsNullOrEmpty(sub) && Guid.TryParse(sub, out var parsedSub))
            {
                authUserId = parsedSub;
            }

            var targetAgentId = agentId.GetValueOrDefault();
            var visit = await _field.CreateVisitAsync(targetAgentId, dto, authUserId, ct);
            return CreatedAtAction(nameof(GetVisits), new { agentId = visit.FieldAgentId }, visit);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    /// <summary>Check out from a visit.</summary>
    [HttpPost("visits/{visitId:guid}/checkout")]
    [Authorize(Roles = "FieldSales,Admin")]
    public async Task<IActionResult> CheckOut(Guid visitId, CancellationToken ct)
    {
        try { return Ok(await _field.CheckOutAsync(visitId, ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    /// <summary>Record a QR/barcode device capture during a visit.</summary>
    [HttpPost("captures")]
    [Authorize(Roles = "FieldSales,Admin")]
    public async Task<IActionResult> RecordCapture([FromBody] CreateDeviceCaptureDto dto, CancellationToken ct)
    {
        try { return Ok(await _field.RecordCaptureAsync(dto, ct)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    /// <summary>Check real-time stock availability for a product (field agents).</summary>
    [HttpGet("stock-check/{productId:guid}")]
    [Authorize(Roles = "FieldSales,Admin,Storekeeper")]
    public async Task<IActionResult> StockCheck(Guid productId, CancellationToken ct)
    {
        var level = await _stock.GetStockLevelByProductAsync(productId, ct);
        return level is null ? NotFound() : Ok(level);
    }

    /// <summary>Submit offline sync payload for processing.</summary>
    [HttpPost("sync/{agentId:guid}")]
    [Authorize(Roles = "FieldSales,Admin")]
    public async Task<IActionResult> OfflineSync(Guid agentId, [FromBody] OfflineSyncDto dto, CancellationToken ct)
    {
        var queueId = await _field.ProcessOfflineSyncAsync(agentId, dto, ct);
        return Accepted(new { QueueId = queueId, Status = "Queued" });
    }

    /// <summary>Get sync queue status for a field agent.</summary>
    [HttpGet("sync/{agentId:guid}/status")]
    [Authorize(Roles = "FieldSales,Admin,Manager")]
    public async Task<IActionResult> SyncStatus(Guid agentId, CancellationToken ct)
        => Ok(await _field.GetOfflineSyncStatusAsync(agentId, ct));
}
