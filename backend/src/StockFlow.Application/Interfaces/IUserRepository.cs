using StockFlow.Domain.Entities.Identity;
using StockFlow.Domain.Enums;

namespace StockFlow.Application.Interfaces;

public interface IUserRepository
{
    Task<ApplicationUser?> GetByEmailAsync(string email, CancellationToken ct = default);
    Task<ApplicationUser?> GetByIdAsync(Guid userId, CancellationToken ct = default);
    Task<bool> EmailExistsAsync(string email, CancellationToken ct = default);
    Task AddAsync(ApplicationUser user, CancellationToken ct = default);
    Task UpdateAsync(ApplicationUser user, CancellationToken ct = default);
    Task<List<ApplicationUser>> GetAllAsync(CancellationToken ct = default);
    Task<List<ApplicationUser>> GetByRolesAsync(List<UserRole> roles, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
