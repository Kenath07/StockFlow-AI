using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StockFlow.Application.Interfaces;
using StockFlow.Infrastructure.Notifications;
using StockFlow.Infrastructure.Persistence;
using StockFlow.Infrastructure.Repositories;

namespace StockFlow.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // PostgreSQL via EF Core
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(
                configuration.GetConnectionString("DefaultConnection"),
                b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)));

        // HTTP client for SMS gateway
        services.AddHttpClient("SmsGateway")
            .ConfigureHttpClient(c => c.Timeout = TimeSpan.FromSeconds(15));

        // Repositories
        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<IStockRepository, StockRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IFieldRepository, FieldRepository>();
        services.AddScoped<IAgentWorkflowRepository, AgentWorkflowRepository>();
        services.AddScoped<INotificationRepository, NotificationRepository>();

        // Notification providers
        services.AddScoped<INotificationProvider, SmsNotificationProvider>();
        services.AddScoped<INotificationProvider, EmailNotificationProvider>();
        services.AddScoped<INotificationGateway, NotificationGateway>();

        return services;
    }
}
