import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../shared/widgets/status_badge.dart';
import '../models/product_model.dart';
import '../providers/products_provider.dart';

class ProductDetailScreen extends ConsumerStatefulWidget {
  final ProductModel product;

  const ProductDetailScreen({super.key, required this.product});

  @override
  ConsumerState<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends ConsumerState<ProductDetailScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(productsProvider.notifier).fetchProductMovements(widget.product.id));
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final productsState = ref.watch(productsProvider);
    final product = widget.product;
    final movements = productsState.productMovements[product.id];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Product Details'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Card
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
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 12,
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
                          color: AppColors.primaryLight,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                              color: const Color(0xFFFFEDD5), width: 1),
                        ),
                        child: Text(
                          product.sku,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                      if (product.isOutOfStock)
                        const StatusBadge(status: 'Cancelled')
                      else if (product.isLowStock)
                        const StatusBadge(status: 'Pending')
                      else
                        const StatusBadge(status: 'Fulfilled'),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Text(
                    product.name,
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : AppColors.neutralDark,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    product.categoryName ?? 'General Category',
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.neutralMuted,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Divider(),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Unit Price',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.neutralMuted,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            CurrencyFormatter.format(product.unitPrice),
                            style: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w800,
                              color: AppColors.primary,
                            ),
                          ),
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          const Text(
                            'Cost Price',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.neutralMuted,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            CurrencyFormatter.format(product.costPrice),
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: isDark
                                  ? const Color(0xFF94A3B8)
                                  : AppColors.neutralMuted,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Stock & Warehouse Section
            const Text(
              'INVENTORY & WAREHOUSE LOCATION',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                color: AppColors.neutralMuted,
                letterSpacing: 0.8,
              ),
            ),
            const SizedBox(height: 12),

            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkSurface : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isDark ? AppColors.darkBorder : AppColors.paperBorder,
                ),
              ),
              child: Column(
                children: [
                  _buildSpecRow(
                    'Available for Sale',
                    '${product.quantityAvailable} units',
                    isHighlight: true,
                    highlightColor: product.isLowStock
                        ? AppColors.warning
                        : AppColors.success,
                  ),
                  const Divider(height: 24),
                  _buildSpecRow(
                      'Total On Hand', '${product.quantityOnHand} units'),
                  const Divider(height: 24),
                  _buildSpecRow('Barcode / EAN-13', product.barcode ?? 'N/A'),
                  const Divider(height: 24),
                  _buildSpecRow('Warehouse Location',
                      product.warehouseLocation ?? 'Colombo Central Depot'),
                ],
              ),
            ),
            const SizedBox(height: 24),
            
            // Movement History Section
            const Text(
              'MOVEMENT HISTORY',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                color: AppColors.neutralMuted,
                letterSpacing: 0.8,
              ),
            ),
            const SizedBox(height: 12),
            if (movements == null)
               const Center(child: Padding(
                 padding: EdgeInsets.all(16.0),
                 child: CircularProgressIndicator(),
               ))
            else if (movements.isEmpty)
               Container(
                 width: double.infinity,
                 padding: const EdgeInsets.all(24),
                 decoration: BoxDecoration(
                   color: isDark ? AppColors.darkSurface : Colors.white,
                   borderRadius: BorderRadius.circular(16),
                   border: Border.all(
                     color: isDark ? AppColors.darkBorder : AppColors.paperBorder,
                   ),
                 ),
                 child: const Text(
                   'No movement history found.',
                   textAlign: TextAlign.center,
                   style: TextStyle(color: AppColors.neutralMuted),
                 ),
               )
            else
               ...movements.take(10).map((m) => _buildMovementCard(m, isDark)),
          ],
        ),
      ),
    );
  }

  Widget _buildSpecRow(String label, String value,
      {bool isHighlight = false, Color? highlightColor}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            color: AppColors.neutralMuted,
            fontWeight: FontWeight.w500,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: isHighlight ? FontWeight.w800 : FontWeight.w700,
            color: highlightColor ?? AppColors.neutralDark,
          ),
        ),
      ],
    );
  }

  Widget _buildMovementCard(dynamic movement, bool isDark) {
    final bool isAddition = movement.quantity > 0;
    
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurface : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? AppColors.darkBorder : AppColors.paperBorder,
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: isAddition ? AppColors.successLight : AppColors.errorLight,
              shape: BoxShape.circle,
            ),
            child: Icon(
              isAddition ? Icons.arrow_downward : Icons.arrow_upward,
              color: isAddition ? AppColors.success : AppColors.error,
              size: 20,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  movement.type,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  DateFormat('MMM dd, yyyy - hh:mm a').format(movement.performedAt),
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.neutralMuted,
                  ),
                ),
                if (movement.referenceNumber != null || movement.notes != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    movement.referenceNumber ?? movement.notes ?? '',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.neutralMuted,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
              ],
            ),
          ),
          Text(
            '${isAddition ? '+' : ''}${movement.quantity}',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: isAddition ? AppColors.success : AppColors.error,
            ),
          ),
        ],
      ),
    );
  }
}
