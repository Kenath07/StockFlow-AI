using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StockFlow.Domain.Entities.Agent;

namespace StockFlow.Infrastructure.Persistence.Configurations;

public class WorkflowStepConfiguration : IEntityTypeConfiguration<WorkflowStep>
{
    public void Configure(EntityTypeBuilder<WorkflowStep> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.AgentName).IsRequired().HasMaxLength(100);
        builder.Property(x => x.Status).IsRequired().HasMaxLength(50);
        builder.Property(x => x.ErrorMessage).HasMaxLength(2000);
        builder.HasIndex(x => new { x.AgentWorkflowId, x.StepOrder });

        builder.HasOne(x => x.AgentWorkflow)
            .WithMany(w => w.Steps)
            .HasForeignKey(x => x.AgentWorkflowId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
