using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StockFlow.Domain.Entities.Notification;

namespace StockFlow.Infrastructure.Persistence.Configurations;

public class NotificationLogConfiguration : IEntityTypeConfiguration<NotificationLog>
{
    public void Configure(EntityTypeBuilder<NotificationLog> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Recipient).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Subject).HasMaxLength(300);
        builder.Property(x => x.Message).IsRequired().HasMaxLength(2000);
        builder.Property(x => x.ProviderResponse).HasMaxLength(1000);
        builder.Property(x => x.RelatedEntityType).HasMaxLength(100);
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.Channel);
        builder.HasIndex(x => x.CreatedAt);
    }
}
