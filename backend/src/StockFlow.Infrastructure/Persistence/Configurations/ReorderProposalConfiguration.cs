using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StockFlow.Domain.Entities.Agent;

namespace StockFlow.Infrastructure.Persistence.Configurations;

public class ReorderProposalConfiguration : IEntityTypeConfiguration<ReorderProposal>
{
    public void Configure(EntityTypeBuilder<ReorderProposal> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ProductName).IsRequired().HasMaxLength(200);
        builder.Property(x => x.ProductSku).IsRequired().HasMaxLength(50);
        builder.Property(x => x.Justification).IsRequired().HasMaxLength(2000);
        builder.Property(x => x.EstimatedCost).HasPrecision(18, 2);
        builder.HasIndex(x => x.AgentWorkflowId);

        builder.HasOne(x => x.AgentWorkflow)
            .WithMany(w => w.ReorderProposals)
            .HasForeignKey(x => x.AgentWorkflowId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
