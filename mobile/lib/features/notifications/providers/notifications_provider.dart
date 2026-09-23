import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../models/notification_model.dart';

class NotificationsState {
  final List<NotificationModel> notifications;
  final bool isLoading;
  final String? errorMessage;

  const NotificationsState({
    this.notifications = const [],
    this.isLoading = false,
    this.errorMessage,
  });

  int get unreadCount => notifications.where((n) => !n.isRead).length;

  NotificationsState copyWith({
    List<NotificationModel>? notifications,
    bool? isLoading,
    String? errorMessage,
  }) {
    return NotificationsState(
      notifications: notifications ?? this.notifications,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}

class NotificationsNotifier extends StateNotifier<NotificationsState> {
  NotificationsNotifier() : super(const NotificationsState()) {
    fetchNotifications();
  }

  Future<void> fetchNotifications() async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final response = await ApiClient.get(ApiEndpoints.notifications);
      if (response.statusCode == 200) {
        final data = response.data as List;
        final items = data.map((json) => NotificationModel.fromJson(json)).toList();
        state = state.copyWith(isLoading: false, notifications: items);
      } else {
        state = state.copyWith(isLoading: false, errorMessage: 'Failed to fetch notifications');
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
    }
  }

  Future<void> markAsRead(String id) async {
    try {
      final response = await ApiClient.put(ApiEndpoints.markNotificationRead(id));
      if (response.statusCode == 204 || response.statusCode == 200) {
        final updated = state.notifications.map((n) {
          if (n.id == id) {
            n.isRead = true;
          }
          return n;
        }).toList();
        state = state.copyWith(notifications: updated);
      }
    } catch (e) {
      // Silently fail or handle error
    }
  }

  Future<void> markAllAsRead() async {
    try {
      final response = await ApiClient.put(ApiEndpoints.markAllNotificationsRead);
      if (response.statusCode == 204 || response.statusCode == 200) {
        final updated = state.notifications.map((n) {
          n.isRead = true;
          return n;
        }).toList();
        state = state.copyWith(notifications: updated);
      }
    } catch (e) {
      // Silently fail or handle error
    }
  }
}

final notificationsProvider =
    StateNotifierProvider<NotificationsNotifier, NotificationsState>((ref) {
  return NotificationsNotifier();
});
