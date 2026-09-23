import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../orders/providers/orders_provider.dart';
import '../../orders/screens/create_order_screen.dart';
import 'start_visit_screen.dart';

class CustomerListScreen extends ConsumerStatefulWidget {
  const CustomerListScreen({super.key});

  @override
  ConsumerState<CustomerListScreen> createState() => _CustomerListScreenState();
}

class _CustomerListScreenState extends ConsumerState<CustomerListScreen> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final customers = ref.watch(ordersProvider).customers;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final filterText = _searchController.text.toLowerCase();
    final filtered = customers
        .where((c) =>
            c.name.toLowerCase().contains(filterText) ||
            (c.city != null && c.city!.toLowerCase().contains(filterText)) ||
            (c.contactPerson != null &&
                c.contactPerson!.toLowerCase().contains(filterText)))
        .toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Customer Directory'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: SearchInputField(
              controller: _searchController,
              hintText: 'Search customer, contact person or city...',
              onChanged: (_) => setState(() {}),
              onClear: () => setState(() {}),
            ),
          ),
          Expanded(
            child: filtered.isEmpty
                ? const EmptyStateWidget(
                    icon: Icons.storefront_outlined,
                    title: 'No Customers Found',
                    message:
                        'No retail stores match your search query.',
                  )
                : ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final customer = filtered[index];

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
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: isDark
                                        ? AppColors.darkCard
                                        : AppColors.primaryLight,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Icon(Icons.storefront,
                                      color: AppColors.primary, size: 22),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        customer.name,
                                        style: TextStyle(
                                          fontSize: 15,
                                          fontWeight: FontWeight.w700,
                                          color: isDark
                                              ? Colors.white
                                              : AppColors.neutralDark,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        '${customer.contactPerson ?? 'Contact'} • ${customer.phone ?? ''}',
                                        style: const TextStyle(
                                          fontSize: 12,
                                          color: AppColors.neutralMuted,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            if (customer.address != null) ...[
                              const SizedBox(height: 10),
                              Text(
                                customer.address!,
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: AppColors.neutralMuted,
                                ),
                              ),
                            ],
                            const SizedBox(height: 14),
                            const Divider(),
                            const SizedBox(height: 10),
                            Row(
                              children: [
                                Expanded(
                                  child: OutlinedButton.icon(
                                    onPressed: () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (_) => CreateOrderScreen(
                                            initialCustomer: customer,
                                          ),
                                        ),
                                      );
                                    },
                                    icon: const Icon(Icons.shopping_cart_outlined,
                                        size: 16),
                                    label: const Text('Book Order',
                                        style: TextStyle(fontSize: 12)),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: ElevatedButton.icon(
                                    onPressed: () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (_) => StartVisitScreen(
                                            customer: customer,
                                          ),
                                        ),
                                      );
                                    },
                                    icon: const Icon(Icons.location_on_outlined,
                                        size: 16),
                                    label: const Text('Start Visit',
                                        style: TextStyle(fontSize: 12)),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
