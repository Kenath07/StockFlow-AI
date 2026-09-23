import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/date_formatter.dart';
import '../../../shared/widgets/custom_button.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/status_badge.dart';
import '../providers/sync_provider.dart';

class SyncQueueScreen extends ConsumerWidget {
  const SyncQueueScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(syncProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Offline Sync Queue'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.read(syncProvider.notifier).loadQueue(),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkSurface : Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isDark ? AppColors.darkBorder : AppColors.paperBorder,
                  width: 1.5,
                ),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Icon(
                            state.isOnline
                                ? Icons.cloud_done_rounded
                                : Icons.cloud_off_rounded,
                            color: state.isOnline
                                ? AppColors.success
                                : AppColors.warning,
                            size: 24,
                          ),
                          const SizedBox(width: 10),
                          Text(
                            state.isOnline
                                ? 'Connected to Backend'
                                : 'Offline Mode (Local SQLite)',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: isDark
                                  ? Colors.white
                                  : AppColors.neutralDark,
                            ),
                          ),
                        ],
                      ),
                      Container(
                        width: 10,
                        height: 10,
                        decoration: BoxDecoration(
                          color: state.isOnline
                              ? AppColors.success
                              : AppColors.warning,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Divider(),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildMiniStat(
                        'Pending Orders',
                        '${state.pendingOrdersCount}',
                        AppColors.primary,
                      ),
                      Container(
                          width: 1, height: 36, color: AppColors.paperBorder),
                      _buildMiniStat(
                        'Pending Visits',
                        '${state.pendingVisitsCount}',
                        AppColors.info,
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Sync Button
            CustomButton(
              text: state.isSyncing
                  ? 'Synchronizing Queue...'
                  : 'Sync Now (${state.totalPending} Pending)',
              isLoading: state.isSyncing,
              icon: Icons.sync_rounded,
              onPressed: state.totalPending == 0 && !state.isSyncing
                  ? () => ref.read(syncProvider.notifier).loadQueue()
                  : () => ref.read(syncProvider.notifier).syncNow(),
            ),
            if (state.lastSyncMessage != null) ...[
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFFFEDD5)),
                ),
                child: Text(
                  state.lastSyncMessage!,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.primary,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ],
            const SizedBox(height: 24),

            // Queued Items List
            const Text(
              'QUEUED OFFLINE TRANSACTIONS',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                color: AppColors.neutralMuted,
                letterSpacing: 0.8,
              ),
            ),
            const SizedBox(height: 12),

            if (state.queuedItems.isEmpty)
              const EmptyStateWidget(
                icon: Icons.done_all_rounded,
                title: 'All Caught Up!',
                message:
                    'Zero transactions pending synchronization. All local orders and customer visits are safely stored in PostgreSQL.',
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: state.queuedItems.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final item = state.queuedItems[index];
                  final isOrder = item['type'] == 'Order';

                  return Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.darkSurface : Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: isDark
                            ? AppColors.darkBorder
                            : AppColors.paperBorder,
                      ),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: isOrder
                                ? AppColors.primaryLight
                                : AppColors.infoLight,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(
                            isOrder
                                ? Icons.shopping_bag_outlined
                                : Icons.location_on_outlined,
                            color:
                                isOrder ? AppColors.primary : AppColors.info,
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item['title'] ?? '',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  color: isDark
                                      ? Colors.white
                                      : AppColors.neutralDark,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '${item['detail']} • ${DateFormatter.formatIsoString(item['createdAt'])}',
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: AppColors.neutralMuted,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const StatusBadge(status: 'PendingSync', isSmall: true),
                      ],
                    ),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildMiniStat(String label, String count, Color color) {
    return Column(
      children: [
        Text(
          count,
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w900,
            color: color,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: AppColors.neutralMuted,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}
