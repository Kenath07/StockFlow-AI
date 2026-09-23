import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/storage/local_database.dart';
import '../models/product_model.dart';
import '../models/stock_movement_model.dart';

class ProductsState {
  final bool isLoading;
  final List<ProductModel> products;
  final List<String> categories;
  final String selectedCategory;
  final String searchQuery;
  final String? errorMessage;
  final bool isOffline;
  final Map<String, List<StockMovementModel>> productMovements;

  const ProductsState({
    this.isLoading = false,
    this.products = const [],
    this.categories = const ['All'],
    this.selectedCategory = 'All',
    this.searchQuery = '',
    this.errorMessage,
    this.isOffline = false,
    this.productMovements = const {},
  });

  List<ProductModel> get filteredProducts {
    return products.where((p) {
      final matchesCategory = selectedCategory == 'All' ||
          (p.categoryName?.toLowerCase() == selectedCategory.toLowerCase());
      final matchesSearch = searchQuery.isEmpty ||
          p.name.toLowerCase().contains(searchQuery.toLowerCase()) ||
          p.sku.toLowerCase().contains(searchQuery.toLowerCase()) ||
          (p.barcode != null &&
              p.barcode!.toLowerCase().contains(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    }).toList();
  }

  ProductsState copyWith({
    bool? isLoading,
    List<ProductModel>? products,
    List<String>? categories,
    String? selectedCategory,
    String? searchQuery,
    String? errorMessage,
    bool? isOffline,
    Map<String, List<StockMovementModel>>? productMovements,
  }) {
    return ProductsState(
      isLoading: isLoading ?? this.isLoading,
      products: products ?? this.products,
      categories: categories ?? this.categories,
      selectedCategory: selectedCategory ?? this.selectedCategory,
      searchQuery: searchQuery ?? this.searchQuery,
      errorMessage: errorMessage,
      isOffline: isOffline ?? this.isOffline,
      productMovements: productMovements ?? this.productMovements,
    );
  }
}

class ProductsNotifier extends StateNotifier<ProductsState> {
  ProductsNotifier() : super(const ProductsState()) {
    fetchProducts();
  }

  Future<void> fetchProducts({bool forceRefresh = false}) async {
    state = state.copyWith(isLoading: true, errorMessage: null);

    try {
      final response = await ApiClient.get(ApiEndpoints.products);
      if (response.statusCode == 200 && response.data != null) {
        final List list = response.data is List ? response.data : [];
        final products = list.map((item) => ProductModel.fromJson(item)).toList();

        // Extract categories
        final catSet = <String>{'All'};
        for (final p in products) {
          if (p.categoryName != null && p.categoryName!.isNotEmpty) {
            catSet.add(p.categoryName!);
          }
        }

        // Cache to SQLite
        final rawMapList = list.cast<Map<String, dynamic>>();
        await LocalDatabase.cacheProducts(rawMapList);

        state = state.copyWith(
          isLoading: false,
          products: products,
          categories: catSet.toList(),
          isOffline: false,
        );
        return;
      }
    } catch (e) {
      // Offline fallback: load from SQLite cache
      final cached = await LocalDatabase.getCachedProducts();
      if (cached.isNotEmpty) {
        final products = cached.map((c) => ProductModel.fromSqlite(c)).toList();
        final catSet = <String>{'All'};
        for (final p in products) {
          if (p.categoryName != null && p.categoryName!.isNotEmpty) {
            catSet.add(p.categoryName!);
          }
        }
        state = state.copyWith(
          isLoading: false,
          products: products,
          categories: catSet.toList(),
          isOffline: true,
        );
        return;
      }

      // If no SQLite cache exists, use default mock catalogue for offline demo
      final mockProducts = _getMockProducts();
      final catSet = <String>{'All', 'Beverages', 'Dairy', 'Staples', 'Snacks'};
      state = state.copyWith(
        isLoading: false,
        products: mockProducts,
        categories: catSet.toList(),
        isOffline: true,
      );
    }
  }

  void setCategory(String category) {
    state = state.copyWith(selectedCategory: category);
  }

  void setSearchQuery(String query) {
    state = state.copyWith(searchQuery: query);
  }

  ProductModel? findByBarcode(String barcode) {
    final clean = barcode.trim();
    try {
      return state.products.firstWhere(
        (p) =>
            p.barcode == clean ||
            p.sku.toLowerCase() == clean.toLowerCase(),
      );
    } catch (_) {
      return null;
    }
  }

  Future<ProductModel?> lookupBarcode(String barcode) async {
    final clean = barcode.trim();
    if (clean.isEmpty) return null;

    // 1. Check in-memory state first
    final memoryMatch = findByBarcode(clean);
    if (memoryMatch != null) return memoryMatch;

    // 2. Check local SQLite cache
    try {
      final cachedRows = await LocalDatabase.getCachedProducts(search: clean);
      if (cachedRows.isNotEmpty) {
        final match = cachedRows
            .map((c) => ProductModel.fromSqlite(c))
            .firstWhere(
              (p) =>
                  p.barcode == clean ||
                  p.sku.toLowerCase() == clean.toLowerCase(),
              orElse: () => ProductModel.fromSqlite(cachedRows.first),
            );
        return match;
      }
    } catch (_) {}

    // 3. Online Backend API Exact Lookup Fallback
    try {
      final response =
          await ApiClient.get(ApiEndpoints.productByBarcode(clean));
      if (response.statusCode == 200 && response.data != null) {
        final product = ProductModel.fromJson(response.data);

        // Auto-cache to SQLite
        await LocalDatabase.cacheProducts([product.toJson()]);

        // Add to in-memory list if not present
        if (!state.products.any((p) => p.id == product.id)) {
          state = state.copyWith(products: [product, ...state.products]);
        }
        return product;
      }
    } catch (_) {
      // 4. Try generic search endpoint as second online fallback
      try {
        final searchRes = await ApiClient.get(
          ApiEndpoints.productSearch,
          queryParameters: {'q': clean},
        );
        if (searchRes.statusCode == 200 && searchRes.data != null) {
          final List list = searchRes.data is List ? searchRes.data : [];
          if (list.isNotEmpty) {
            final product = ProductModel.fromJson(list.first);
            await LocalDatabase.cacheProducts([product.toJson()]);
            if (!state.products.any((p) => p.id == product.id)) {
              state = state.copyWith(products: [product, ...state.products]);
            }
            return product;
          }
        }
      } catch (_) {}
    }

    return null;
  }

  List<ProductModel> _getMockProducts() {
    return [
      ProductModel(
        id: 'p1000000-0000-0000-0000-000000000001',
        sku: 'BEV-001',
        name: 'Ceylon Black Tea 500g',
        categoryName: 'Beverages',
        unitPrice: 850.0,
        costPrice: 620.0,
        quantityOnHand: 145,
        quantityAvailable: 130,
        barcode: '4790001001001',
        warehouseLocation: 'Aisle 3 - Bay B',
      ),
      ProductModel(
        id: 'p1000000-0000-0000-0000-000000000002',
        sku: 'DAI-002',
        name: 'Highland Fresh Milk 1L',
        categoryName: 'Dairy',
        unitPrice: 420.0,
        costPrice: 340.0,
        quantityOnHand: 35,
        quantityAvailable: 8, // Low Stock
        barcode: '4790002002002',
        warehouseLocation: 'Chiller 1',
      ),
      ProductModel(
        id: 'p1000000-0000-0000-0000-000000000003',
        sku: 'STP-003',
        name: 'Nipuna White Rice 5kg',
        categoryName: 'Staples',
        unitPrice: 1250.0,
        costPrice: 980.0,
        quantityOnHand: 220,
        quantityAvailable: 210,
        barcode: '4790003003003',
        warehouseLocation: 'Warehouse Bulk Section',
      ),
      ProductModel(
        id: 'p1000000-0000-0000-0000-000000000004',
        sku: 'SNK-004',
        name: 'Munchee Super Cream Cracker 500g',
        categoryName: 'Snacks',
        unitPrice: 380.0,
        costPrice: 290.0,
        quantityOnHand: 80,
        quantityAvailable: 75,
        barcode: '4790004004004',
        warehouseLocation: 'Aisle 1 - Bay A',
      ),
    ];
  }

  Future<void> fetchProductMovements(String productId) async {
    try {
      final response = await ApiClient.get(ApiEndpoints.stockMovements(productId));
      if (response.statusCode == 200 && response.data != null) {
        final List list = response.data is List ? response.data : [];
        final movements = list.map((item) => StockMovementModel.fromJson(item)).toList();
        
        final newMap = Map<String, List<StockMovementModel>>.from(state.productMovements);
        newMap[productId] = movements;
        
        state = state.copyWith(productMovements: newMap);
      }
    } catch (e) {
      // In offline mode or error, we could fetch from SQLite, but for now we just fail silently for history
    }
  }
}

final productsProvider =
    StateNotifierProvider<ProductsNotifier, ProductsState>((ref) {
  return ProductsNotifier();
});
