using Microsoft.EntityFrameworkCore;
using StockFlow.Domain.Entities.Agent;
using StockFlow.Domain.Entities.Field;
using StockFlow.Domain.Entities.Identity;
using StockFlow.Domain.Entities.Notification;
using StockFlow.Domain.Entities.Order;
using StockFlow.Domain.Entities.Product;

namespace StockFlow.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    // Identity
    public DbSet<ApplicationUser> Users => Set<ApplicationUser>();

    // Product & Inventory (Component A)
    public DbSet<ProductCategory> ProductCategories => Set<ProductCategory>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<StockLevel> StockLevels => Set<StockLevel>();
    public DbSet<StockMovement> StockMovements => Set<StockMovement>();
    public DbSet<LowStockThreshold> LowStockThresholds => Set<LowStockThreshold>();
    public DbSet<StockAdjustment> StockAdjustments => Set<StockAdjustment>();

    // Orders & Customers (Component B)
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<SalesOrder> SalesOrders => Set<SalesOrder>();
    public DbSet<OrderLine> OrderLines => Set<OrderLine>();
    public DbSet<OrderStatusHistory> OrderStatusHistories => Set<OrderStatusHistory>();
    public DbSet<PaymentReference> PaymentReferences => Set<PaymentReference>();

    // Field Operations (Component C)
    public DbSet<FieldAgentProfile> FieldAgentProfiles => Set<FieldAgentProfile>();
    public DbSet<CustomerVisit> CustomerVisits => Set<CustomerVisit>();
    public DbSet<DeviceCapture> DeviceCaptures => Set<DeviceCapture>();
    public DbSet<OfflineSyncQueue> OfflineSyncQueues => Set<OfflineSyncQueue>();

    // Agent Workflows (Component D)
    public DbSet<AgentWorkflow> AgentWorkflows => Set<AgentWorkflow>();
    public DbSet<WorkflowStep> WorkflowSteps => Set<WorkflowStep>();
    public DbSet<ReorderProposal> ReorderProposals => Set<ReorderProposal>();
    public DbSet<ToolCallLog> ToolCallLogs => Set<ToolCallLog>();
    public DbSet<ValidationResult> ValidationResults => Set<ValidationResult>();
    public DbSet<ApprovalGate> ApprovalGates => Set<ApprovalGate>();

    // Notifications
    public DbSet<NotificationLog> NotificationLogs => Set<NotificationLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }

    public override int SaveChanges()
    {
        UpdateAuditFields();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateAuditFields();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void UpdateAuditFields()
    {
        var entries = ChangeTracker.Entries<Domain.Entities.BaseEntity>();
        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Modified)
                entry.Entity.UpdatedAt = DateTime.UtcNow;
        }
    }
}
