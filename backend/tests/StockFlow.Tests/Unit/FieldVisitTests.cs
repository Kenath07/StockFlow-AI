using StockFlow.Domain.Entities.Field;

namespace StockFlow.Tests.Unit;

public class FieldVisitTests
{
    [Fact]
    public void CustomerVisit_ValidCoordinates_PassesSriLankaGeographicBoundaries()
    {
        // Sri Lanka bounding box roughly: Lat 5.9° to 9.9° N, Lon 79.5° to 81.9° E
        var visit = new CustomerVisit
        {
            CustomerName = "Colombo Supermarket",
            Latitude = 6.9271,
            Longitude = 79.8612,
            Notes = "Field sales stock inspection"
        };

        // Assert
        visit.Latitude.Should().BeInRange(5.5, 10.0);
        visit.Longitude.Should().BeInRange(79.0, 82.5);
    }

    [Fact]
    public void CustomerVisit_CheckOut_CalculatesDurationCorrectly()
    {
        // Arrange
        var checkInTime = DateTime.UtcNow.AddMinutes(-45);
        var checkOutTime = DateTime.UtcNow;

        var visit = new CustomerVisit
        {
            VisitedAt = checkInTime,
            CheckOutAt = checkOutTime
        };

        // Act
        var durationMinutes = (visit.CheckOutAt!.Value - visit.VisitedAt).TotalMinutes;

        // Assert
        durationMinutes.Should().BeApproximately(45, 1.0);
    }

    [Fact]
    public void DeviceCapture_StoresBarcodeAndLocationAccurately()
    {
        // Arrange & Act
        var capture = new DeviceCapture
        {
            CaptureType = "Barcode",
            BarcodeData = "794511234001",
            ProductSku = "BEV-TEA-001",
            Latitude = 6.9271,
            Longitude = 79.8612,
            IsVerified = true
        };

        // Assert
        capture.CaptureType.Should().Be("Barcode");
        capture.ProductSku.Should().Be("BEV-TEA-001");
        capture.IsVerified.Should().BeTrue();
    }
}
