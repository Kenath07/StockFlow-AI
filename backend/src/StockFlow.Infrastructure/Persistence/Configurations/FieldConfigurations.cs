using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StockFlow.Domain.Entities.Field;

namespace StockFlow.Infrastructure.Persistence.Configurations;

public class FieldAgentProfileConfiguration : IEntityTypeConfiguration<FieldAgentProfile>
{
    public void Configure(EntityTypeBuilder<FieldAgentProfile> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.EmployeeCode).IsRequired().HasMaxLength(50);
        builder.Property(x => x.Region).IsRequired().HasMaxLength(100);
        builder.Property(x => x.VehicleNumber).HasMaxLength(30);
        builder.HasIndex(x => x.EmployeeCode).IsUnique();
        builder.HasIndex(x => x.UserId).IsUnique();
    }
}

public class CustomerVisitConfiguration : IEntityTypeConfiguration<CustomerVisit>
{
    public void Configure(EntityTypeBuilder<CustomerVisit> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.CustomerName).IsRequired().HasMaxLength(200);
        builder.Property(x => x.AddressSnapshot).HasMaxLength(500);
        builder.Property(x => x.Notes).HasMaxLength(1000);
        builder.HasIndex(x => x.FieldAgentId);
        builder.HasIndex(x => x.VisitedAt);

        builder.HasOne(x => x.FieldAgent)
            .WithMany(f => f.Visits)
            .HasForeignKey(x => x.FieldAgentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class DeviceCaptureConfiguration : IEntityTypeConfiguration<DeviceCapture>
{
    public void Configure(EntityTypeBuilder<DeviceCapture> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.CaptureType).IsRequired().HasMaxLength(30);
        builder.Property(x => x.BarcodeData).HasMaxLength(500);
        builder.Property(x => x.QrCodeData).HasMaxLength(500);
        builder.Property(x => x.ProductSku).HasMaxLength(50);
        builder.Property(x => x.DeviceId).HasMaxLength(100);
        builder.HasIndex(x => x.CustomerVisitId);

        builder.HasOne(x => x.CustomerVisit)
            .WithMany(v => v.DeviceCaptures)
            .HasForeignKey(x => x.CustomerVisitId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class OfflineSyncQueueConfiguration : IEntityTypeConfiguration<OfflineSyncQueue>
{
    public void Configure(EntityTypeBuilder<OfflineSyncQueue> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.EntityType).IsRequired().HasMaxLength(100);
        builder.Property(x => x.Status).IsRequired().HasMaxLength(30);
        builder.Property(x => x.ErrorMessage).HasMaxLength(1000);
        builder.Property(x => x.DeviceId).HasMaxLength(100);
        builder.HasIndex(x => x.FieldAgentId);
        builder.HasIndex(x => x.Status);
    }
}
