using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StockFlow.Application.DTOs.Order;
using StockFlow.Application.Interfaces;
using System.Security.Claims;

namespace StockFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orders;
    private readonly IFieldService _field;

    public OrdersController(IOrderService orders, IFieldService field)
    {
        _orders = orders;
        _field = field;
    }

    /// <summary>Get all orders, optionally filtered by status.</summary>
    [HttpGet]
    [Authorize(Roles = "Admin,Manager,Storekeeper,FieldSales")]
    public async Task<IActionResult> GetAll([FromQuery] string? status, CancellationToken ct)
        => Ok(await _orders.GetAllAsync(status, ct));

    /// <summary>Get a specific order by ID.</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var order = await _orders.GetByIdAsync(id, ct);
        return order is null ? NotFound() : Ok(order);
    }

    /// <summary>Create a new sales order.</summary>
    [HttpPost]
    [Authorize(Roles = "Admin,FieldSales,Manager,Storekeeper")]
    public async Task<IActionResult> Create([FromBody] CreateOrderDto dto, CancellationToken ct)
    {
        try
        {
            var by = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            Guid? fieldAgentId = null;
            if (Guid.TryParse(by, out var userId))
            {
                var profile = await _field.GetProfileByUserIdAsync(userId, ct);
                fieldAgentId = profile?.Id;
            }

            var order = await _orders.CreateAsync(dto, by, fieldAgentId, ct);
            return CreatedAtAction(nameof(GetById), new { id = order.Id }, order);
        }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    /// <summary>Update order status (transition workflow).</summary>
    [HttpPut("{id:guid}/status")]
    [Authorize(Roles = "Admin,Manager,Storekeeper")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] OrderStatusUpdateDto dto, CancellationToken ct)
    {
        try
        {
            var by = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            return Ok(await _orders.UpdateStatusAsync(id, dto, by, ct));
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    /// <summary>Cancel an order.</summary>
    [HttpPost("{id:guid}/cancel")]
    [Authorize(Roles = "Admin,FieldSales,Manager")]
    public async Task<IActionResult> Cancel(Guid id, [FromBody] OrderStatusUpdateDto dto, CancellationToken ct)
    {
        try
        {
            var by = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await _orders.CancelAsync(id, dto.Reason ?? "No reason provided.", by, ct);
            return result ? NoContent() : NotFound();
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }
}
