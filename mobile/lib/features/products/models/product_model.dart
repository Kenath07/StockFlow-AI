class ProductModel {
  final String id;
  final String sku;
  final String name;
  final String? description;
  final double unitPrice;
  final double costPrice;
  final String? categoryId;
  final String? categoryName;
  final int quantityOnHand;
  final int quantityAvailable;
  final String? barcode;
  final bool isActive;
  final String? warehouseLocation;

  ProductModel({
    required this.id,
    required this.sku,
    required this.name,
    this.description,
    required this.unitPrice,
    required this.costPrice,
    this.categoryId,
    this.categoryName,
    this.quantityOnHand = 0,
    this.quantityAvailable = 0,
    this.barcode,
    this.isActive = true,
    this.warehouseLocation,
  });

  bool get isLowStock => quantityAvailable <= 10;
  bool get isOutOfStock => quantityAvailable <= 0;

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    return ProductModel(
      id: json['id']?.toString() ?? '',
      sku: json['sku'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      unitPrice: (json['unitPrice'] as num?)?.toDouble() ?? 0.0,
      costPrice: (json['costPrice'] as num?)?.toDouble() ?? 0.0,
      categoryId: json['categoryId']?.toString(),
      categoryName: json['categoryName'] ?? 'General',
      quantityOnHand: json['quantityOnHand'] ?? 0,
      quantityAvailable: json['quantityAvailable'] ?? 0,
      barcode: json['barcode'],
      isActive: json['isActive'] ?? true,
      warehouseLocation: json['warehouseLocation'],
    );
  }

  factory ProductModel.fromSqlite(Map<String, dynamic> map) {
    return ProductModel(
      id: map['id'] ?? '',
      sku: map['sku'] ?? '',
      name: map['name'] ?? '',
      description: map['description'],
      unitPrice: (map['unit_price'] as num?)?.toDouble() ?? 0.0,
      costPrice: (map['cost_price'] as num?)?.toDouble() ?? 0.0,
      categoryId: map['category_id'],
      categoryName: map['category_name'] ?? 'General',
      quantityOnHand: map['quantity_on_hand'] ?? 0,
      quantityAvailable: map['quantity_available'] ?? 0,
      barcode: map['barcode'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'sku': sku,
      'name': name,
      'description': description,
      'unitPrice': unitPrice,
      'costPrice': costPrice,
      'categoryId': categoryId,
      'categoryName': categoryName,
      'quantityOnHand': quantityOnHand,
      'quantityAvailable': quantityAvailable,
      'barcode': barcode,
      'isActive': isActive,
      'warehouseLocation': warehouseLocation,
    };
  }
}
