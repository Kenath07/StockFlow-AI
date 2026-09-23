using StockFlow.Application.DTOs.Auth;

namespace StockFlow.Application.Interfaces;

public interface IAuthService
{
    Task<LoginResponseDto> LoginAsync(LoginRequestDto request, CancellationToken ct = default);
    Task<UserDto> RegisterAsync(RegisterRequestDto request, CancellationToken ct = default);
    Task<UserDto> GetCurrentUserAsync(string userId, CancellationToken ct = default);
    Task<List<UserDto>> GetAllUsersAsync(CancellationToken ct = default);
    Task<bool> DeactivateUserAsync(Guid userId, CancellationToken ct = default);
}
