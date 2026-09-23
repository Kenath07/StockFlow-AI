class NotificationModel {
  final String id;
  final String title;
  final String message;
  final String type; // order | stock | alert | sync
  final DateTime createdAt;
  bool isRead;

  NotificationModel({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    required this.createdAt,
    this.isRead = false,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id']?.toString() ?? '',
      title: json['title'] ?? 'StockFlow Alert',
      message: json['message'] ?? '',
      type: json['type'] ?? 'alert',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      isRead: json['isRead'] ?? false,
    );
  }
}
