import 'package:dio/dio.dart';
import '../config/api_config.dart';
import '../storage/secure_vault.dart';

class ApiClient {
  static Dio? _dio;

  static Future<Dio> getDio() async {
    if (_dio != null) {
      final baseUrl = await ApiConfig.getBaseUrl();
      _dio!.options.baseUrl = baseUrl;
      return _dio!;
    }

    final baseUrl = await ApiConfig.getBaseUrl();
    _dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 12),
        receiveTimeout: const Duration(seconds: 12),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // Add JWT Token Interceptor
    _dio!.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await SecureVault.getToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException e, handler) {
          return handler.next(e);
        },
      ),
    );

    return _dio!;
  }

  // GET
  static Future<Response> get(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) async {
    final dio = await getDio();
    return await dio.get(path, queryParameters: queryParameters);
  }

  // POST
  static Future<Response> post(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
  }) async {
    final dio = await getDio();
    return await dio.post(path, data: data, queryParameters: queryParameters);
  }

  // PUT
  static Future<Response> put(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
  }) async {
    final dio = await getDio();
    return await dio.put(path, data: data, queryParameters: queryParameters);
  }

  // DELETE
  static Future<Response> delete(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) async {
    final dio = await getDio();
    return await dio.delete(path, queryParameters: queryParameters);
  }
}
