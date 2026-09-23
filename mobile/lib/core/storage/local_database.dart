import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart' as p;

class LocalDatabase {
  static Database? _database;
  static const String _dbName = 'stockflow_offline.db';
  static const int _dbVersion = 1;

  static Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  static Future<Database> _initDatabase() async {
    final dbPath = await getDatabasesPath();
    final path = p.join(dbPath, _dbName);

    return await openDatabase(
      path,
      version: _dbVersion,
      onCreate: (db, version) async {
        // 1. Cached Products Table
        await db.execute('''
          CREATE TABLE cached_products (
            id TEXT PRIMARY KEY,
            sku TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            unit_price REAL NOT NULL,
            cost_price REAL NOT NULL,
            category_id TEXT,
            category_name TEXT,
            quantity_on_hand INTEGER,
            quantity_available INTEGER,
            barcode TEXT,
            last_synced_at TEXT
          )
        ''');

        // 2. Cached Customers Table
        await db.execute('''
          CREATE TABLE cached_customers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            contact_person TEXT,
            email TEXT,
            phone TEXT,
            address TEXT,
            city TEXT,
            latitude REAL,
            longitude REAL,
            is_active INTEGER DEFAULT 1
          )
        ''');

        // 3. Offline Orders Queue
        await db.execute('''
          CREATE TABLE offline_orders_queue (
            local_id TEXT PRIMARY KEY,
            customer_id TEXT NOT NULL,
            customer_name TEXT NOT NULL,
            lines_json TEXT NOT NULL,
            total_amount REAL NOT NULL,
            notes TEXT,
            delivery_address TEXT,
            latitude REAL,
            longitude REAL,
            created_at TEXT NOT NULL,
            sync_status TEXT NOT NULL,
            error_message TEXT
          )
        ''');

        // 4. Offline Visits Queue
        await db.execute('''
          CREATE TABLE offline_visits_queue (
            local_id TEXT PRIMARY KEY,
            agent_id TEXT NOT NULL,
            customer_id TEXT NOT NULL,
            customer_name TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            address_snapshot TEXT,
            notes TEXT,
            visited_at TEXT NOT NULL,
            checkout_at TEXT,
            sales_order_id TEXT,
            sync_status TEXT NOT NULL,
            error_message TEXT
          )
        ''');

        // 5. Notifications Cache
        await db.execute('''
          CREATE TABLE cached_notifications (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT NOT NULL,
            is_read INTEGER DEFAULT 0,
            created_at TEXT NOT NULL
          )
        ''');
      },
    );
  }

