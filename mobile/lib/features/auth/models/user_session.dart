class UserSession {
  final String token;
  final String? refreshToken;
  final String username;
  final String fullName;
  final String role; // FieldSales | Admin | Manager | Storekeeper
  final String? region;
  final String? agentId;
  final DateTime? expiresAt;

  UserSession({
    required this.token,
    this.refreshToken,
    required this.username,
    required this.fullName,
    required this.role,
    this.region,
    this.agentId,
    this.expiresAt,
  });

  bool get isFieldSales => role.toLowerCase() == 'fieldsales';
  bool get isStorekeeper => role.toLowerCase() == 'storekeeper';

  UserSession copyWith({
    String? token,
    String? refreshToken,
    String? username,
    String? fullName,
    String? role,
    String? region,
    String? agentId,
    DateTime? expiresAt,
  }) {
    return UserSession(
      token: token ?? this.token,
      refreshToken: refreshToken ?? this.refreshToken,
      username: username ?? this.username,
      fullName: fullName ?? this.fullName,
      role: role ?? this.role,
      region: region ?? this.region,
      agentId: agentId ?? this.agentId,
      expiresAt: expiresAt ?? this.expiresAt,
    );
  }

  factory UserSession.fromJson(Map<String, dynamic> json) {
    return UserSession(
      token: json['token'] ?? '',
      refreshToken: json['refreshToken'],
      username: json['username'] ?? '',
      fullName: json['fullName'] ?? json['username'] ?? '',
      role: json['role'] ?? 'FieldSales',
      region: json['region'] ?? 'Western Province',
      agentId: json['agentId'],
      expiresAt: json['expiresAt'] != null
          ? DateTime.tryParse(json['expiresAt'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'token': token,
      'refreshToken': refreshToken,
      'username': username,
      'fullName': fullName,
      'role': role,
      'region': region,
      'agentId': agentId,
      'expiresAt': expiresAt?.toIso8601String(),
    };
  }
}
