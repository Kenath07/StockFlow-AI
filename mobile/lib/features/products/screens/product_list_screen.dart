import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/offline_status_banner.dart';
import '../../../shared/widgets/status_badge.dart';
import '../providers/products_provider.dart';
import 'product_detail_screen.dart';
import 'qr_scanner_screen.dart';

class ProductListScreen extends ConsumerStatefulWidget {
  const ProductListScreen({super.key});

  @override
  ConsumerState<ProductListScreen> createState() => _ProductListScreenState();
}

class _ProductListScreenState extends ConsumerState<ProductListScreen> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(productsProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Product Catalog'),
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code_scanner_rounded),
            tooltip: 'Scan Barcode',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const QrScannerScreen()),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Offline banner if offline
          if (state.isOffline)
            OfflineStatusBanner(
              onSyncPressed: () =>
                  ref.read(productsProvider.notifier).fetchProducts(forceRefresh: true),
            ),

          // Search Bar & Filter Section
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Row(
              children: [
                Expanded(
                  child: SearchInputField(
                    controller: _searchController,
                    hintText: 'Search SKU, name, or barcode...',
                    onChanged: (val) {
                      ref.read(productsProvider.notifier).setSearchQuery(val);
                    },
                    onClear: () {
                      ref.read(productsProvider.notifier).setSearchQuery('');
                    },
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: IconButton(
                    icon: const Icon(Icons.camera_alt_outlined, color: Colors.white, size: 20),
                    tooltip: 'Scan Barcode',
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const QrScannerScreen()),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),

          // Category Chips
          SizedBox(
            height: 44,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: state.categories.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final cat = state.categories[index];
                final isSelected = cat == state.selectedCategory;
                return ChoiceChip(
                  label: Text(cat),
                  selected: isSelected,
                  selectedColor: AppColors.primaryLight,
                  backgroundColor: isDark ? AppColors.darkSurface : Colors.white,
                  side: BorderSide(
                    color: isSelected ? AppColors.primary : AppColors.paperBorder,
                  ),
                  labelStyle: TextStyle(
                    fontSize: 13,
                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                    color: isSelected ? AppColors.primary : (isDark ? Colors.white : AppColors.neutralDark),
                  ),
                  onSelected: (selected) {
                    if (selected) {
                      ref.read(productsProvider.notifier).setCategory(cat);
                    }
                  },
                );
              },
            ),
          ),
          const SizedBox(height: 8),

          // Product List
          Expanded(
            child: state.isLoading && state.products.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : state.filteredProducts.isEmpty
                    ? EmptyStateWidget(
                        icon: Icons.inventory_2_outlined,
                        title: 'No Products Found',
                        message: 'No inventory items match your search filter or category selection.',
                        actionText: 'Refresh Catalog',
                        onAction: () => ref.read(productsProvider.notifier).fetchProducts(forceRefresh: true),
                      )
                    : RefreshIndicator(
                        onRefresh: () => ref.read(productsProvider.notifier).fetchProducts(forceRefresh: true),
                        child: ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: state.filteredProducts.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            final product = state.filteredProducts[index];
                            return InkWell(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => ProductDetailScreen(product: product),
                                  ),
                                );
                              },
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
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // Product Icon Box
                                    Container(
                                      width: 46,
                                      height: 46,
                                      decoration: BoxDecoration(
                                        color: isDark ? AppColors.darkCard : AppColors.primaryLight,
                                        borderRadius: BorderRadius.circular(12),
                                        border: Border.all(
                                          color: isDark ? AppColors.darkBorder : const Color(0xFFFFEDD5),
                                        ),
                                      ),
                                      child: const Icon(
                                        Icons.inventory_2_rounded,
                                        color: AppColors.primary,
                                        size: 22,
                                      ),
                                    ),
                                    const SizedBox(width: 12),

                                    // Details
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            children: [
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                decoration: BoxDecoration(
                                                  color: isDark ? AppColors.darkCard : const Color(0xFFF1F5F9),
                                                  borderRadius: BorderRadius.circular(6),
                                                ),
                                                child: Text(
                                                  product.sku,
                                                  style: const TextStyle(
                                                    fontSize: 10,
                                                    fontWeight: FontWeight.w700,
                                                    color: AppColors.neutralMuted,
                                                  ),
                                                ),
                                              ),
                                              if (product.isOutOfStock)
                                                const StatusBadge(status: 'Cancelled', isSmall: true)
                                              else if (product.isLowStock)
                                                StatusBadge(
                                                  status: '${product.quantityAvailable} Low Stock',
                                                  isSmall: true,
                                                )
                                              else
                                                StatusBadge(
                                                  status: '${product.quantityAvailable} In Stock',
                                                  isSmall: true,
                                                ),
                                            ],
                                          ),
                                          const SizedBox(height: 6),
                                          Text(
                                            product.name,
                                            style: TextStyle(
                                              fontSize: 14,
                                              fontWeight: FontWeight.w700,
                                              color: isDark ? Colors.white : AppColors.neutralDark,
                                            ),
                                            maxLines: 2,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            product.categoryName ?? 'General',
                                            style: const TextStyle(
                                              fontSize: 12,
                                              color: AppColors.neutralMuted,
                                            ),
                                          ),
                                          const SizedBox(height: 8),
                                          Text(
                                            CurrencyFormatter.format(product.unitPrice),
                                            style: const TextStyle(
                                              fontSize: 15,
                                              fontWeight: FontWeight.w800,
                                              color: AppColors.primary,
                                            ),
                                          ),
                                        ],
                                      ),
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
