class StockMovementModel {
  final String id;
  final String productId;
  final String type;
  final int quantity;
  final String? referenceNumber;
  final String? notes;
  final String? performedBy;
  final DateTime performedAt;

  StockMovementModel({
    required this.id,
    required this.productId,
    required this.type,
    required this.quantity,
    this.referenceNumber,
    this.notes,
    this.performedBy,
    required this.performedAt,
  });

  factory StockMovementModel.fromJson(Map<String, dynamic> json) {
    return StockMovementModel(
      id: json['id'] ?? '',
      productId: json['productId'] ?? '',
      type: _parseMovementType(json['type']),
      quantity: json['quantity'] ?? 0,
      referenceNumber: json['referenceNumber'],
      notes: json['notes'],
      performedBy: json['performedBy'],
      performedAt: json['performedAt'] != null 
          ? DateTime.parse(json['performedAt']) 
          : DateTime.now(),
    );
  }

  static String _parseMovementType(dynamic typeVal) {
    if (typeVal is int) {
      switch (typeVal) {
        case 0: return 'Sale';
        case 1: return 'Purchase';
        case 2: return 'Adjustment';
        case 3: return 'Return';
        case 4: return 'Transfer';
        default: return 'Unknown';
      }
    } else if (typeVal is String) {
      return typeVal;
    }
    return 'Unknown';
  }
}
