using StockFlow.Domain.Enums;

namespace StockFlow.Domain.Entities.Identity;

public class ApplicationUser : BaseEntity
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public UserRole Role { get; set; } = UserRole.FieldSales;
    public bool IsActive { get; set; } = true;
    public DateTime? LastLoginAt { get; set; }
}