  // --- Product Cache Operations ---
  static Future<void> cacheProducts(List<Map<String, dynamic>> products) async {
    final db = await database;
    final batch = db.batch();
    for (final p in products) {
      batch.insert(
        'cached_products',
        {
          'id': p['id']?.toString() ?? '',
          'sku': p['sku'] ?? '',
          'name': p['name'] ?? '',
          'description': p['description'],
          'unit_price': (p['unitPrice'] as num?)?.toDouble() ?? 0.0,
          'cost_price': (p['costPrice'] as num?)?.toDouble() ?? 0.0,
          'category_id': p['categoryId']?.toString(),
          'category_name': p['categoryName'],
          'quantity_on_hand': p['quantityOnHand'] ?? 0,
          'quantity_available': p['quantityAvailable'] ?? 0,
          'barcode': p['barcode'],
          'last_synced_at': DateTime.now().toIso8601String(),
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }
    await batch.commit(noResult: true);
  }

  static Future<List<Map<String, dynamic>>> getCachedProducts({String? search, String? category}) async {
    final db = await database;
    String whereClause = '';
    List<dynamic> whereArgs = [];

    if (search != null && search.isNotEmpty) {
      whereClause += '(name LIKE ? OR sku LIKE ? OR barcode LIKE ?)';
      whereArgs.addAll(['%$search%', '%$search%', '%$search%']);
    }

    if (category != null && category.isNotEmpty && category != 'All') {
      if (whereClause.isNotEmpty) whereClause += ' AND ';
      whereClause += 'category_name = ?';
      whereArgs.add(category);
    }

    return await db.query(
      'cached_products',
      where: whereClause.isEmpty ? null : whereClause,
      whereArgs: whereArgs.isEmpty ? null : whereArgs,
      orderBy: 'name ASC',
    );
  }

  // --- Customer Cache Operations ---
  static Future<void> cacheCustomers(List<Map<String, dynamic>> customers) async {
    final db = await database;
    final batch = db.batch();
    for (final c in customers) {
      batch.insert(
        'cached_customers',
        {
          'id': c['id']?.toString() ?? '',
          'name': c['name'] ?? '',
          'contact_person': c['contactPerson'],
          'email': c['email'],
          'phone': c['phone'],
          'address': c['address'],
          'city': c['city'],
          'latitude': (c['latitude'] as num?)?.toDouble(),
          'longitude': (c['longitude'] as num?)?.toDouble(),
          'is_active': (c['isActive'] == false) ? 0 : 1,
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }
    await batch.commit(noResult: true);
  }

  static Future<List<Map<String, dynamic>>> getCachedCustomers({String? search}) async {
    final db = await database;
    if (search != null && search.isNotEmpty) {
      return await db.query(
        'cached_customers',
        where: 'name LIKE ? OR phone LIKE ? OR city LIKE ?',
        whereArgs: ['%$search%', '%$search%', '%$search%'],
        orderBy: 'name ASC',
      );
    }
    return await db.query('cached_customers', orderBy: 'name ASC');
  }

  // --- Offline Orders Queue ---
  static Future<void> insertOfflineOrder(Map<String, dynamic> order) async {
    final db = await database;
    await db.insert('offline_orders_queue', order, conflictAlgorithm: ConflictAlgorithm.replace);
  }

  static Future<List<Map<String, dynamic>>> getPendingOrders() async {
    final db = await database;
    return await db.query(
      'offline_orders_queue',
      where: 'sync_status = ?',
      whereArgs: ['PendingSync'],
      orderBy: 'created_at ASC',
    );
  }

  static Future<List<Map<String, dynamic>>> getAllOfflineOrders() async {
    final db = await database;
    return await db.query('offline_orders_queue', orderBy: 'created_at DESC');
  }

  static Future<void> updateOrderStatus(String localId, String status, {String? errorMessage}) async {
    final db = await database;
    await db.update(
      'offline_orders_queue',
      {'sync_status': status, 'error_message': errorMessage},
      where: 'local_id = ?',
      whereArgs: [localId],
    );
  }

  // --- Offline Visits Queue ---
  static Future<void> insertOfflineVisit(Map<String, dynamic> visit) async {
    final db = await database;
    await db.insert('offline_visits_queue', visit, conflictAlgorithm: ConflictAlgorithm.replace);
  }

  static Future<List<Map<String, dynamic>>> getPendingVisits() async {
    final db = await database;
    return await db.query(
      'offline_visits_queue',
      where: 'sync_status = ?',
      whereArgs: ['PendingSync'],
      orderBy: 'visited_at ASC',
    );
  }

  static Future<List<Map<String, dynamic>>> getAllOfflineVisits() async {
    final db = await database;
    return await db.query('offline_visits_queue', orderBy: 'visited_at DESC');
  }

  static Future<void> updateVisitStatus(String localId, String status, {String? errorMessage}) async {
    final db = await database;
    await db.update(
      'offline_visits_queue',
      {'sync_status': status, 'error_message': errorMessage},
      where: 'local_id = ?',
      whereArgs: [localId],
    );
  }

  // --- Clear / Reset ---
  static Future<void> clearAll() async {
    final db = await database;
    await db.delete('cached_products');
    await db.delete('cached_customers');
    await db.delete('offline_orders_queue');
    await db.delete('offline_visits_queue');
  }
}
