import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/storage/local_database.dart';
import '../models/order_models.dart';

class OrdersState {
  final bool isLoading;
  final List<SalesOrderModel> orders;
  final List<CustomerModel> customers;
  final String selectedStatus;
  final String searchQuery;
  final String? errorMessage;
  final int pendingSyncCount;

  const OrdersState({
    this.isLoading = false,
    this.orders = const [],
    this.customers = const [],
    this.selectedStatus = 'All',
    this.searchQuery = '',
    this.errorMessage,
    this.pendingSyncCount = 0,
  });

  List<SalesOrderModel> get filteredOrders {
    return orders.where((o) {
      final matchesStatus = selectedStatus == 'All' ||
          (o.status.toLowerCase() == selectedStatus.toLowerCase());
      final matchesSearch = searchQuery.isEmpty ||
          o.orderNumber.toLowerCase().contains(searchQuery.toLowerCase()) ||
          o.customerName.toLowerCase().contains(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    }).toList();
  }

  double get todaySalesTotal {
    final now = DateTime.now();
    return orders
        .where((o) =>
            o.orderDate.year == now.year &&
            o.orderDate.month == now.month &&
            o.orderDate.day == now.day)
        .fold(0.0, (sum, o) => sum + o.totalAmount);
  }

  int get todayOrdersCount {
    final now = DateTime.now();
    return orders
        .where((o) =>
            o.orderDate.year == now.year &&
            o.orderDate.month == now.month &&
            o.orderDate.day == now.day)
        .length;
  }

  OrdersState copyWith({
    bool? isLoading,
    List<SalesOrderModel>? orders,
    List<CustomerModel>? customers,
    String? selectedStatus,
    String? searchQuery,
    String? errorMessage,
    int? pendingSyncCount,
  }) {
    return OrdersState(
      isLoading: isLoading ?? this.isLoading,
      orders: orders ?? this.orders,
      customers: customers ?? this.customers,
      selectedStatus: selectedStatus ?? this.selectedStatus,
      searchQuery: searchQuery ?? this.searchQuery,
      errorMessage: errorMessage,
      pendingSyncCount: pendingSyncCount ?? this.pendingSyncCount,
    );
  }
}

class OrdersNotifier extends StateNotifier<OrdersState> {
  OrdersNotifier() : super(const OrdersState()) {
    fetchCustomers();
    fetchOrders();
  }

  Future<void> fetchCustomers() async {
    try {
      final response = await ApiClient.get(ApiEndpoints.customers);
      if (response.statusCode == 200 && response.data != null) {
        final List list = response.data is List ? response.data : [];
        final customers =
            list.map((c) => CustomerModel.fromJson(c)).toList();

        // Cache to SQLite
        final rawList = list.cast<Map<String, dynamic>>();
        await LocalDatabase.cacheCustomers(rawList);

        state = state.copyWith(customers: customers);
        return;
      }
    } catch (e) {
      // Fallback: Read from SQLite
      final cached = await LocalDatabase.getCachedCustomers();
      if (cached.isNotEmpty) {
        final customers =
            cached.map((c) => CustomerModel.fromSqlite(c)).toList();
        state = state.copyWith(customers: customers);
        return;
      }

      // Default mock customers for offline demo
      final mock = [
        CustomerModel(
          id: 'c1000000-0000-0000-0000-000000000001',
          name: 'City Supermarket Colombo 03',
          contactPerson: 'Sunil Weerasinghe',
          phone: '+94 77 123 4567',
          address: '45 Galle Road, Colombo 03',
          city: 'Colombo',
          latitude: 6.9056,
          longitude: 79.8519,
        ),
        CustomerModel(
          id: 'c1000000-0000-0000-0000-000000000002',
          name: 'Kandy Fresh Grocery Store',
          contactPerson: 'Ravi Fernando',
          phone: '+94 71 987 6543',
          address: '12 Temple Street, Kandy',
          city: 'Kandy',
          latitude: 7.2906,
          longitude: 80.6337,
        ),
        CustomerModel(
          id: 'c1000000-0000-0000-0000-000000000003',
          name: 'Galle Coastal Retailers',
          contactPerson: 'Anura De Silva',
          phone: '+94 76 555 1234',
          address: '88 Matara Road, Galle',
          city: 'Galle',
          latitude: 6.0535,
          longitude: 80.2210,
        ),
      ];
      state = state.copyWith(customers: mock);
    }
  }

