import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../shared/widgets/custom_button.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../products/models/product_model.dart';
import '../../products/providers/products_provider.dart';
import '../../products/screens/qr_scanner_screen.dart';
import '../models/order_models.dart';
import '../providers/orders_provider.dart';

class CreateOrderScreen extends ConsumerStatefulWidget {
  final CustomerModel? initialCustomer;

  const CreateOrderScreen({super.key, this.initialCustomer});

  @override
  ConsumerState<CreateOrderScreen> createState() => _CreateOrderScreenState();
}

class _CreateOrderScreenState extends ConsumerState<CreateOrderScreen> {
  int _currentStep = 0;
  CustomerModel? _selectedCustomer;
  final List<OrderLineModel> _basket = [];
  final TextEditingController _notesController = TextEditingController();
  final TextEditingController _addressController = TextEditingController();
  final TextEditingController _customerSearchController =
      TextEditingController();
  Position? _currentGpsPosition;
  bool _isAcquiringGps = false;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    if (widget.initialCustomer != null) {
      _selectedCustomer = widget.initialCustomer;
      _addressController.text = widget.initialCustomer!.address ?? '';
      _currentStep = 1;
    }
    _acquireGps();
  }

  @override
  void dispose() {
    _notesController.dispose();
    _addressController.dispose();
    _customerSearchController.dispose();
    super.dispose();
  }

  Future<void> _acquireGps() async {
    setState(() => _isAcquiringGps = true);
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.always ||
          permission == LocationPermission.whileInUse) {
        final pos = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high,
          timeLimit: const Duration(seconds: 6),
        );
        if (mounted) setState(() => _currentGpsPosition = pos);
      }
    } catch (_) {}
    if (mounted) setState(() => _isAcquiringGps = false);
  }

  void _addProductToBasket(ProductModel product) {
    setState(() {
      final index =
          _basket.indexWhere((item) => item.productId == product.id);
      if (index >= 0) {
        _basket[index].quantity += 1;
      } else {
        _basket.add(
          OrderLineModel(
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            quantity: 1,
            unitPrice: product.unitPrice,
          ),
        );
      }
    });
  }

  void _removeOrDecrementProduct(String productId) {
    setState(() {
      final index =
          _basket.indexWhere((item) => item.productId == productId);
      if (index >= 0) {
        if (_basket[index].quantity > 1) {
          _basket[index].quantity -= 1;
        } else {
          _basket.removeAt(index);
        }
      }
    });
  }

  double get _basketTotal =>
      _basket.fold(0.0, (sum, item) => sum + item.totalPrice);

  Future<void> _submitOrder() async {
    if (_selectedCustomer == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a customer')),
      );
      return;
    }
    if (_basket.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please add at least 1 product')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final success = await ref.read(ordersProvider.notifier).createOrder(
          customer: _selectedCustomer!,
          lines: _basket,
          notes: _notesController.text.trim().isEmpty
              ? null
              : _notesController.text.trim(),
          deliveryAddress: _addressController.text.trim().isEmpty
              ? _selectedCustomer!.address
              : _addressController.text.trim(),
          latitude: _currentGpsPosition?.latitude ??
              _selectedCustomer!.latitude,
          longitude: _currentGpsPosition?.longitude ??
              _selectedCustomer!.longitude,
        );

    setState(() => _isSubmitting = false);

    if (success && mounted) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: const BoxDecoration(
                  color: AppColors.successLight,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check_circle_rounded,
                    color: AppColors.success, size: 48),
              ),
              const SizedBox(height: 16),
              const Text(
                'Order Booked Successfully!',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Customer: ${_selectedCustomer!.name}\nTotal: ${CurrencyFormatter.format(_basketTotal)}\n\nOrder saved to local queue and transmitted to ASP.NET backend.',
                style: const TextStyle(
                    fontSize: 13, color: AppColors.neutralMuted),
                textAlign: TextAlign.center,
              ),
            ],
          ),
          actions: [
            ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx);
                Navigator.pop(context);
              },
              child: const Text('Back to Orders Desk'),
            ),
          ],
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Text('New Sales Order (Step ${_currentStep + 1}/3)'),
      ),
      body: Column(
        children: [
          // Step Progress Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            color: isDark ? AppColors.darkSurface : Colors.white,
            child: Row(
              children: [
                _buildStepPill(
                    0, '1. Customer', _currentStep >= 0, _currentStep == 0),
                const SizedBox(width: 8),
                _buildStepPill(
                    1, '2. Items (${_basket.length})', _currentStep >= 1, _currentStep == 1),
                const SizedBox(width: 8),
                _buildStepPill(
                    2, '3. Review', _currentStep >= 2, _currentStep == 2),
              ],
            ),
          ),
          const Divider(),

          // Body Content Based on Step
          Expanded(
            child: _currentStep == 0
                ? _buildCustomerStep()
                : _currentStep == 1
                    ? _buildItemsStep()
                    : _buildReviewStep(),
          ),

          // Bottom Action Bar
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? AppColors.darkSurface : Colors.white,
              border: Border(
                top: BorderSide(
                  color: isDark ? AppColors.darkBorder : AppColors.paperBorder,
                ),
              ),
            ),
            child: Row(
              children: [
                if (_currentStep > 0) ...[
                  Expanded(
                    flex: 1,
                    child: OutlinedButton(
                      onPressed: () => setState(() => _currentStep -= 1),
                      child: const Text('Back'),
                    ),
                  ),
                  const SizedBox(width: 12),
                ],
                Expanded(
                  flex: 2,
                  child: _currentStep == 2
                      ? CustomButton(
                          text: 'Submit Order (${CurrencyFormatter.format(_basketTotal)})',
                          isLoading: _isSubmitting,
                          icon: Icons.check,
                          onPressed: _submitOrder,
                        )
                      : CustomButton(
                          text: _currentStep == 0
                              ? 'Next: Pick Products'
                              : 'Next: Review Order',
                          onPressed: () {
                            if (_currentStep == 0 &&
                                _selectedCustomer == null) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                    content:
                                        Text('Please select a customer first')),
                              );
                              return;
                            }
                            if (_currentStep == 1 && _basket.isEmpty) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                    content: Text(
                                        'Please add at least one product')),
                              );
                              return;
                            }
                            setState(() => _currentStep += 1);
                          },
                        ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStepPill(
      int step, String title, bool isCompleted, bool isCurrent) {
    return Expanded(
      child: InkWell(
        onTap: () {
          if (step < _currentStep) setState(() => _currentStep = step);
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isCurrent
                ? AppColors.primary
                : (isCompleted ? AppColors.primaryLight : const Color(0xFFF1F5F9)),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            title,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: isCurrent
                  ? Colors.white
                  : (isCompleted
                      ? AppColors.primary
                      : AppColors.neutralMuted),
            ),
          ),
        ),
      ),
    );
  }

  // --- Step 1: Customers ---
  Widget _buildCustomerStep() {
    final customers = ref.watch(ordersProvider).customers;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final filterText = _customerSearchController.text.toLowerCase();
    final filtered = customers
        .where((c) =>
            c.name.toLowerCase().contains(filterText) ||
            (c.city != null && c.city!.toLowerCase().contains(filterText)))
        .toList();

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: SearchInputField(
            controller: _customerSearchController,
            hintText: 'Search customer name or city...',
            onChanged: (val) => setState(() {}),
          ),
        ),
        Expanded(
          child: filtered.isEmpty
              ? const EmptyStateWidget(
                  icon: Icons.person_search_outlined,
                  title: 'No Customers Found',
                  message: 'Try a different customer name or city search.',
                )
              : ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: filtered.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final customer = filtered[index];
                    final isSelected = _selectedCustomer?.id == customer.id;

                    return InkWell(
                      onTap: () {
                        setState(() {
                          _selectedCustomer = customer;
                          _addressController.text = customer.address ?? '';
                        });
                      },
                      borderRadius: BorderRadius.circular(14),
                      child: Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? AppColors.primaryLight
                              : (isDark ? AppColors.darkSurface : Colors.white),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: isSelected
                                ? AppColors.primary
                                : (isDark
                                    ? AppColors.darkBorder
                                    : AppColors.paperBorder),
                            width: isSelected ? 1.5 : 1,
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? AppColors.primary
                                    : const Color(0xFFF1F5F9),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                Icons.storefront_rounded,
                                color: isSelected
                                    ? Colors.white
                                    : AppColors.neutralMuted,
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    customer.name,
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
                                    '${customer.city ?? 'Colombo'} • ${customer.phone ?? ''}',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: AppColors.neutralMuted,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            if (isSelected)
                              const Icon(Icons.check_circle_rounded,
                                  color: AppColors.primary, size: 22),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  // --- Step 2: Line Items ---
  Widget _buildItemsStep() {
    final products = ref.watch(productsProvider).products;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Column(
      children: [
        // Top Basket Bar & Scanner button
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          color: isDark ? AppColors.darkSurface : AppColors.primaryLight,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Basket Total: ${CurrencyFormatter.format(_basketTotal)} (${_basket.length} items)',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                  color: AppColors.primary,
                ),
              ),
              TextButton.icon(
                onPressed: () async {
                  final scannedProduct = await Navigator.push<ProductModel>(
                    context,
                    MaterialPageRoute(
                      builder: (_) =>
                          const QrScannerScreen(returnProductOnScan: true),
                    ),
                  );
                  if (scannedProduct != null) {
                    _addProductToBasket(scannedProduct);
                  }
                },
                icon: const Icon(Icons.qr_code_scanner, size: 16),
                label: const Text('Scan SKU',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),

        // Product Catalog Selector
        Expanded(
          child: ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: products.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (context, index) {
              final p = products[index];
              final basketItem = _basket.firstWhere(
                (item) => item.productId == p.id,
                orElse: () => OrderLineModel(
                  productId: '',
                  productName: '',
                  productSku: '',
                  quantity: 0,
                  unitPrice: 0,
                ),
              );

              final inBasketQty = basketItem.quantity;

              return Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkSurface : Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: inBasketQty > 0
                        ? AppColors.primary
                        : (isDark
                            ? AppColors.darkBorder
                            : AppColors.paperBorder),
                    width: inBasketQty > 0 ? 1.5 : 1,
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            p.name,
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
                            '${p.sku} • Stock: ${p.quantityAvailable}',
                            style: TextStyle(
                              fontSize: 11,
                              color: p.isLowStock
                                  ? AppColors.warning
                                  : AppColors.neutralMuted,
                              fontWeight: p.isLowStock
                                  ? FontWeight.w700
                                  : FontWeight.normal,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            CurrencyFormatter.format(p.unitPrice),
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w800,
                              color: AppColors.primary,
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Add / Quantity Controls
                    if (inBasketQty > 0)
                      Row(
                        children: [
                          IconButton(
                            icon: const Icon(Icons.remove_circle_outline,
                                color: AppColors.primary, size: 24),
                            onPressed: () =>
                                _removeOrDecrementProduct(p.id),
                          ),
                          Text(
                            '$inBasketQty',
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.add_circle,
                                color: AppColors.primary, size: 24),
                            onPressed: () => _addProductToBasket(p),
                          ),
                        ],
                      )
                    else
                      ElevatedButton(
                        onPressed: () => _addProductToBasket(p),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 8),
                        ),
                        child: const Text('Add',
                            style: TextStyle(fontSize: 12)),
                      ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  // --- Step 3: Review & Summary ---
  Widget _buildReviewStep() {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Customer Card
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: isDark ? AppColors.darkSurface : Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                  color: isDark
                      ? AppColors.darkBorder
                      : AppColors.paperBorder),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'CUSTOMER DETAILS',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: AppColors.neutralMuted,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _selectedCustomer?.name ?? 'N/A',
                  style: const TextStyle(
                      fontSize: 15, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 2),
                Text(
                  '${_selectedCustomer?.contactPerson ?? ''} • ${_selectedCustomer?.phone ?? ''}',
                  style: const TextStyle(
                      fontSize: 12, color: AppColors.neutralMuted),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // GPS Coordinates Card
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: isDark ? AppColors.darkSurface : Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                  color: isDark
                      ? AppColors.darkBorder
                      : AppColors.paperBorder),
            ),
            child: Row(
              children: [
                const Icon(Icons.location_on, color: AppColors.info, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Device GPS Capture',
                        style: TextStyle(
                            fontSize: 12, fontWeight: FontWeight.w700),
                      ),
                      Text(
                        _currentGpsPosition != null
                            ? '${_currentGpsPosition!.latitude.toStringAsFixed(5)}, ${_currentGpsPosition!.longitude.toStringAsFixed(5)} (±${_currentGpsPosition!.accuracy.toStringAsFixed(1)}m)'
                            : (_isAcquiringGps
                                ? 'Acquiring GPS...'
                                : 'Default City Location Attached'),
                        style: const TextStyle(
                            fontSize: 11, color: AppColors.neutralMuted),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.refresh, size: 18),
                  onPressed: _acquireGps,
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Order Items Table
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: isDark ? AppColors.darkSurface : Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                  color: isDark
                      ? AppColors.darkBorder
                      : AppColors.paperBorder),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'ORDERED LINE ITEMS',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: AppColors.neutralMuted,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 10),
                ..._basket.map((item) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              '${item.quantity}x ${item.productName}',
                              style: const TextStyle(
                                  fontSize: 13, fontWeight: FontWeight.w600),
                            ),
                          ),
                          Text(
                            CurrencyFormatter.format(item.totalPrice),
                            style: const TextStyle(
                                fontSize: 13, fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                    )),
                const Divider(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Total Amount',
                        style: TextStyle(
                            fontSize: 15, fontWeight: FontWeight.w800)),
                    Text(
                      CurrencyFormatter.format(_basketTotal),
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Notes
          TextField(
            controller: _notesController,
            decoration: const InputDecoration(
              labelText: 'Order Notes (Optional)',
              hintText: 'e.g. Deliver before 2 PM, shelf restock requested',
            ),
          ),
        ],
      ),
    );
  }
}
