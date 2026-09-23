using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StockFlow.Domain.Entities.Agent;

namespace StockFlow.Infrastructure.Persistence.Configurations;

public class ToolCallLogConfiguration : IEntityTypeConfiguration<ToolCallLog>
{
    public void Configure(EntityTypeBuilder<ToolCallLog> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ToolName).IsRequired().HasMaxLength(100);
        builder.Property(x => x.ErrorMessage).HasMaxLength(1000);
        builder.HasIndex(x => x.WorkflowStepId);

        builder.HasOne(x => x.WorkflowStep)
            .WithMany(s => s.ToolCallLogs)
            .HasForeignKey(x => x.WorkflowStepId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class ValidationResultConfiguration : IEntityTypeConfiguration<ValidationResult>
{
    public void Configure(EntityTypeBuilder<ValidationResult> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ValidatorName).IsRequired().HasMaxLength(100);
        builder.HasIndex(x => x.WorkflowStepId);

        builder.HasOne(x => x.WorkflowStep)
            .WithMany(s => s.ValidationResults)
            .HasForeignKey(x => x.WorkflowStepId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class ApprovalGateConfiguration : IEntityTypeConfiguration<ApprovalGate>
{
    public void Configure(EntityTypeBuilder<ApprovalGate> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ReviewedBy).HasMaxLength(150);
        builder.Property(x => x.ManagerComments).HasMaxLength(2000);
        builder.HasIndex(x => x.Status);
    }
}
