class CustomerModel {
  final String id;
  final String name;
  final String? contactPerson;
  final String? email;
  final String? phone;
  final String? address;
  final String? city;
  final double? latitude;
  final double? longitude;
  final bool isActive;

  CustomerModel({
    required this.id,
    required this.name,
    this.contactPerson,
    this.email,
    this.phone,
    this.address,
    this.city,
    this.latitude,
    this.longitude,
    this.isActive = true,
  });

  factory CustomerModel.fromJson(Map<String, dynamic> json) {
    return CustomerModel(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      contactPerson: json['contactPerson'],
      email: json['email'],
      phone: json['phone'],
      address: json['address'],
      city: json['city'],
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      isActive: json['isActive'] ?? true,
    );
  }

  factory CustomerModel.fromSqlite(Map<String, dynamic> map) {
    return CustomerModel(
      id: map['id'] ?? '',
      name: map['name'] ?? '',
      contactPerson: map['contact_person'],
      email: map['email'],
      phone: map['phone'],
      address: map['address'],
      city: map['city'],
      latitude: (map['latitude'] as num?)?.toDouble(),
      longitude: (map['longitude'] as num?)?.toDouble(),
      isActive: (map['is_active'] != 0),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'contactPerson': contactPerson,
      'email': email,
      'phone': phone,
      'address': address,
      'city': city,
      'latitude': latitude,
      'longitude': longitude,
      'isActive': isActive,
    };
  }
}

class OrderLineModel {
  final String productId;
  final String productName;
  final String productSku;
  int quantity;
  final double unitPrice;

  OrderLineModel({
    required this.productId,
    required this.productName,
    required this.productSku,
    required this.quantity,
    required this.unitPrice,
  });

  double get totalPrice => quantity * unitPrice;

  factory OrderLineModel.fromJson(Map<String, dynamic> json) {
    return OrderLineModel(
      productId: json['productId']?.toString() ?? '',
      productName: json['productName'] ?? '',
      productSku: json['productSku'] ?? '',
      quantity: json['quantity'] ?? 1,
      unitPrice: (json['unitPrice'] as num?)?.toDouble() ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'productId': productId,
      'productName': productName,
      'productSku': productSku,
      'quantity': quantity,
      'unitPrice': unitPrice,
      'totalPrice': totalPrice,
    };
  }
}

class SalesOrderModel {
  final String id;
  final String orderNumber;
  final String customerId;
  final String customerName;
  final String status; // Pending | Confirmed | Dispatched | Fulfilled | Cancelled
  final double totalAmount;
  final String? notes;
  final String? deliveryAddress;
  final DateTime orderDate;
  final double? latitude;
  final double? longitude;
  final List<OrderLineModel> lines;
  final bool isOffline;

  SalesOrderModel({
    required this.id,
    required this.orderNumber,
    required this.customerId,
    required this.customerName,
    required this.status,
    required this.totalAmount,
    this.notes,
    this.deliveryAddress,
    required this.orderDate,
    this.latitude,
    this.longitude,
    required this.lines,
    this.isOffline = false,
  });

  factory SalesOrderModel.fromJson(Map<String, dynamic> json) {
    final rawLines = json['lines'] as List? ?? [];
    final lines = rawLines.map((l) => OrderLineModel.fromJson(l)).toList();

    return SalesOrderModel(
      id: json['id']?.toString() ?? '',
      orderNumber: json['orderNumber'] ?? 'ORD-000',
      customerId: json['customerId']?.toString() ?? '',
      customerName: json['customerName'] ?? 'Retail Customer',
      status: json['status'] ?? 'Pending',
      totalAmount: (json['totalAmount'] as num?)?.toDouble() ?? 0.0,
      notes: json['notes'],
      deliveryAddress: json['deliveryAddress'],
      orderDate: json['orderDate'] != null
          ? DateTime.tryParse(json['orderDate'].toString()) ?? DateTime.now()
          : DateTime.now(),
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      lines: lines,
      isOffline: false,
    );
  }
}
