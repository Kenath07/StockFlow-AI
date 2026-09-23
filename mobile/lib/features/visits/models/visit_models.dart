class CustomerVisitModel {
  final String id;
  final String agentId;
  final String? agentName;
  final String customerId;
  final String customerName;
  final double latitude;
  final double longitude;
  final DateTime visitedAt;
  final DateTime? checkOutAt;
  final String? notes;
  final String? salesOrderId;
  final int captureCount;
  final bool isOffline;

  CustomerVisitModel({
    required this.id,
    required this.agentId,
    this.agentName,
    required this.customerId,
    required this.customerName,
    required this.latitude,
    required this.longitude,
    required this.visitedAt,
    this.checkOutAt,
    this.notes,
    this.salesOrderId,
    this.captureCount = 0,
    this.isOffline = false,
  });

  bool get isCompleted => checkOutAt != null;

  factory CustomerVisitModel.fromJson(Map<String, dynamic> json) {
    return CustomerVisitModel(
      id: json['id']?.toString() ?? '',
      agentId: json['fieldAgentId']?.toString() ?? json['agentId']?.toString() ?? '',
      agentName: json['fieldAgentName'] ?? json['agentName'] ?? 'Field Officer',
      customerId: json['customerId']?.toString() ?? '',
      customerName: json['customerName'] ?? 'Customer Visit',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0.0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0.0,
      visitedAt: json['visitedAt'] != null
          ? DateTime.tryParse(json['visitedAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      checkOutAt: json['checkOutAt'] != null
          ? DateTime.tryParse(json['checkOutAt'].toString())
          : null,
      notes: json['notes'],
      salesOrderId: json['salesOrderId']?.toString(),
      captureCount: json['captureCount'] ?? 0,
      isOffline: false,
    );
  }
}
