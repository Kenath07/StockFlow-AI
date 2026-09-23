using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StockFlow.Application.DTOs.Product;
using StockFlow.Application.Interfaces;
using System.Security.Claims;

namespace StockFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StockController : ControllerBase
{
    private readonly IStockService _stock;

    public StockController(IStockService stock) => _stock = stock;

    /// <summary>Get all stock levels across all products.</summary>
    [HttpGet("levels")]
    public async Task<IActionResult> GetLevels(CancellationToken ct)
        => Ok(await _stock.GetAllStockLevelsAsync(ct));

    /// <summary>Get stock level for a specific product.</summary>
    [HttpGet("levels/{productId:guid}")]
    public async Task<IActionResult> GetLevel(Guid productId, CancellationToken ct)
    {
        var level = await _stock.GetStockLevelByProductAsync(productId, ct);
        return level is null ? NotFound() : Ok(level);
    }

    /// <summary>Get stock movements (audit history). Filterable by product.</summary>
    [HttpGet("movements")]
    public async Task<IActionResult> GetMovements([FromQuery] Guid? productId, [FromQuery] int take = 50, CancellationToken ct = default)
        => Ok(await _stock.GetMovementsAsync(productId, take, ct));

    /// <summary>Adjust stock quantity (Storekeeper only).</summary>
    [HttpPost("adjustments")]
    [Authorize(Roles = "Admin,Storekeeper")]
    public async Task<IActionResult> AdjustStock([FromBody] CreateStockAdjustmentDto dto, CancellationToken ct)
    {
        try
        {
            var by = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            return Ok(await _stock.AdjustStockAsync(dto, by, ct));
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    /// <summary>Get all products currently below their low-stock threshold.</summary>
    [HttpGet("low-stock")]
    public async Task<IActionResult> GetLowStock(CancellationToken ct)
        => Ok(await _stock.GetLowStockProductsAsync(ct));

    /// <summary>Get all low-stock thresholds across all products.</summary>
    [HttpGet("thresholds")]
    public async Task<IActionResult> GetThresholds(CancellationToken ct)
        => Ok(await _stock.GetAllThresholdsAsync(ct));

    /// <summary>Get low-stock threshold config for a product.</summary>
    [HttpGet("thresholds/{productId:guid}")]
    public async Task<IActionResult> GetThreshold(Guid productId, CancellationToken ct)
    {
        var threshold = await _stock.GetThresholdAsync(productId, ct);
        return threshold is null ? NotFound() : Ok(threshold);
    }

    /// <summary>Create or update low-stock threshold.</summary>
    [HttpPut("thresholds/{productId:guid}")]
    [Authorize(Roles = "Admin,Storekeeper,Manager")]
    public async Task<IActionResult> UpsertThreshold(Guid productId, [FromBody] UpdateLowStockThresholdDto dto, CancellationToken ct)
    {
        var by = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        return Ok(await _stock.UpsertThresholdAsync(productId, dto, by, ct));
    }
}
