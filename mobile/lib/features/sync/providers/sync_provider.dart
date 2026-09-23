import 'dart:convert';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/storage/local_database.dart';
import '../../../core/storage/secure_vault.dart';

class SyncState {
  final bool isSyncing;
  final bool isOnline;
  final int pendingOrdersCount;
  final int pendingVisitsCount;
  final List<Map<String, dynamic>> queuedItems;
  final String? lastSyncMessage;
  final DateTime? lastSyncedAt;

  const SyncState({
    this.isSyncing = false,
    this.isOnline = true,
    this.pendingOrdersCount = 0,
    this.pendingVisitsCount = 0,
    this.queuedItems = const [],
    this.lastSyncMessage,
    this.lastSyncedAt,
  });

  int get totalPending => pendingOrdersCount + pendingVisitsCount;

  SyncState copyWith({
    bool? isSyncing,
    bool? isOnline,
    int? pendingOrdersCount,
    int? pendingVisitsCount,
    List<Map<String, dynamic>>? queuedItems,
    String? lastSyncMessage,
    DateTime? lastSyncedAt,
  }) {
    return SyncState(
      isSyncing: isSyncing ?? this.isSyncing,
      isOnline: isOnline ?? this.isOnline,
      pendingOrdersCount: pendingOrdersCount ?? this.pendingOrdersCount,
      pendingVisitsCount: pendingVisitsCount ?? this.pendingVisitsCount,
      queuedItems: queuedItems ?? this.queuedItems,
      lastSyncMessage: lastSyncMessage,
      lastSyncedAt: lastSyncedAt ?? this.lastSyncedAt,
    );
  }
}

class SyncNotifier extends StateNotifier<SyncState> {
  SyncNotifier() : super(const SyncState()) {
    _initConnectivity();
    loadQueue();
  }

  void _initConnectivity() {
    Connectivity().onConnectivityChanged.listen((results) {
      final isConnected = results.isNotEmpty &&
          !results.contains(ConnectivityResult.none);
      state = state.copyWith(isOnline: isConnected);
      if (isConnected && state.totalPending > 0) {
        syncNow();
      }
    });
  }

  Future<void> loadQueue() async {
    final pendingOrders = await LocalDatabase.getPendingOrders();
    final pendingVisits = await LocalDatabase.getPendingVisits();

    List<Map<String, dynamic>> items = [];

    for (final o in pendingOrders) {
      items.add({
        'type': 'Order',
        'id': o['local_id'],
        'title': 'Sales Order: ${o['customer_name']}',
        'detail': 'Rs. ${o['total_amount']}',
        'createdAt': o['created_at'],
        'status': o['sync_status'],
      });
    }

    for (final v in pendingVisits) {
      items.add({
        'type': 'Visit',
        'id': v['local_id'],
        'title': 'Customer Visit: ${v['customer_name']}',
        'detail': 'GPS Check-in',
        'createdAt': v['visited_at'],
        'status': v['sync_status'],
      });
    }

    state = state.copyWith(
      pendingOrdersCount: pendingOrders.length,
      pendingVisitsCount: pendingVisits.length,
      queuedItems: items,
    );
  }

  Future<bool> syncNow() async {
    if (state.isSyncing) return false;
    state = state.copyWith(isSyncing: true, lastSyncMessage: 'Synchronizing offline queue with server...');

    int syncedCount = 0;

    // 1. Sync Pending Orders
    final pendingOrders = await LocalDatabase.getPendingOrders();
    for (final o in pendingOrders) {
      try {
        final lines = jsonDecode(o['lines_json'] as String) as List;
        final payload = {
          'customerId': o['customer_id'],
          'notes': o['notes'],
          'deliveryAddress': o['delivery_address'],
          'latitude': o['latitude'],
          'longitude': o['longitude'],
          'lines': lines
              .map((l) => {
                    'productId': l['productId'],
                    'quantity': l['quantity'],
                    'unitPrice': l['unitPrice'],
                  })
              .toList(),
        };

        final res = await ApiClient.post(ApiEndpoints.orders, data: payload);
        if (res.statusCode == 200 || res.statusCode == 201) {
          await LocalDatabase.updateOrderStatus(o['local_id'], 'Synced');
          syncedCount++;
        }
      } catch (e) {
        await LocalDatabase.updateOrderStatus(o['local_id'], 'PendingSync',
            errorMessage: e.toString());
      }
    }

    // 2. Sync Pending Visits
    final pendingVisits = await LocalDatabase.getPendingVisits();
    var user = await SecureVault.getUserSession();
    var agentId = user?.agentId;

    if (agentId == null || agentId == 'a1000000-0000-0000-0000-000000000001') {
      try {
        final profileRes = await ApiClient.get(ApiEndpoints.myProfile);
        if (profileRes.statusCode == 200 && profileRes.data != null) {
          final realId = profileRes.data['id']?.toString();
          if (realId != null) {
            agentId = realId;
            if (user != null) {
              user = user.copyWith(agentId: realId);
              await SecureVault.saveUserSession(user);
            }
          }
        }
      } catch (_) {}
    }

    agentId ??= 'a1000000-0000-0000-0000-000000000001';

    for (final v in pendingVisits) {
      try {
        final payload = {
          'customerId': v['customer_id'],
          'customerName': v['customer_name'],
          'latitude': v['latitude'],
          'longitude': v['longitude'],
          'addressSnapshot': v['address_snapshot'],
          'notes': v['notes'],
        };

        var res = await ApiClient.post(
          ApiEndpoints.createVisit(agentId),
          data: payload,
        );
        if (res.statusCode != 200 && res.statusCode != 201) {
          res = await ApiClient.post('/field/visits', data: payload);
        }

        if (res.statusCode == 200 || res.statusCode == 201) {
          await LocalDatabase.updateVisitStatus(v['local_id'], 'Synced');
          syncedCount++;
        }
      } catch (e) {
        await LocalDatabase.updateVisitStatus(v['local_id'], 'PendingSync',
            errorMessage: e.toString());
      }
    }

    await loadQueue();

    state = state.copyWith(
      isSyncing: false,
      lastSyncMessage: syncedCount > 0
          ? 'Successfully synced $syncedCount item(s) to PostgreSQL!'
          : 'All offline records are up to date.',
      lastSyncedAt: DateTime.now(),
    );

    return true;
  }
}

final syncProvider = StateNotifierProvider<SyncNotifier, SyncState>((ref) {
  return SyncNotifier();
});
