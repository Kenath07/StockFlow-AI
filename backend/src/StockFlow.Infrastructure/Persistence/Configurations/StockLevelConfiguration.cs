using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StockFlow.Domain.Entities.Product;

namespace StockFlow.Infrastructure.Persistence.Configurations;

public class StockLevelConfiguration : IEntityTypeConfiguration<StockLevel>
{
    public void Configure(EntityTypeBuilder<StockLevel> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.WarehouseLocation).HasMaxLength(200);
        builder.Ignore(x => x.QuantityAvailable); // computed property
        builder.HasIndex(x => x.ProductId).IsUnique();
    }
}
