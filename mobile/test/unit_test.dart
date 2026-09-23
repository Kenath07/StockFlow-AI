import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/utils/currency_formatter.dart';
import 'package:mobile/core/utils/date_formatter.dart';
import 'package:mobile/features/products/models/product_model.dart';
import 'package:mobile/features/orders/models/order_models.dart';
import 'package:mobile/features/visits/models/visit_models.dart';
import 'package:mobile/features/auth/models/user_session.dart';

void main() {
  group('Utils & Formatters Unit Tests', () {
    test('CurrencyFormatter formats numbers into LKR format', () {
      expect(CurrencyFormatter.format(1500.00), 'Rs. 1,500.00');
      expect(CurrencyFormatter.format(0), 'Rs. 0.00');
      expect(CurrencyFormatter.format(250000.50), 'Rs. 250,000.50');
    });

    test('DateFormatter formats DateTime objects correctly', () {
      final date = DateTime(2026, 9, 19, 14, 30);
      final formatted = DateFormatter.formatDateTime(date);
      expect(formatted, isNotEmpty);
      expect(formatted.contains('2026') || formatted.contains('Sep'), isTrue);
    });
  });

  group('Domain Models Serialization & Deserialization', () {
    test('ProductModel JSON roundtrip with barcode and stock', () {
      final json = {
        'id': 'prod-001',
        'sku': 'BEV-001',
        'name': 'Organic Green Tea 100g',
        'description': 'Premium organic tea',
        'unitPrice': 450.0,
        'costPrice': 320.0,
        'categoryId': 'cat-1',
        'categoryName': 'Beverages',
        'quantityOnHand': 120,
        'quantityAvailable': 110,
        'barcode': '4790001001001',
      };

      final product = ProductModel.fromJson(json);
      expect(product.id, 'prod-001');
      expect(product.sku, 'BEV-001');
      expect(product.name, 'Organic Green Tea 100g');
      expect(product.unitPrice, 450.0);
      expect(product.quantityOnHand, 120);
      expect(product.barcode, '4790001001001');

      final serialized = product.toJson();
      expect(serialized['sku'], 'BEV-001');
      expect(serialized['barcode'], '4790001001001');
    });

    test('CustomerModel JSON roundtrip with GPS coordinates', () {
      final json = {
        'id': 'cust-001',
        'name': 'Colombo Central Supermarket',
        'contactPerson': 'Sunil Perera',
        'email': 'sunil@supermarket.lk',
        'phone': '0112345678',
        'address': '123 Galle Road, Colombo 03',
        'city': 'Colombo',
        'latitude': 6.9271,
        'longitude': 79.8612,
        'isActive': true,
      };

      final customer = CustomerModel.fromJson(json);
      expect(customer.id, 'cust-001');
      expect(customer.name, 'Colombo Central Supermarket');
      expect(customer.latitude, 6.9271);
      expect(customer.longitude, 79.8612);
      expect(customer.isActive, isTrue);
    });

    test('OrderLineModel calculates line total correctly', () {
      final line = OrderLineModel(
        productId: 'prod-001',
        productName: 'Organic Green Tea',
        productSku: 'BEV-001',
        quantity: 5,
        unitPrice: 450.0,
      );

      expect(line.totalPrice, 2250.0);
      final json = line.toJson();
      expect(json['quantity'], 5);
      expect(json['unitPrice'], 450.0);
    });

    test('CustomerVisitModel JSON serialization', () {
      final visit = CustomerVisitModel(
        id: 'vis-001',
        agentId: 'user-001',
        agentName: 'Kamal Silva',
        customerId: 'cust-001',
        customerName: 'Colombo Central Supermarket',
        latitude: 6.9271,
        longitude: 79.8612,
        notes: 'Regular restock visit completed',
        visitedAt: DateTime(2026, 9, 19, 10, 0),
        checkOutAt: DateTime(2026, 9, 19, 10, 45),
        isOffline: false,
      );

      expect(visit.customerName, 'Colombo Central Supermarket');
      expect(visit.latitude, 6.9271);
      expect(visit.notes, 'Regular restock visit completed');
    });

    test('UserSession handles role and permissions', () {
      final session = UserSession(
        token: 'mock-jwt-token',
        username: 'kamal_sales',
        fullName: 'Kamal Field Officer',
        role: 'FieldSales',
        expiresAt: DateTime.now().add(const Duration(hours: 8)),
      );

      expect(session.isFieldSales, isTrue);
      expect(session.fullName, 'Kamal Field Officer');
    });
  });
}
