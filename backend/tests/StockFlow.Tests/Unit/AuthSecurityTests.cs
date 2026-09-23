using StockFlow.Application.DTOs.Auth;
using StockFlow.Application.Interfaces;
using StockFlow.Application.Services;
using StockFlow.Domain.Entities.Identity;
using StockFlow.Domain.Enums;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace StockFlow.Tests.Unit;

public class AuthSecurityTests
{
    private readonly Mock<IUserRepository> _userRepoMock;
    private readonly Mock<IConfiguration> _configMock;
    private readonly Mock<ILogger<AuthService>> _loggerMock;
    private readonly AuthService _authService;

    public AuthSecurityTests()
    {
        _userRepoMock = new Mock<IUserRepository>();
        _configMock = new Mock<IConfiguration>();
        _loggerMock = new Mock<ILogger<AuthService>>();

        _configMock.Setup(c => c["Jwt:Key"])
            .Returns("StockFlowAI_SuperSecretKey_SE3090_Project_2026_ChangeInProduction!");
        _configMock.Setup(c => c["Jwt:Issuer"]).Returns("StockFlow.API");
        _configMock.Setup(c => c["Jwt:Audience"]).Returns("StockFlow.Clients");

        _authService = new AuthService(_userRepoMock.Object, _configMock.Object, _loggerMock.Object);
    }

    [Fact]
    public async Task LoginAsync_ValidCredentials_ReturnsSuccessfulLoginResponse()
    {
        // Arrange
        var rawPassword = "AdminPassword@123";
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(rawPassword);

        var testUser = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = "admin@stockflow.ai",
            Username = "admin",
            FullName = "System Administrator",
            Role = UserRole.Admin,
            PasswordHash = passwordHash,
            IsActive = true
        };

        _userRepoMock.Setup(r => r.GetByEmailAsync("admin@stockflow.ai", It.IsAny<CancellationToken>()))
            .ReturnsAsync(testUser);

        var request = new LoginRequestDto("admin@stockflow.ai", rawPassword);

        // Act
        var response = await _authService.LoginAsync(request);

        // Assert
        response.Should().NotBeNull();
        response.Token.Should().NotBeNullOrWhiteSpace();
        response.Role.Should().Be("Admin");
        response.Username.Should().Be("admin");
    }

    [Fact]
    public async Task LoginAsync_InvalidPassword_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var testUser = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = "officer@stockflow.ai",
            Username = "officer",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("CorrectPassword"),
            IsActive = true
        };

        _userRepoMock.Setup(r => r.GetByEmailAsync("officer@stockflow.ai", It.IsAny<CancellationToken>()))
            .ReturnsAsync(testUser);

        var request = new LoginRequestDto("officer@stockflow.ai", "WrongPassword");

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _authService.LoginAsync(request));
    }

    [Fact]
    public async Task LoginAsync_InactiveUser_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var testUser = new ApplicationUser
        {
            Email = "disabled@stockflow.ai",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123"),
            IsActive = false // Deactivated
        };

        _userRepoMock.Setup(r => r.GetByEmailAsync("disabled@stockflow.ai", It.IsAny<CancellationToken>()))
            .ReturnsAsync(testUser);

        var request = new LoginRequestDto("disabled@stockflow.ai", "Password123");

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _authService.LoginAsync(request));
    }
}
