using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StockFlow.Application.DTOs.Order;
using StockFlow.Infrastructure.Persistence;

namespace StockFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CustomersController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public CustomersController(ApplicationDbContext db) => _db = db;

    /// <summary>Get all active customers.</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var customers = await _db.Customers
            .Where(c => c.IsActive)
            .OrderBy(c => c.Name)
            .Select(c => new CustomerDto(c.Id, c.Name, c.ContactPerson, c.Email, c.Phone, c.Address, c.City, c.Latitude, c.Longitude, c.IsActive))
            .ToListAsync(ct);
        return Ok(customers);
    }

    /// <summary>Get a customer by ID.</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var c = await _db.Customers.FindAsync(new object[] { id }, ct);
        if (c is null) return NotFound();
        return Ok(new CustomerDto(c.Id, c.Name, c.ContactPerson, c.Email, c.Phone, c.Address, c.City, c.Latitude, c.Longitude, c.IsActive));
    }

    /// <summary>Create a new customer. Admin or Manager.</summary>
    [HttpPost]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Create([FromBody] CreateCustomerDto dto, CancellationToken ct)
    {
        var customer = new Domain.Entities.Order.Customer
        {
            Name = dto.Name, ContactPerson = dto.ContactPerson, Email = dto.Email,
            Phone = dto.Phone, Address = dto.Address, City = dto.City,
            Latitude = dto.Latitude, Longitude = dto.Longitude
        };
        _db.Customers.Add(customer);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = customer.Id },
            new CustomerDto(customer.Id, customer.Name, customer.ContactPerson, customer.Email, customer.Phone, customer.Address, customer.City, customer.Latitude, customer.Longitude, customer.IsActive));
    }

    /// <summary>Update a customer. Admin or Manager.</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreateCustomerDto dto, CancellationToken ct)
    {
        var customer = await _db.Customers.FindAsync(new object[] { id }, ct);
        if (customer is null) return NotFound();
        customer.Name = dto.Name; customer.ContactPerson = dto.ContactPerson;
        customer.Email = dto.Email; customer.Phone = dto.Phone;
        customer.Address = dto.Address; customer.City = dto.City;
        customer.Latitude = dto.Latitude; customer.Longitude = dto.Longitude;
        customer.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return Ok(new CustomerDto(customer.Id, customer.Name, customer.ContactPerson, customer.Email, customer.Phone, customer.Address, customer.City, customer.Latitude, customer.Longitude, customer.IsActive));
    }
}
