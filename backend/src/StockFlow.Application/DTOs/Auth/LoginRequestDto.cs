namespace StockFlow.Application.DTOs.Auth;

public record LoginRequestDto(string Email, string Password);

public record LoginResponseDto(
    string Token,
    string RefreshToken,
    string Username,
    string FullName,
    string Role,
    DateTime ExpiresAt);

public record RegisterRequestDto(
    string Username,
    string Email,
    string Password,
    string FullName,
    string? PhoneNumber,
    string Role); // Admin | Storekeeper | FieldSales | Manager

public record UserDto(
    Guid Id,
    string Username,
    string Email,
    string FullName,
    string? PhoneNumber,
    string Role,
    bool IsActive,
    DateTime CreatedAt);
