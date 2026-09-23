using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StockFlow.Domain.Entities.Product;

namespace StockFlow.Infrastructure.Persistence.Configurations;

public class StockAdjustmentConfiguration : IEntityTypeConfiguration<StockAdjustment>
{
    public void Configure(EntityTypeBuilder<StockAdjustment> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Reason).IsRequired().HasMaxLength(500);
        builder.Property(x => x.AdjustedBy).HasMaxLength(150);
        builder.Ignore(x => x.QuantityAdjusted);
        builder.HasIndex(x => x.ProductId);

        builder.HasOne(x => x.Product)
            .WithMany(p => p.StockAdjustments)
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
