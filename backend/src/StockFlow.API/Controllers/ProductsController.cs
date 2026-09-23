using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StockFlow.Application.DTOs.Product;
using StockFlow.Application.Interfaces;
using System.Security.Claims;

namespace StockFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProductsController : ControllerBase
{
    private readonly IProductService _products;

    public ProductsController(IProductService products) => _products = products;

    /// <summary>Get all active products with current stock level.</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool includeInactive = false, CancellationToken ct = default)
        => Ok(await _products.GetAllAsync(includeInactive, ct));

    /// <summary>Get a product by ID.</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var product = await _products.GetByIdAsync(id, ct);
        return product is null ? NotFound() : Ok(product);
    }

    /// <summary>Get product by SKU.</summary>
    [HttpGet("sku/{sku}")]
    public async Task<IActionResult> GetBySku(string sku, CancellationToken ct)
    {
        var product = await _products.GetBySkuAsync(sku, ct);
        return product is null ? NotFound() : Ok(product);
    }

    /// <summary>Get product by Barcode (Exact match).</summary>
    [HttpGet("barcode/{barcode}")]
    public async Task<IActionResult> GetByBarcode(string barcode, CancellationToken ct)
    {
        var product = await _products.GetByBarcodeAsync(barcode, ct);
        return product is null ? NotFound() : Ok(product);
    }

    /// <summary>Get all product categories.</summary>
    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories(CancellationToken ct)
        => Ok(await _products.GetCategoriesAsync(ct));

    /// <summary>Search products by name, SKU, or barcode.</summary>
    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q, [FromQuery] Guid? categoryId = null, CancellationToken ct = default)
        => Ok(await _products.SearchAsync(q, categoryId, ct));

    /// <summary>Create a new product.</summary>
    [HttpPost]
    [Authorize(Roles = "Admin,Storekeeper,Manager")]
    public async Task<IActionResult> Create([FromBody] CreateProductDto dto, CancellationToken ct)
    {
        try
        {
            var createdBy = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var product = await _products.CreateAsync(dto, createdBy, ct);
            return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
        }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    /// <summary>Update a product.</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,Storekeeper,Manager")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProductDto dto, CancellationToken ct)
    {
        try
        {
            var updatedBy = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            return Ok(await _products.UpdateAsync(id, dto, updatedBy, ct));
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    /// <summary>Soft-delete (deactivate) a product. Admin only.</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var result = await _products.DeleteAsync(id, ct);
        return result ? NoContent() : NotFound();
    }
}
