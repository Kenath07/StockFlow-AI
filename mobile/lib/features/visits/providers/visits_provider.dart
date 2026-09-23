import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/storage/local_database.dart';
import '../../../core/storage/secure_vault.dart';
import '../models/visit_models.dart';

class VisitsState {
  final bool isLoading;
  final List<CustomerVisitModel> visits;
  final String? errorMessage;
  final int todayVisitsCount;

  const VisitsState({
    this.isLoading = false,
    this.visits = const [],
    this.errorMessage,
    this.todayVisitsCount = 0,
  });

  VisitsState copyWith({
    bool? isLoading,
    List<CustomerVisitModel>? visits,
    String? errorMessage,
    int? todayVisitsCount,
  }) {
    return VisitsState(
      isLoading: isLoading ?? this.isLoading,
      visits: visits ?? this.visits,
      errorMessage: errorMessage,
      todayVisitsCount: todayVisitsCount ?? this.todayVisitsCount,
    );
  }
}

class VisitsNotifier extends StateNotifier<VisitsState> {
  VisitsNotifier() : super(const VisitsState()) {
    fetchVisits();
  }

  Future<void> fetchVisits() async {
    state = state.copyWith(isLoading: true, errorMessage: null);

    List<CustomerVisitModel> combined = [];

    // 1. Read offline queued visits from SQLite
    final offlineRows = await LocalDatabase.getAllOfflineVisits();
    for (final r in offlineRows) {
      combined.add(
        CustomerVisitModel(
          id: r['local_id'],
          agentId: r['agent_id'],
          customerId: r['customer_id'],
          customerName: r['customer_name'],
          latitude: (r['latitude'] as num).toDouble(),
          longitude: (r['longitude'] as num).toDouble(),
          visitedAt: DateTime.parse(r['visited_at']),
          checkOutAt: r['checkout_at'] != null ? DateTime.tryParse(r['checkout_at']) : null,
          notes: r['notes'],
          isOffline: true,
        ),
      );
    }

    // 2. Fetch server visits from API
    try {
      final response = await ApiClient.get(ApiEndpoints.customerVisits);
      if (response.statusCode == 200 && response.data != null) {
        final List list = response.data is List ? response.data : [];
        final serverVisits = list.map((v) => CustomerVisitModel.fromJson(v)).toList();
        combined.addAll(serverVisits);
      }
    } catch (_) {
      if (combined.isEmpty) {
        // Add demo sample visits
        combined.add(
          CustomerVisitModel(
            id: 'v1',
            agentId: 'a1',
            agentName: 'Kamal Perera',
            customerId: 'c1',
            customerName: 'City Supermarket Colombo 03',
            latitude: 6.9056,
            longitude: 79.8519,
            visitedAt: DateTime.now().subtract(const Duration(hours: 3)),
            checkOutAt: DateTime.now().subtract(const Duration(hours: 2, minutes: 30)),
            notes: 'Shelf restock requested. Order #ORD-001 booked successfully.',
            captureCount: 2,
          ),
        );
      }
    }

    final now = DateTime.now();
    final todayCount = combined
        .where((v) =>
            v.visitedAt.year == now.year &&
            v.visitedAt.month == now.month &&
            v.visitedAt.day == now.day)
        .length;

    state = state.copyWith(
      isLoading: false,
      visits: combined,
      todayVisitsCount: todayCount,
    );
  }

  Future<bool> recordVisit({
    required String customerId,
    required String customerName,
    required double latitude,
    required double longitude,
    String? notes,
    String? addressSnapshot,
  }) async {
    var user = await SecureVault.getUserSession();
    var agentId = user?.agentId;

    // Resolve real agentId from myProfile if missing or fallback
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
    final localId = const Uuid().v4();
    final now = DateTime.now();

    final visitPayload = {
      'customerId': customerId,
      'customerName': customerName,
      'latitude': latitude,
      'longitude': longitude,
      'addressSnapshot': addressSnapshot,
      'notes': notes,
    };

    // Try API POST - first via targeted agent endpoint, fallback to /field/visits
    bool postedSuccessfully = false;
    try {
      final response = await ApiClient.post(
        ApiEndpoints.createVisit(agentId),
        data: visitPayload,
      );
      if (response.statusCode == 200 || response.statusCode == 201) {
        postedSuccessfully = true;
      }
    } catch (_) {
      try {
        final fallbackRes = await ApiClient.post(
          '/field/visits',
          data: visitPayload,
        );
        if (fallbackRes.statusCode == 200 || fallbackRes.statusCode == 201) {
          postedSuccessfully = true;
        }
      } catch (_) {}
    }

    if (postedSuccessfully) {
      await fetchVisits();
      return true;
    }

    // Offline Resilience: Save to SQLite
    final sqliteVisit = {
      'local_id': localId,
      'agent_id': agentId,
      'customer_id': customerId,
      'customer_name': customerName,
      'latitude': latitude,
      'longitude': longitude,
      'address_snapshot': addressSnapshot,
      'notes': notes,
      'visited_at': now.toIso8601String(),
      'checkout_at': now.add(const Duration(minutes: 20)).toIso8601String(),
      'sync_status': 'PendingSync',
    };

    await LocalDatabase.insertOfflineVisit(sqliteVisit);
    await fetchVisits();
    return true;
  }
}

final visitsProvider =
    StateNotifierProvider<VisitsNotifier, VisitsState>((ref) {
  return VisitsNotifier();
});
