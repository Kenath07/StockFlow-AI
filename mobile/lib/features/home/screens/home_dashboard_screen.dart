import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../shared/widgets/metric_card.dart';
import '../../../shared/widgets/offline_status_banner.dart';
import '../../../shared/widgets/status_badge.dart';
import '../../auth/providers/auth_provider.dart';
import '../../notifications/providers/notifications_provider.dart';
import '../../notifications/screens/notifications_screen.dart';
import '../../orders/providers/orders_provider.dart';
import '../../orders/screens/create_order_screen.dart';
import '../../orders/screens/my_orders_screen.dart';
import '../../orders/screens/order_detail_screen.dart';
import '../../products/providers/products_provider.dart';
import '../../products/screens/product_list_screen.dart';
import '../../products/screens/qr_scanner_screen.dart';
import '../../sync/providers/sync_provider.dart';
import '../../sync/screens/sync_queue_screen.dart';
import '../../visits/providers/visits_provider.dart';
import '../../visits/screens/customer_list_screen.dart';

class HomeDashboardScreen extends ConsumerWidget {
  const HomeDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).session;
    final isStorekeeper = user?.isStorekeeper ?? false;
    final productsState = ref.watch(productsProvider);
    final ordersState = ref.watch(ordersProvider);
    final visitsState = ref.watch(visitsProvider);
    final syncState = ref.watch(syncProvider);
    final notificationsState = ref.watch(notificationsProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.paperBorder),
              ),
              child: Image.asset(
                'assets/icons/favicon.png',
                errorBuilder: (_, __, ___) =>
                    const Icon(Icons.inventory_2, color: AppColors.primary, size: 16),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              isStorekeeper ? 'StockFlow Warehouse Desk' : 'StockFlow Field Desk',
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
            ),
          ],
        ),
        actions: [
          // Notification Bell
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.notifications_outlined),
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (_) => const NotificationsScreen()),
                  );
                },
              ),
              if (notificationsState.unreadCount > 0)
                Positioned(
                  top: 8,
                  right: 8,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: AppColors.primary,
                      shape: BoxShape.circle,
                    ),
                    child: Text(
                      '${notificationsState.unreadCount}',
                      style: const TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
            ],
          ),
          // Sync queue shortcut
          IconButton(
            icon: Icon(
              syncState.totalPending > 0
                  ? Icons.sync_problem_rounded
                  : Icons.cloud_done_rounded,
              color: syncState.totalPending > 0
                  ? AppColors.warning
                  : AppColors.success,
            ),
            tooltip: 'Sync Queue',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const SyncQueueScreen()),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Offline banner if offline
            if (!syncState.isOnline || syncState.totalPending > 0)
              OfflineStatusBanner(
                pendingCount: syncState.totalPending,
                onSyncPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (_) => const SyncQueueScreen()),
                  );
                },
              ),

            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Officer Welcome Card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.15),
                          blurRadius: 16,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.12),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                user?.region ?? 'Western Province',
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white70,
                                ),
                              ),
                            ),
                            // Connection Pill
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: syncState.isOnline
                                    ? const Color(0xFF064E3B)
                                    : const Color(0xFF78350F),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: syncState.isOnline
                                      ? AppColors.success
                                      : AppColors.warning,
                                  width: 1,
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Container(
                                    width: 6,
                                    height: 6,
                                    decoration: BoxDecoration(
                                      color: syncState.isOnline
                                          ? AppColors.success
                                          : AppColors.warning,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                  const SizedBox(width: 5),
                                  Text(
                                    syncState.isOnline
                                        ? 'ONLINE'
                                        : 'OFFLINE MODE',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                      color: syncState.isOnline
                                          ? const Color(0xFFA7F3D0)
                                          : const Color(0xFFFDE68A),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        Text(
                          'Welcome back,\n${user?.fullName ?? 'Kamal Perera'}',
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            letterSpacing: -0.5,
                            height: 1.2,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Key Metrics (Role-Based)
                  Text(
                    isStorekeeper
                        ? "TODAY'S WAREHOUSE TELEMETRY"
                        : "TODAY'S FIELD TELEMETRY",
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: AppColors.neutralMuted,
                      letterSpacing: 0.8,
                    ),
                  ),
                  const SizedBox(height: 12),

                  if (isStorekeeper) ...[
                    Row(
                      children: [
                        Expanded(
                          child: MetricCard(
                            title: 'Active SKUs',
                            value: '${productsState.products.length}',
                            subtitle: 'Catalog items on shelf',
                            icon: Icons.inventory_2_outlined,
                            iconColor: AppColors.primary,
                            iconBgColor: AppColors.primaryLight,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: MetricCard(
                            title: 'Low Stock Alerts',
                            value:
                                '${productsState.products.where((p) => p.isLowStock).length}',
                            subtitle: 'Items below threshold',
                            icon: Icons.warning_amber_rounded,
                            iconColor: AppColors.error,
                            iconBgColor: AppColors.errorLight,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    MetricCard(
                      title: 'Pending Fulfillment',
                      value:
                          '${ordersState.orders.where((o) => o.status.toLowerCase() == 'pending').length} Orders',
                      subtitle: 'Awaiting warehouse pick & dispatch',
                      icon: Icons.local_shipping_outlined,
                      iconColor: AppColors.warning,
                      iconBgColor: AppColors.warningLight,
                    ),
                  ] else ...[
                    Row(
                      children: [
                        Expanded(
                          child: MetricCard(
                            title: 'Visits Today',
                            value: '${visitsState.todayVisitsCount}',
                            subtitle: 'Customer check-ins',
                            icon: Icons.location_on_outlined,
                            iconColor: AppColors.info,
                            iconBgColor: AppColors.infoLight,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: MetricCard(
                            title: 'Orders Booked',
                            value: '${ordersState.todayOrdersCount}',
                            subtitle: 'Sales recorded',
                            icon: Icons.shopping_bag_outlined,
                            iconColor: AppColors.primary,
                            iconBgColor: AppColors.primaryLight,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    MetricCard(
                      title: "Today's Total Sales Revenue",
                      value: CurrencyFormatter.format(ordersState.todaySalesTotal),
                      subtitle: 'Direct field revenue generated today',
                      icon: Icons.payments_outlined,
                      iconColor: AppColors.success,
                      iconBgColor: AppColors.successLight,
                    ),
                  ],
                  const SizedBox(height: 28),

                  // Quick Action Tiles (Role-Based)
                  Text(
                    isStorekeeper
                        ? 'WAREHOUSE OPERATIONS'
                        : 'QUICK FIELD ACTIONS',
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: AppColors.neutralMuted,
                      letterSpacing: 0.8,
                    ),
                  ),
                  const SizedBox(height: 12),

                  if (isStorekeeper) ...[
                    Row(
                      children: [
                        Expanded(
                          child: _buildActionTile(
                            context,
                            'Scan Barcode',
                            'Bin & stock lookup',
                            Icons.qr_code_scanner_rounded,
                            AppColors.primary,
                            () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (_) => const QrScannerScreen()),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildActionTile(
                            context,
                            'Stock Catalog',
                            'Inspect bin levels',
                            Icons.inventory_2_rounded,
                            AppColors.secondary,
                            () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (_) => const ProductListScreen()),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _buildActionTile(
                            context,
                            'Dispatch Orders',
                            '${ordersState.orders.where((o) => o.status.toLowerCase() == 'pending').length} pending dispatch',
                            Icons.local_shipping_rounded,
                            AppColors.info,
                            () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (_) => const MyOrdersScreen()),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildActionTile(
                            context,
                            'Sync Queue',
                            '${syncState.totalPending} items pending',
                            Icons.sync_rounded,
                            AppColors.success,
                            () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (_) => const SyncQueueScreen()),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ] else ...[
                    Row(
                      children: [
                        Expanded(
                          child: _buildActionTile(
                            context,
                            'Scan Product',
                            'Camera QR/Barcode',
                            Icons.qr_code_scanner_rounded,
                            AppColors.primary,
                            () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (_) => const QrScannerScreen()),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildActionTile(
                            context,
                            'New Order',
                            '3-step order wizard',
                            Icons.add_shopping_cart_rounded,
                            AppColors.secondary,
                            () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (_) => const CreateOrderScreen()),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _buildActionTile(
                            context,
                            'Start Visit',
                            'GPS customer check-in',
                            Icons.my_location_rounded,
                            AppColors.info,
                            () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (_) => const CustomerListScreen()),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildActionTile(
                            context,
                            'Sync Queue',
                            '${syncState.totalPending} items pending',
                            Icons.sync_rounded,
                            AppColors.success,
                            () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (_) => const SyncQueueScreen()),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 28),

                  // Recent Orders / Outbound Dispatches
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        isStorekeeper
                            ? 'OUTBOUND ORDERS & DISPATCH'
                            : 'RECENT ORDERS',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: AppColors.neutralMuted,
                          letterSpacing: 0.8,
                        ),
                      ),
                      if (ordersState.orders.isNotEmpty)
                        Text(
                          '${ordersState.orders.length} total',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppColors.neutralMuted,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  if (ordersState.orders.isEmpty)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.darkSurface : Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isDark
                              ? AppColors.darkBorder
                              : AppColors.paperBorder,
                        ),
                      ),
                      child: Center(
                        child: Text(
                          isStorekeeper
                              ? 'No outbound orders pending fulfillment.'
                              : 'No recent orders. Tap "New Order" to start.',
                          style: const TextStyle(
                              fontSize: 13, color: AppColors.neutralMuted),
                        ),
                      ),
                    )
                  else
                    ...ordersState.orders.take(3).map((order) => Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: InkWell(
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) =>
                                      OrderDetailScreen(order: order),
                                ),
                              );
                            },
                            borderRadius: BorderRadius.circular(16),
                            child: Container(
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: isDark
                                    ? AppColors.darkSurface
                                    : Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: isDark
                                      ? AppColors.darkBorder
                                      : AppColors.paperBorder,
                                ),
                              ),
                              child: Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        order.customerName,
                                        style: TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w700,
                                          color: isDark
                                              ? Colors.white
                                              : AppColors.neutralDark,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        '${order.orderNumber} • ${CurrencyFormatter.format(order.totalAmount)}',
                                        style: const TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                          color: AppColors.primary,
                                        ),
                                      ),
                                    ],
                                  ),
                                  StatusBadge(
                                      status: order.status, isSmall: true),
                                ],
                              ),
                            ),
                          ),
                        )),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionTile(
    BuildContext context,
    String title,
    String subtitle,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkSurface : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isDark ? AppColors.darkBorder : AppColors.paperBorder,
            width: 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(isDark ? 0.2 : 0.02),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withOpacity(0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(height: 10),
            Text(
              title,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w800,
                color: isDark ? Colors.white : AppColors.neutralDark,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              subtitle,
              style: const TextStyle(
                fontSize: 11,
                color: AppColors.neutralMuted,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
