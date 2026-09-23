import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/date_formatter.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/status_badge.dart';
import '../providers/visits_provider.dart';

class VisitHistoryScreen extends ConsumerWidget {
  const VisitHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(visitsProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Visit History Diary'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.read(visitsProvider.notifier).fetchVisits(),
          ),
        ],
      ),
      body: state.isLoading && state.visits.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : state.visits.isEmpty
              ? const EmptyStateWidget(
                  icon: Icons.history_toggle_off,
                  title: 'No Visit Logs Yet',
                  message:
                      'Customer check-ins and GPS logs will appear in this history diary.',
                )
              : RefreshIndicator(
                  onRefresh: () =>
                      ref.read(visitsProvider.notifier).fetchVisits(),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: state.visits.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final visit = state.visits[index];

                      return Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: isDark ? AppColors.darkSurface : Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: isDark
                                ? AppColors.darkBorder
                                : AppColors.paperBorder,
                            width: 1,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black
                                  .withOpacity(isDark ? 0.2 : 0.02),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  DateFormatter.formatDateTime(visit.visitedAt),
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.neutralMuted,
                                  ),
                                ),
                                StatusBadge(
                                  status: visit.isCompleted
                                      ? 'Fulfilled'
                                      : 'Pending',
                                  isSmall: true,
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              visit.customerName,
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                color: isDark
                                    ? Colors.white
                                    : AppColors.neutralDark,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                const Icon(Icons.location_on_outlined,
                                    color: AppColors.info, size: 14),
                                const SizedBox(width: 4),
                                Text(
                                  'GPS: ${visit.latitude.toStringAsFixed(4)}, ${visit.longitude.toStringAsFixed(4)}',
                                  style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.infoText,
                                  ),
                                ),
                              ],
                            ),
                            if (visit.notes != null) ...[
                              const SizedBox(height: 8),
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: isDark
                                      ? AppColors.darkCard
                                      : const Color(0xFFF8FAFC),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Text(
                                  visit.notes!,
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: AppColors.neutralMuted,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
