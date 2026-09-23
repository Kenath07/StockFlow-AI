class ApiEndpoints {
  // Auth
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String me = '/auth/me';

  // Products & Categories
  static const String products = '/products';
  static const String productSearch = '/products/search';
  static const String productCategories = '/products/categories';
  static String productBySku(String sku) => '/products/sku/$sku';
  static String productByBarcode(String barcode) => '/products/barcode/$barcode';
  static String productById(String id) => '/products/$id';
  static String stockMovements(String productId) => '/stock/movements?productId=$productId';

  // Orders
  static const String orders = '/orders';
  static String orderById(String id) => '/orders/$id';
  static String updateOrderStatus(String id) => '/orders/$id/status';
  static String cancelOrder(String id) => '/orders/$id/cancel';

  // Field Operations
  static const String myProfile = '/field/my-profile';
  static const String fieldAgents = '/field/agents';
  static const String customerVisits = '/field/visits';
  static String agentVisits(String agentId) => '/field/visits/$agentId';
  static String createVisit(String agentId) => '/field/visits/$agentId';
  static String checkOutVisit(String visitId) => '/field/visits/$visitId/checkout';
  static const String recordCapture = '/field/captures';
  static String stockCheck(String productId) => '/field/stock-check/$productId';
  static String offlineSync(String agentId) => '/field/sync/$agentId';
  static String syncStatus(String agentId) => '/field/sync/$agentId/status';

  // Customers
  static const String customers = '/customers';
  static String customerById(String id) => '/customers/$id';

  // Notifications
  static const String notificationSms = '/notification/sms';
  static const String notificationEmail = '/notification/email';
  static const String notifications = '/notification';
  static String markNotificationRead(String id) => '/notification/$id/read';
  static const String markAllNotificationsRead = '/notification/read-all';
}
