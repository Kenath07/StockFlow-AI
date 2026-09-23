using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StockFlow.Domain.Entities.Order;

namespace StockFlow.Infrastructure.Persistence.Configurations;

public class SalesOrderConfiguration : IEntityTypeConfiguration<SalesOrder>
{
    public void Configure(EntityTypeBuilder<SalesOrder> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.OrderNumber).IsRequired().HasMaxLength(50);
        builder.Property(x => x.TotalAmount).HasPrecision(18, 2);
        builder.Property(x => x.Notes).HasMaxLength(1000);
        builder.Property(x => x.DeliveryAddress).HasMaxLength(500);
        builder.HasIndex(x => x.OrderNumber).IsUnique();
        builder.HasIndex(x => x.CustomerId);
        builder.HasIndex(x => x.Status);

        builder.HasOne(x => x.Customer)
            .WithMany(c => c.Orders)
            .HasForeignKey(x => x.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.PaymentReference)
            .WithOne(p => p.SalesOrder)
            .HasForeignKey<PaymentReference>(p => p.SalesOrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
