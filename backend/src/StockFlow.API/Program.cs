using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using StockFlow.Agents.Orchestrator;
using StockFlow.Agents.ReorderAdvisor;
using StockFlow.Agents.SpecializedAgents;
using StockFlow.Agents.State;
using StockFlow.Agents.Tools;
using StockFlow.Agents.Validator;
using StockFlow.Application.Interfaces;
using StockFlow.Application.Services;
using StockFlow.Infrastructure;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// ── Infrastructure (PostgreSQL + Notifications) ─────────────────────────────
builder.Services.AddInfrastructure(builder.Configuration);

// ── Application Services ─────────────────────────────────────────────────────
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IStockService, StockService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IFieldService, FieldService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IAgentWorkflowService, AgentWorkflowService>();

// ── Agentic AI Layer ─────────────────────────────────────────────────────────
builder.Services.AddSingleton<DurableStateStore>();
builder.Services.AddScoped<IStockTool, DbStockTool>();
builder.Services.AddScoped<IOrderHistoryTool, DbOrderHistoryTool>();
builder.Services.AddScoped<IFieldContextTool, DbFieldContextTool>();
builder.Services.AddScoped<ToolRegistry>();
builder.Services.AddScoped<InventoryAnalystAgent>();
builder.Services.AddScoped<DemandOrderContextAgent>();
builder.Services.AddScoped<FieldContextAgent>();
builder.Services.AddScoped<ReorderAdvisorAgent>();
builder.Services.AddScoped<SchemaValidator>();
builder.Services.AddScoped<BusinessRuleValidator>();
builder.Services.AddScoped<ValidatorAgent>();
builder.Services.AddScoped<IAgentOrchestrator, AgentOrchestrator>();

// ── JWT Authentication ───────────────────────────────────────────────────────
var jwtKey = builder.Configuration["Jwt:Key"] ?? "StockFlowDefaultSecretKey_ChangeMe_AtLeast32Chars!";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "StockFlow.API",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "StockFlow.Clients",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });
builder.Services.AddAuthorization();

// ── CORS ─────────────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("StockFlowClients", policy =>
        policy.WithOrigins(
                "http://localhost:3000", "http://localhost:5173",  // React dev
                "http://localhost:4200",                            // Angular dev
                "http://10.0.2.2:5000", "http://10.0.2.2:5001"   // Flutter Android emulator
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

// ── Controllers + Swagger ────────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Swagger with JWT Bearer auth
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "StockFlow AI API",
        Version = "v1",
        Description = "SME Inventory, Order & Field-Ops Platform — SE3090 Assignment"
    });
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Enter your JWT token. Example: Bearer {your-token}"
    });
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        [new Microsoft.OpenApi.Models.OpenApiSecurityScheme
        {
            Reference = new Microsoft.OpenApi.Models.OpenApiReference
            {
                Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                Id = "Bearer"
            }
        }] = Array.Empty<string>()
    });
});

var app = builder.Build();

// ── Middleware Pipeline ───────────────────────────────────────────────────────
app.UseSwagger(c =>
{
    c.RouteTemplate = "openapi/{documentName}.json";
});
app.MapScalarApiReference(options =>
{
    options.WithTitle("StockFlow AI API")
           .WithTheme(ScalarTheme.Moon)
           .WithOpenApiRoutePattern("/openapi/{documentName}.json");
});

app.UseHttpsRedirection();
app.UseCors("StockFlowClients");
app.UseAuthentication();
app.UseAuthorization();

// Global exception handler
app.UseExceptionHandler(errApp =>
    errApp.Run(async ctx =>
    {
        ctx.Response.StatusCode = 500;
        ctx.Response.ContentType = "application/json";
        var feature = ctx.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>();
        var ex = feature?.Error;
        var logger = ctx.RequestServices.GetRequiredService<ILogger<Program>>();
        var innerMsg = ex?.InnerException?.InnerException?.Message ?? ex?.InnerException?.Message;
        await ctx.Response.WriteAsJsonAsync(new { error = "An unexpected error occurred.", detail = ex?.Message, inner = innerMsg });
    }));

app.MapControllers();

// ── Seed Database on startup ─────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    try
    {
        var context = services.GetRequiredService<StockFlow.Infrastructure.Persistence.ApplicationDbContext>();
        await StockFlow.Infrastructure.Persistence.DatabaseSeeder.SeedAsync(context, logger);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred while seeding the database.");
    }
}

app.Run();
