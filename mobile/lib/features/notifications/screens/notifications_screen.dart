import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/date_formatter.dart';
import '../../../shared/widgets/empty_state.dart';
import '../providers/notifications_provider.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(notificationsProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (state.unreadCount > 0)
            TextButton(
              onPressed: () =>
                  ref.read(notificationsProvider.notifier).markAllAsRead(),
              child: const Text('Mark all read'),
            ),
        ],
      ),
      body: state.notifications.isEmpty
          ? const EmptyStateWidget(
              icon: Icons.notifications_none_rounded,
              title: 'No Notifications',
              message: 'You are all caught up! New order and stock alerts will appear here.',
            )
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: state.notifications.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final n = state.notifications[index];

                IconData icon;
                Color iconColor;
                Color iconBg;

                switch (n.type) {
                  case 'order':
                    icon = Icons.shopping_bag_outlined;
                    iconColor = AppColors.primary;
                    iconBg = AppColors.primaryLight;
                    break;
                  case 'stock':
                    icon = Icons.warning_amber_rounded;
                    iconColor = AppColors.warning;
                    iconBg = AppColors.warningLight;
                    break;
                  default:
                    icon = Icons.sync_rounded;
                    iconColor = AppColors.success;
                    iconBg = AppColors.successLight;
                }

                return InkWell(
                  onTap: () {
                    ref.read(notificationsProvider.notifier).markAsRead(n.id);
                  },
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: n.isRead
                          ? (isDark ? AppColors.darkSurface : Colors.white)
                          : (isDark ? AppColors.darkCard : const Color(0xFFFFF7ED)),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: n.isRead
                            ? (isDark ? AppColors.darkBorder : AppColors.paperBorder)
                            : AppColors.primary.withOpacity(0.4),
                        width: n.isRead ? 1 : 1.5,
                      ),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: iconBg,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(icon, color: iconColor, size: 20),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                n.title,
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: n.isRead
                                      ? FontWeight.w600
                                      : FontWeight.w800,
                                  color: isDark
                                      ? Colors.white
                                      : AppColors.neutralDark,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                n.message,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: isDark
                                      ? const Color(0xFF94A3B8)
                                      : AppColors.neutralMuted,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                DateFormatter.formatDateTime(n.createdAt),
                                style: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w500,
                                  color: AppColors.neutralMuted,
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (!n.isRead)
                          Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              color: AppColors.primary,
                              shape: BoxShape.circle,
                            ),
                          ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}