  Future<void> fetchOrders() async {
    state = state.copyWith(isLoading: true, errorMessage: null);

    List<SalesOrderModel> combinedOrders = [];

    // 1. Read offline queued orders from SQLite
    final offlineRows = await LocalDatabase.getAllOfflineOrders();
    final pendingCount =
        offlineRows.where((r) => r['sync_status'] == 'PendingSync').length;

    for (final row in offlineRows) {
      try {
        final rawLines = jsonDecode(row['lines_json'] as String) as List;
        final lines =
            rawLines.map((l) => OrderLineModel.fromJson(l)).toList();

        combinedOrders.add(
          SalesOrderModel(
            id: row['local_id'],
            orderNumber: 'OFFLINE-${row['local_id'].toString().substring(0, 6).toUpperCase()}',
            customerId: row['customer_id'],
            customerName: row['customer_name'],
            status: row['sync_status'] == 'PendingSync' ? 'PendingSync' : 'Confirmed',
            totalAmount: (row['total_amount'] as num).toDouble(),
            notes: row['notes'],
            deliveryAddress: row['delivery_address'],
            orderDate: DateTime.parse(row['created_at']),
            latitude: (row['latitude'] as num?)?.toDouble(),
            longitude: (row['longitude'] as num?)?.toDouble(),
            lines: lines,
            isOffline: true,
          ),
        );
      } catch (_) {}
    }

    // 2. Fetch server orders from API
    try {
      final response = await ApiClient.get(ApiEndpoints.orders);
      if (response.statusCode == 200 && response.data != null) {
        final List list = response.data is List ? response.data : [];
        final serverOrders =
            list.map((o) => SalesOrderModel.fromJson(o)).toList();
        combinedOrders.addAll(serverOrders);
      }
    } catch (_) {
      if (combinedOrders.isEmpty) {
        // Add sample orders for demo
        combinedOrders.add(
          SalesOrderModel(
            id: 'ord-001',
            orderNumber: 'ORD-202609-001',
            customerId: 'c1000000-0000-0000-0000-000000000001',
            customerName: 'City Supermarket Colombo 03',
            status: 'Confirmed',
            totalAmount: 18500.0,
            orderDate: DateTime.now().subtract(const Duration(hours: 2)),
            lines: [
              OrderLineModel(
                productId: 'p1',
                productName: 'Ceylon Black Tea 500g',
                productSku: 'BEV-001',
                quantity: 10,
                unitPrice: 850.0,
              ),
              OrderLineModel(
                productId: 'p3',
                productName: 'Nipuna White Rice 5kg',
                productSku: 'STP-003',
                quantity: 8,
                unitPrice: 1250.0,
              ),
            ],
          ),
        );
      }
    }

    state = state.copyWith(
      isLoading: false,
      orders: combinedOrders,
      pendingSyncCount: pendingCount,
    );
  }

  Future<bool> createOrder({
    required CustomerModel customer,
    required List<OrderLineModel> lines,
    String? notes,
    String? deliveryAddress,
    double? latitude,
    double? longitude,
  }) async {
    final totalAmount = lines.fold(0.0, (sum, l) => sum + l.totalPrice);
    final localId = const Uuid().v4();

    final orderPayload = {
      'customerId': customer.id,
      'notes': notes,
      'deliveryAddress': deliveryAddress ?? customer.address,
      'latitude': latitude,
      'longitude': longitude,
      'lines': lines
          .map((l) => {
                'productId': l.productId,
                'quantity': l.quantity,
                'unitPrice': l.unitPrice,
              })
          .toList(),
    };

    // Attempt online creation
    try {
      final response = await ApiClient.post(
        ApiEndpoints.orders,
        data: orderPayload,
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        await fetchOrders();
        return true;
      }
    } catch (_) {}

    // Offline Resilience: Save to SQLite Queue
    final sqliteOrder = {
      'local_id': localId,
      'customer_id': customer.id,
      'customer_name': customer.name,
      'lines_json': jsonEncode(lines.map((l) => l.toJson()).toList()),
      'total_amount': totalAmount,
      'notes': notes,
      'delivery_address': deliveryAddress ?? customer.address,
      'latitude': latitude,
      'longitude': longitude,
      'created_at': DateTime.now().toIso8601String(),
      'sync_status': 'PendingSync',
      'error_message': null,
    };

    await LocalDatabase.insertOfflineOrder(sqliteOrder);
    await fetchOrders();
    return true;
  }

  Future<bool> updateOrderStatus(String orderId, String newStatus, {String? reason}) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final response = await ApiClient.put(
        ApiEndpoints.updateOrderStatus(orderId),
        data: {
          'newStatus': newStatus,
          'reason': reason ?? 'Status updated by storekeeper via mobile',
        },
      );
      if (response.statusCode == 200 || response.statusCode == 204) {
        await fetchOrders();
        return true;
      }
      state = state.copyWith(
          isLoading: false, errorMessage: 'Failed to update order status.');
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
      return false;
    }
  }

  Future<bool> cancelOrder(String orderId, String reason) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final response = await ApiClient.post(
        ApiEndpoints.cancelOrder(orderId),
        data: {
          'status': 'Cancelled',
          'reason': reason,
        },
      );
      if (response.statusCode == 200 || response.statusCode == 204) {
        await fetchOrders();
        return true;
      }
      state = state.copyWith(
          isLoading: false, errorMessage: 'Failed to cancel order.');
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
      return false;
    }
  }

  void setStatusFilter(String status) {
    state = state.copyWith(selectedStatus: status);
  }

  void setSearchQuery(String query) {
    state = state.copyWith(searchQuery: query);
  }
}

final ordersProvider =
    StateNotifierProvider<OrdersNotifier, OrdersState>((ref) {
  return OrdersNotifier();
});
