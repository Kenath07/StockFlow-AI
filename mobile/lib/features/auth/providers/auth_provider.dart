import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/storage/secure_vault.dart';
import '../models/user_session.dart';

class AuthState {
  final bool isLoading;
  final UserSession? session;
  final String? errorMessage;

  const AuthState({this.isLoading = false, this.session, this.errorMessage});

  bool get isAuthenticated => session != null && session!.token.isNotEmpty;

  AuthState copyWith({
    bool? isLoading,
    UserSession? session,
    String? errorMessage,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      session: session ?? this.session,
      errorMessage: errorMessage,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(const AuthState()) {
    _loadStoredSession();
  }

  Future<void> _loadStoredSession() async {
    final session = await SecureVault.getUserSession();
    if (session != null) {
      state = state.copyWith(session: session);
    }
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, errorMessage: null);

    try {
      final response = await ApiClient.post(
        ApiEndpoints.login,
        data: {'email': email.trim(), 'password': password.trim()},
      );

      if (response.statusCode == 200 && response.data != null) {
        final data = response.data;
        var session = UserSession(
          token: data['token'] ?? '',
          refreshToken: data['refreshToken'],
          username: data['username'] ?? email,
          fullName: data['fullName'] ?? data['username'] ?? 'Field Officer',
          role: data['role'] ?? 'FieldSales',
          expiresAt: data['expiresAt'] != null
              ? DateTime.tryParse(data['expiresAt'].toString())
              : null,
        );

        await SecureVault.saveToken(session.token);

        // Fetch real agentId and region from /field/my-profile
        try {
          final profileRes = await ApiClient.get(ApiEndpoints.myProfile);
          if (profileRes.statusCode == 200 && profileRes.data != null) {
            final pData = profileRes.data;
            final realAgentId = pData['id']?.toString();
            final realRegion = pData['region']?.toString();
            if (realAgentId != null) {
              session = session.copyWith(
                agentId: realAgentId,
                region: realRegion ?? session.region,
              );
            }
          }
        } catch (_) {}

        await SecureVault.saveUserSession(session);

        state = state.copyWith(
          isLoading: false,
          session: session,
          errorMessage: null,
        );
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          errorMessage: 'Login failed. Please check your credentials.',
        );
        return false;
      }
    } catch (e) {
      // In case backend is unreachable or offline, allow mock login for demo field officer
      if (email.trim().toLowerCase() == 'officer@stockflow.ai' &&
          password.trim() == 'Officer@123') {
        final mockSession = UserSession(
          token: 'demo-offline-token-${DateTime.now().millisecondsSinceEpoch}',
          username: 'officer@stockflow.ai',
          fullName: 'Kamal Perera',
          role: 'FieldSales',
          region: 'Western Province',
          agentId: 'a1000000-0000-0000-0000-000000000001',
        );
        await SecureVault.saveToken(mockSession.token);
        await SecureVault.saveUserSession(mockSession);
        state = state.copyWith(
          isLoading: false,
          session: mockSession,
          errorMessage: null,
        );
        return true;
      }

      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Connection error: Unable to reach backend server.',
      );
      return false;
    }
  }

  Future<bool> register({
    required String fullName,
    required String username,
    required String email,
    required String password,
    String? phoneNumber,
    String role = 'FieldSales',
  }) async {
    state = state.copyWith(isLoading: true, errorMessage: null);

    try {
      final response = await ApiClient.post(
        ApiEndpoints.register,
        data: {
          'fullName': fullName.trim(),
          'username': username.trim(),
          'email': email.trim(),
          'password': password.trim(),
          'phoneNumber': phoneNumber?.trim() ?? '',
          'role': role,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        state = state.copyWith(isLoading: false, errorMessage: null);
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          errorMessage: 'Registration failed. Please verify your details.',
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage:
            'Registration error: Email or username may already exist.',
      );
      return false;
    }
  }

  Future<void> logout() async {
    await SecureVault.clearSession();
    state = const AuthState();
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});
