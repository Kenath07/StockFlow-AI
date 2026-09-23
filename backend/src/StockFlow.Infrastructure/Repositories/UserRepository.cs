using Microsoft.EntityFrameworkCore;
using StockFlow.Application.Interfaces;
using StockFlow.Domain.Entities.Identity;
using StockFlow.Domain.Enums;
using StockFlow.Infrastructure.Persistence;

namespace StockFlow.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _context;

    public UserRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApplicationUser?> GetByEmailAsync(string email, CancellationToken ct = default)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email, ct);
    }

    public async Task<ApplicationUser?> GetByIdAsync(Guid userId, CancellationToken ct = default)
    {
        return await _context.Users.FindAsync(new object[] { userId }, ct);
    }

    public async Task<bool> EmailExistsAsync(string email, CancellationToken ct = default)
    {
        return await _context.Users.AnyAsync(u => u.Email == email, ct);
    }

    public async Task AddAsync(ApplicationUser user, CancellationToken ct = default)
    {
        await _context.Users.AddAsync(user, ct);
    }

    public Task UpdateAsync(ApplicationUser user, CancellationToken ct = default)
    {
        _context.Users.Update(user);
        return Task.CompletedTask;
    }

    public async Task<List<ApplicationUser>> GetAllAsync(CancellationToken ct = default)
    {
        return await _context.Users.ToListAsync(ct);
    }

    public async Task<List<ApplicationUser>> GetByRolesAsync(List<UserRole> roles, CancellationToken ct = default)
    {
        return await _context.Users
            .Where(u => roles.Contains(u.Role))
            .ToListAsync(ct);
    }

    public async Task SaveChangesAsync(CancellationToken ct = default)
    {
        await _context.SaveChangesAsync(ct);
    }
}
