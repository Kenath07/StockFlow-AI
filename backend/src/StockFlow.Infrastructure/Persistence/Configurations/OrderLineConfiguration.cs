using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StockFlow.Domain.Entities.Order;

namespace StockFlow.Infrastructure.Persistence.Configurations;

public class OrderLineConfiguration : IEntityTypeConfiguration<OrderLine>
{
    public void Configure(EntityTypeBuilder<OrderLine> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.UnitPrice).HasPrecision(18, 2);
        builder.Ignore(x => x.TotalPrice);
        builder.HasIndex(x => x.SalesOrderId);

        builder.HasOne(x => x.SalesOrder)
            .WithMany(o => o.Lines)
            .HasForeignKey(x => x.SalesOrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
