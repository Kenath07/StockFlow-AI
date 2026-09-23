using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using StockFlow.Domain.Entities.Field;
using StockFlow.Domain.Entities.Identity;
using StockFlow.Domain.Entities.Order;
using StockFlow.Domain.Entities.Product;
using StockFlow.Domain.Enums;

namespace StockFlow.Infrastructure.Persistence;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context, ILogger logger, CancellationToken ct = default)
    {
        // ── 1. Users ──────────────────────────────────────────────────────────
        if (!await context.Users.AnyAsync(ct))
        {
            logger.LogInformation("Seeding initial users (Admin, Manager, FieldSales)...");

            var admin = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                Username = "admin",
                Email = "admin@stockflow.ai",
                FullName = "System Administrator",
                PhoneNumber = "+94771234567",
                Role = UserRole.Admin,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var manager = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                Username = "manager",
                Email = "manager@stockflow.ai",
                FullName = "Warehouse Manager",
                PhoneNumber = "+94772345678",
                Role = UserRole.Manager,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Manager@123"),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var storekeeper = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                Username = "storekeeper",
                Email = "storekeeper@stockflow.ai",
                FullName = "Warehouse Storekeeper",
                PhoneNumber = "+94774567890",
                Role = UserRole.Storekeeper,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Store@123"),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var officer = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                Username = "officer",
                Email = "officer@stockflow.ai",
                FullName = "Field Sales Officer",
                PhoneNumber = "+94773456789",
                Role = UserRole.FieldSales,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Officer@123"),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await context.Users.AddRangeAsync(new[] { admin, manager, storekeeper, officer }, ct);
            await context.SaveChangesAsync(ct);

            // Create FieldAgentProfile for the field officer
            var officerProfile = new FieldAgentProfile
            {
                Id = Guid.NewGuid(),
                UserId = officer.Id,
                EmployeeCode = "FA-001",
                Region = "Western Province",
                VehicleNumber = "WP-CAB-1234",
                IsOnDuty = true,
                LastActiveAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };
            await context.FieldAgentProfiles.AddAsync(officerProfile, ct);
            await context.SaveChangesAsync(ct);
        }

        // ── 2. Product Categories ─────────────────────────────────────────────
        if (!await context.ProductCategories.AnyAsync(ct))
        {
            logger.LogInformation("Seeding product categories...");

            var catBeverages = new ProductCategory { Id = Guid.NewGuid(), Name = "Beverages", Description = "Teas, Juices, and Drinks", CreatedAt = DateTime.UtcNow };
            var catDairy = new ProductCategory { Id = Guid.NewGuid(), Name = "Dairy & Chilled", Description = "Milk, Butter, Cheese", CreatedAt = DateTime.UtcNow };
            var catStaples = new ProductCategory { Id = Guid.NewGuid(), Name = "Dry Goods & Staples", Description = "Rice, Flour, Sugar, Spices", CreatedAt = DateTime.UtcNow };
            var catSnacks = new ProductCategory { Id = Guid.NewGuid(), Name = "Snacks & Confectionery", Description = "Biscuits, Chips, Chocolates", CreatedAt = DateTime.UtcNow };

            await context.ProductCategories.AddRangeAsync(new[] { catBeverages, catDairy, catStaples, catSnacks }, ct);
            await context.SaveChangesAsync(ct);

            // ── 3. Products + Stock Levels + Low Stock Thresholds ─────────────
            logger.LogInformation("Seeding sample products with initial stock...");

            var products = new List<Product>
            {
                new Product
                {
                    Id = Guid.NewGuid(),
                    CategoryId = catBeverages.Id,
                    Sku = "BEV-TEA-001",
                    Name = "Ceylon Premium Black Tea 500g",
                    Description = "Single-origin high-grown Ceylon BOPF black tea",
                    UnitPrice = 1250.00m,
                    CostPrice = 850.00m,
                    Barcode = "479100100001",
                    UnitOfMeasure = "Pack",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Product
                {
                    Id = Guid.NewGuid(),
                    CategoryId = catBeverages.Id,
                    Sku = "BEV-JUC-002",
                    Name = "Fresh Mango Juice 1L",
                    Description = "Pure mango nectar with no added sugar",
                    UnitPrice = 680.00m,
                    CostPrice = 450.00m,
                    Barcode = "479100100002",
                    UnitOfMeasure = "Bottle",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Product
                {
                    Id = Guid.NewGuid(),
                    CategoryId = catDairy.Id,
                    Sku = "DAI-MLK-001",
                    Name = "Full Cream UHT Milk 1L",
                    Description = "Pasteurized full cream homogenized cow milk",
                    UnitPrice = 480.00m,
                    CostPrice = 360.00m,
                    Barcode = "479100200001",
                    UnitOfMeasure = "Carton",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Product
                {
                    Id = Guid.NewGuid(),
                    CategoryId = catStaples.Id,
                    Sku = "STP-RCE-001",
                    Name = "Nadu Rice 5kg",
                    Description = "Locally harvested parboiled long-grain white rice",
                    UnitPrice = 1150.00m,
                    CostPrice = 920.00m,
                    Barcode = "479100300001",
                    UnitOfMeasure = "Bag",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Product
                {
                    Id = Guid.NewGuid(),
                    CategoryId = catSnacks.Id,
                    Sku = "SNK-BIS-001",
                    Name = "Marie Gold Biscuits 400g",
                    Description = "Crispy golden wheat tea biscuits",
                    UnitPrice = 320.00m,
                    CostPrice = 220.00m,
                    Barcode = "479100400001",
                    UnitOfMeasure = "Packet",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                }
            };

            await context.Products.AddRangeAsync(products, ct);
            await context.SaveChangesAsync(ct);

            // Stock Levels & Thresholds
            var stockLevels = new List<StockLevel>
            {
                // BEV-TEA-001: Low stock scenario to test agentic reorder recommendations
                new StockLevel { Id = Guid.NewGuid(), ProductId = products[0].Id, QuantityOnHand = 8, QuantityReserved = 0, CreatedAt = DateTime.UtcNow },
                // BEV-JUC-002: Critical stock scenario
                new StockLevel { Id = Guid.NewGuid(), ProductId = products[1].Id, QuantityOnHand = 3, QuantityReserved = 0, CreatedAt = DateTime.UtcNow },
                // DAI-MLK-001: Healthy stock
                new StockLevel { Id = Guid.NewGuid(), ProductId = products[2].Id, QuantityOnHand = 120, QuantityReserved = 10, CreatedAt = DateTime.UtcNow },
                // STP-RCE-001: Healthy stock
                new StockLevel { Id = Guid.NewGuid(), ProductId = products[3].Id, QuantityOnHand = 75, QuantityReserved = 5, CreatedAt = DateTime.UtcNow },
                // SNK-BIS-001: Healthy stock
                new StockLevel { Id = Guid.NewGuid(), ProductId = products[4].Id, QuantityOnHand = 200, QuantityReserved = 0, CreatedAt = DateTime.UtcNow }
            };

            var thresholds = new List<LowStockThreshold>
            {
                new LowStockThreshold { Id = Guid.NewGuid(), ProductId = products[0].Id, MinThreshold = 20, ReorderQuantity = 50, CreatedAt = DateTime.UtcNow },
                new LowStockThreshold { Id = Guid.NewGuid(), ProductId = products[1].Id, MinThreshold = 15, ReorderQuantity = 40, CreatedAt = DateTime.UtcNow },
                new LowStockThreshold { Id = Guid.NewGuid(), ProductId = products[2].Id, MinThreshold = 30, ReorderQuantity = 80, CreatedAt = DateTime.UtcNow },
                new LowStockThreshold { Id = Guid.NewGuid(), ProductId = products[3].Id, MinThreshold = 25, ReorderQuantity = 60, CreatedAt = DateTime.UtcNow },
                new LowStockThreshold { Id = Guid.NewGuid(), ProductId = products[4].Id, MinThreshold = 50, ReorderQuantity = 100, CreatedAt = DateTime.UtcNow }
            };

            await context.StockLevels.AddRangeAsync(stockLevels, ct);
            await context.LowStockThresholds.AddRangeAsync(thresholds, ct);
            await context.SaveChangesAsync(ct);
        }

        // ── 4. Customers with GPS coordinates ─────────────────────────────────
        if (!await context.Customers.AnyAsync(ct))
        {
            logger.LogInformation("Seeding initial customers...");

            var customers = new List<Customer>
            {
                new Customer
                {
                    Id = Guid.NewGuid(),
                    Name = "City Supermarket Colombo 03",
                    ContactPerson = "Sunil Perera",
                    Email = "colombo3@citysuper.lk",
                    Phone = "+94112345670",
                    Address = "142 Galle Road, Kollupitiya",
                    City = "Colombo",
                    Latitude = 6.9064,
                    Longitude = 79.8523,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Customer
                {
                    Id = Guid.NewGuid(),
                    Name = "Kandy Central Retailers",
                    ContactPerson = "Nimal Bandara",
                    Email = "orders@kandycentral.lk",
                    Phone = "+94812234567",
                    Address = "45 Dalada Veediya",
                    City = "Kandy",
                    Latitude = 7.2906,
                    Longitude = 80.6337,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Customer
                {
                    Id = Guid.NewGuid(),
                    Name = "Galle Fort Grocers",
                    ContactPerson = "Anura Silva",
                    Email = "gallefort@grocers.lk",
                    Phone = "+94912233445",
                    Address = "12 Church Street",
                    City = "Galle",
                    Latitude = 6.0270,
                    Longitude = 80.2170,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                }
            };

            await context.Customers.AddRangeAsync(customers, ct);
            await context.SaveChangesAsync(ct);
        }

        // ── 5. Field Visits & Device Captures ─────────────────────────────────
        if (!await context.CustomerVisits.AnyAsync(ct))
        {
            var agent = await context.FieldAgentProfiles.FirstOrDefaultAsync(ct);
            var customerList = await context.Customers.ToListAsync(ct);

            if (agent != null && customerList.Any())
            {
                logger.LogInformation("Seeding sample field visits and device captures...");

                var c1 = customerList[0];
                var c2 = customerList.Count > 1 ? customerList[1] : c1;

                var visit1 = new CustomerVisit
                {
                    Id = Guid.NewGuid(),
                    FieldAgentId = agent.Id,
                    CustomerId = c1.Id,
                    CustomerName = c1.Name,
                    Latitude = c1.Latitude ?? 6.9064,
                    Longitude = c1.Longitude ?? 79.8523,
                    AddressSnapshot = c1.Address,
                    VisitedAt = DateTime.UtcNow.AddHours(-4),
                    CheckOutAt = DateTime.UtcNow.AddHours(-3).AddMinutes(-15),
                    Notes = "Routine weekly shelf audit completed. Store requested replenishment for Ceylon Tea.",
                    CreatedAt = DateTime.UtcNow.AddHours(-4)
                };

                var visit2 = new CustomerVisit
                {
                    Id = Guid.NewGuid(),
                    FieldAgentId = agent.Id,
                    CustomerId = c2.Id,
                    CustomerName = c2.Name,
                    Latitude = c2.Latitude ?? 7.2906,
                    Longitude = c2.Longitude ?? 80.6337,
                    AddressSnapshot = c2.Address,
                    VisitedAt = DateTime.UtcNow.AddHours(-1),
                    CheckOutAt = DateTime.UtcNow.AddMinutes(-20),
                    Notes = "Stock verification & verified QR code of dairy products in cold storage.",
                    CreatedAt = DateTime.UtcNow.AddHours(-1)
                };

                await context.CustomerVisits.AddRangeAsync(new[] { visit1, visit2 }, ct);
                await context.SaveChangesAsync(ct);

                // Add device captures for audit
                var capture1 = new DeviceCapture
                {
                    Id = Guid.NewGuid(),
                    CustomerVisitId = visit1.Id,
                    CaptureType = "QRCodeScan",
                    QrCodeData = "BEV-TEA-001",
                    ProductSku = "BEV-TEA-001",
                    Latitude = visit1.Latitude,
                    Longitude = visit1.Longitude,
                    DeviceId = "Zebra-TC26-9481",
                    IsVerified = true,
                    CapturedAt = DateTime.UtcNow.AddHours(-3).AddMinutes(-40),
                    CreatedAt = DateTime.UtcNow.AddHours(-3).AddMinutes(-40)
                };

                var capture2 = new DeviceCapture
                {
                    Id = Guid.NewGuid(),
                    CustomerVisitId = visit2.Id,
                    CaptureType = "BarcodeScan",
                    BarcodeData = "479100200001",
                    ProductSku = "DAI-MLK-001",
                    Latitude = visit2.Latitude,
                    Longitude = visit2.Longitude,
                    DeviceId = "Zebra-TC26-9481",
                    IsVerified = true,
                    CapturedAt = DateTime.UtcNow.AddMinutes(-45),
                    CreatedAt = DateTime.UtcNow.AddMinutes(-45)
                };

                await context.DeviceCaptures.AddRangeAsync(new[] { capture1, capture2 }, ct);

                // Add sample offline sync queue
                var sync1 = new OfflineSyncQueue
                {
                    Id = Guid.NewGuid(),
                    FieldAgentId = agent.Id,
                    EntityType = "CustomerVisit",
                    Payload = $"{{\"customerId\":\"{c1.Id}\",\"notes\":\"Offline sync record #1042\"}}",
                    DeviceId = "Zebra-TC26-9481",
                    Status = "Synced",
                    SyncedAt = DateTime.UtcNow.AddHours(-3),
                    CreatedAt = DateTime.UtcNow.AddHours(-3).AddMinutes(-5)
                };

                await context.OfflineSyncQueues.AddAsync(sync1, ct);
                await context.SaveChangesAsync(ct);
            }
        }

        // ── 6. Ensure Multiple Realistic Field Officers for Supervisory View ─
        var defaultOfficer = await context.Users.FirstOrDefaultAsync(u => u.Username == "officer", ct);
        if (defaultOfficer != null && (defaultOfficer.FullName == "Field Sales Officer" || string.IsNullOrWhiteSpace(defaultOfficer.FullName)))
        {
            defaultOfficer.FullName = "Dinesh Rathnayake";
            defaultOfficer.PhoneNumber = "+94 77 345 6789";
            await context.SaveChangesAsync(ct);
        }

        if (await context.FieldAgentProfiles.CountAsync(ct) < 4)
        {
            logger.LogInformation("Seeding additional field sales officers for supervisory directory...");
            var extraOfficers = new[]
            {
                new { Code = "FA-002", Name = "Kasun Perera", Phone = "+94 77 123 4567", Email = "kasun.perera@stockflow.ai", Region = "Western Province (Colombo Central)", Vehicle = "WP-CAD-4589", Duty = true },
                new { Code = "FA-003", Name = "Priyantha Silva", Phone = "+94 77 890 1234", Email = "priyantha.silva@stockflow.ai", Region = "Central Province (Kandy & Matale)", Vehicle = "CP-CAB-7821", Duty = true },
                new { Code = "FA-004", Name = "Nuwan Fernando", Phone = "+94 77 567 8901", Email = "nuwan.fernando@stockflow.ai", Region = "Southern Province (Galle & Matara)", Vehicle = "SP-CAA-3342", Duty = false }
            };

            foreach (var eo in extraOfficers)
            {
                if (!await context.FieldAgentProfiles.AnyAsync(f => f.EmployeeCode == eo.Code, ct))
                {
                    var user = new ApplicationUser
                    {
                        Id = Guid.NewGuid(),
                        Username = eo.Code.ToLower().Replace("-", ""),
                        Email = eo.Email,
                        FullName = eo.Name,
                        PhoneNumber = eo.Phone,
                        Role = UserRole.FieldSales,
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword("Officer@123"),
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    };
                    await context.Users.AddAsync(user, ct);

                    var profile = new FieldAgentProfile
                    {
                        Id = Guid.NewGuid(),
                        UserId = user.Id,
                        EmployeeCode = eo.Code,
                        Region = eo.Region,
                        VehicleNumber = eo.Vehicle,
                        IsOnDuty = eo.Duty,
                        LastActiveAt = DateTime.UtcNow.AddMinutes(-new Random().Next(15, 280)),
                        CreatedAt = DateTime.UtcNow
                    };
                    await context.FieldAgentProfiles.AddAsync(profile, ct);
                }
            }
            await context.SaveChangesAsync(ct);
        }

        logger.LogInformation("StockFlowDB seeding completed successfully.");
    }
}
