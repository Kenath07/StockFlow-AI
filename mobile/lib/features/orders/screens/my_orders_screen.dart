import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../core/utils/date_formatter.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/status_badge.dart';
import '../providers/orders_provider.dart';
import 'create_order_screen.dart';
import 'order_detail_screen.dart';

class MyOrdersScreen extends ConsumerStatefulWidget {
  const MyOrdersScreen({super.key});

  @override
  ConsumerState<MyOrdersScreen> createState() => _MyOrdersScreenState();
}

class _MyOrdersScreenState extends ConsumerState<MyOrdersScreen> {
  final TextEditingController _searchController = TextEditingController();
  final List<String> _tabs = [
    'All',
    'Pending',
    'Confirmed',
    'Dispatched',
    'Fulfilled'
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(ordersProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Orders Desk'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () =>
                ref.read(ordersProvider.notifier).fetchOrders(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const CreateOrderScreen()),
          );
        },
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('New Order',
            style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: SearchInputField(
              controller: _searchController,
              hintText: 'Search order number or customer...',
              onChanged: (val) {
                ref.read(ordersProvider.notifier).setSearchQuery(val);
              },
              onClear: () {
                ref.read(ordersProvider.notifier).setSearchQuery('');
              },
            ),
          ),

          // Status Filter Tabs
          SizedBox(
            height: 44,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _tabs.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final tab = _tabs[index];
                final isSelected = tab == state.selectedStatus;
                return ChoiceChip(
                  label: Text(tab),
                  selected: isSelected,
                  selectedColor: AppColors.primaryLight,
                  backgroundColor: isDark ? AppColors.darkSurface : Colors.white,
                  side: BorderSide(
                    color:
                        isSelected ? AppColors.primary : AppColors.paperBorder,
                  ),
                  labelStyle: TextStyle(
                    fontSize: 13,
                    fontWeight:
                        isSelected ? FontWeight.w700 : FontWeight.w500,
                    color: isSelected
                        ? AppColors.primary
                        : (isDark ? Colors.white : AppColors.neutralDark),
                  ),
                  onSelected: (selected) {
                    if (selected) {
                      ref.read(ordersProvider.notifier).setStatusFilter(tab);
                    }
                  },
                );
              },
            ),
          ),
          const SizedBox(height: 8),

          // Orders List
          Expanded(
            child: state.isLoading && state.orders.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : state.filteredOrders.isEmpty
                    ? EmptyStateWidget(
                        icon: Icons.shopping_bag_outlined,
                        title: 'No Orders Found',
                        message:
                            'No sales orders match your selected status filter or search query.',
                        actionText: 'Book New Order',
                        onAction: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                                builder: (_) => const CreateOrderScreen()),
                          );
                        },
                      )
                    : RefreshIndicator(
                        onRefresh: () =>
                            ref.read(ordersProvider.notifier).fetchOrders(),
                        child: ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: state.filteredOrders.length,
                          separatorBuilder: (_, __) =>
                              const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            final order = state.filteredOrders[index];

                            return InkWell(
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
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: isDark
                                      ? AppColors.darkSurface
                                      : Colors.white,
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
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          order.orderNumber,
                                          style: const TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w800,
                                          ),
                                        ),
                                        StatusBadge(status: order.status),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      order.customerName,
                                      style: TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w700,
                                        color: isDark
                                            ? Colors.white
                                            : AppColors.neutralDark,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      '${order.lines.length} items • ${DateFormatter.formatDate(order.orderDate)}',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: AppColors.neutralMuted,
                                      ),
                                    ),
                                    const SizedBox(height: 12),
                                    const Divider(),
                                    const SizedBox(height: 8),
                                    Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      children: [
                                        const Text(
                                          'Order Amount',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: AppColors.neutralMuted,
                                          ),
                                        ),
                                        Text(
                                          CurrencyFormatter.format(
                                              order.totalAmount),
                                          style: const TextStyle(
                                            fontSize: 16,
                                            fontWeight: FontWeight.w900,
                                            color: AppColors.primary,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}
