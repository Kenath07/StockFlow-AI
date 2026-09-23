import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../features/auth/models/user_session.dart';

class SecureVault {
  static const FlutterSecureStorage _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  static const String _tokenKey = 'jwt_token';
  static const String _userKey = 'user_session_json';
  static const String _onboardingKey = 'has_seen_onboarding';

  // Save Token
  static Future<void> saveToken(String token) async {
    try {
      await _storage.write(key: _tokenKey, value: token);
    } catch (_) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_tokenKey, token);
    }
  }

  // Get Token
  static Future<String?> getToken() async {
    try {
      return await _storage.read(key: _tokenKey);
    } catch (_) {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(_tokenKey);
    }
  }

  // Save User Session
  static Future<void> saveUserSession(UserSession session) async {
    final jsonStr = jsonEncode(session.toJson());
    try {
      await _storage.write(key: _userKey, value: jsonStr);
    } catch (_) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_userKey, jsonStr);
    }
  }

  // Get User Session
  static Future<UserSession?> getUserSession() async {
    String? jsonStr;
    try {
      jsonStr = await _storage.read(key: _userKey);
    } catch (_) {
      final prefs = await SharedPreferences.getInstance();
      jsonStr = prefs.getString(_userKey);
    }

    if (jsonStr == null || jsonStr.isEmpty) return null;
    try {
      return UserSession.fromJson(jsonDecode(jsonStr));
    } catch (_) {
      return null;
    }
  }

  // Onboarding status
  static Future<bool> hasSeenOnboarding() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_onboardingKey) ?? false;
  }

  static Future<void> setSeenOnboarding(bool seen) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_onboardingKey, seen);
  }

  // Clear session (Logout)
  static Future<void> clearSession() async {
    try {
      await _storage.delete(key: _tokenKey);
      await _storage.delete(key: _userKey);
    } catch (_) {}
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
  }
}
