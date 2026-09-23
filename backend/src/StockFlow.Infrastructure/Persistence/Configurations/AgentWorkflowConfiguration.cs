using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StockFlow.Domain.Entities.Agent;

namespace StockFlow.Infrastructure.Persistence.Configurations;

public class AgentWorkflowConfiguration : IEntityTypeConfiguration<AgentWorkflow>
{
    public void Configure(EntityTypeBuilder<AgentWorkflow> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.TriggerSource).IsRequired().HasMaxLength(100);
        builder.Property(x => x.Objective).IsRequired().HasMaxLength(1000);
        builder.Property(x => x.InitiatedBy).HasMaxLength(150);
        builder.Property(x => x.FailureReason).HasMaxLength(2000);
        builder.HasIndex(x => x.Status);

        builder.HasOne(x => x.ApprovalGate)
            .WithOne(a => a.AgentWorkflow)
            .HasForeignKey<ApprovalGate>(a => a.AgentWorkflowId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
