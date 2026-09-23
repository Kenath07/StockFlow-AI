using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StockFlow.Domain.Entities.Product;

namespace StockFlow.Infrastructure.Persistence.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Sku).IsRequired().HasMaxLength(50);
        builder.Property(x => x.Name).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Description).HasMaxLength(1000);
        builder.Property(x => x.UnitPrice).HasPrecision(18, 2);
        builder.Property(x => x.CostPrice).HasPrecision(18, 2);
        builder.Property(x => x.UnitOfMeasure).HasMaxLength(30);
        builder.Property(x => x.Barcode).HasMaxLength(100);
        builder.Property(x => x.QrCode).HasMaxLength(500);

        builder.HasIndex(x => x.Sku).IsUnique();
        builder.HasIndex(x => x.Barcode).HasFilter("\"Barcode\" IS NOT NULL");

        builder.HasOne(x => x.Category)
            .WithMany(c => c.Products)
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.StockLevel)
            .WithOne(s => s.Product)
            .HasForeignKey<StockLevel>(s => s.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.LowStockThreshold)
            .WithOne(t => t.Product)
            .HasForeignKey<LowStockThreshold>(t => t.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
