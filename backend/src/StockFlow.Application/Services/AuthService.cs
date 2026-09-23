using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using StockFlow.Application.DTOs.Auth;
using StockFlow.Application.Interfaces;
using StockFlow.Domain.Entities.Identity;
using StockFlow.Domain.Enums;

namespace StockFlow.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepo;
    private readonly IConfiguration _config;
    private readonly ILogger<AuthService> _logger;

    public AuthService(IUserRepository userRepo, IConfiguration config, ILogger<AuthService> logger)
    {
        _userRepo = userRepo;
        _config = config;
        _logger = logger;
    }

    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto request, CancellationToken ct = default)
    {
        var user = await _userRepo.GetByEmailAsync(request.Email, ct)
            ?? throw new UnauthorizedAccessException("Invalid credentials.");

        if (!user.IsActive)
            throw new UnauthorizedAccessException("Invalid credentials.");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid credentials.");

        user.LastLoginAt = DateTime.UtcNow;
        await _userRepo.UpdateAsync(user, ct);
        await _userRepo.SaveChangesAsync(ct);

        var token = GenerateJwt(user);
        var refreshToken = Guid.NewGuid().ToString(); // TODO: Implement proper refresh token logic
        return new LoginResponseDto(token, refreshToken, user.Username, user.FullName, user.Role.ToString(), DateTime.UtcNow.AddHours(8));
    }

    public async Task<UserDto> RegisterAsync(RegisterRequestDto request, CancellationToken ct = default)
    {
        if (await _userRepo.EmailExistsAsync(request.Email, ct))
            throw new InvalidOperationException($"Email '{request.Email}' is already registered.");

        if (!Enum.TryParse<UserRole>(request.Role, ignoreCase: true, out var role))
            throw new ArgumentException($"Invalid role '{request.Role}'.");

        var user = new ApplicationUser
        {
            Username = request.Username,
            Email = request.Email,
            FullName = request.FullName,
            PhoneNumber = request.PhoneNumber,
            Role = role,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, workFactor: 12)
        };

        await _userRepo.AddAsync(user, ct);
        await _userRepo.SaveChangesAsync(ct);
        _logger.LogInformation("User {Email} registered as {Role}", user.Email, user.Role);
        return ToDto(user);
    }

    public async Task<UserDto> GetCurrentUserAsync(string userId, CancellationToken ct = default)
    {
        var user = await _userRepo.GetByIdAsync(Guid.Parse(userId), ct)
            ?? throw new KeyNotFoundException("User not found.");
        return ToDto(user);
    }

    public async Task<List<UserDto>> GetAllUsersAsync(CancellationToken ct = default)
    {
        var users = await _userRepo.GetAllAsync(ct);
        return users.Select(u => ToDto(u)).ToList();
    }

    public async Task<bool> DeactivateUserAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _userRepo.GetByIdAsync(userId, ct);
        if (user is null) return false;
        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;
        await _userRepo.UpdateAsync(user, ct);
        await _userRepo.SaveChangesAsync(ct);
        return true;
    }

    private string GenerateJwt(ApplicationUser user)
    {
        var key = Encoding.UTF8.GetBytes(_config["Jwt:Key"] ?? "StockFlowDefaultSecretKey_ChangeMe!");
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(JwtRegisteredClaimNames.Name, user.FullName),
            new(ClaimTypes.Role, user.Role.ToString()),
            new("username", user.Username),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(8),
            Issuer = _config["Jwt:Issuer"] ?? "StockFlow.API",
            Audience = _config["Jwt:Audience"] ?? "StockFlow.Clients",
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature)
        };

        var handler = new JwtSecurityTokenHandler();
        return handler.WriteToken(handler.CreateToken(tokenDescriptor));
    }

    private static UserDto ToDto(ApplicationUser u) => new(
        u.Id, u.Username, u.Email, u.FullName, u.PhoneNumber, u.Role.ToString(), u.IsActive, u.CreatedAt);
}
