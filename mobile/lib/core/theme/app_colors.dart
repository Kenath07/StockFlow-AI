import 'package:flutter/material.dart';

class AppColors {
  // Brand Warm Paper Theme (Matches frontend-web index.css)
  static const Color paperBg = Color(0xFFF7F6F0);
  static const Color paperSurface = Color(0xFFFFFFFF);
  static const Color paperBorder = Color(0xFFE7E5E4); // stone-200
  static const Color paperBorderDark = Color(0xFFD6D3D1); // stone-300
  
  // Dark Backgrounds
  static const Color darkBg = Color(0xFF121110);
  static const Color darkSurface = Color(0xFF1C1917); // stone-900
  static const Color darkBorder = Color(0xFF292524); // stone-800
  static const Color darkCard = Color(0xFF1E1B18);

  // Brand Accents
  static const Color primary = Color(0xFFF97316); // orange-500
  static const Color primaryHover = Color(0xFFEA580C); // orange-600
  static const Color primaryLight = Color(0xFFFFF7ED); // orange-50
  static const Color primaryGlow = Color(0x33F97316);

  static const Color secondary = Color(0xFFF59E0B); // amber-500
  static const Color secondaryLight = Color(0xFFFEF3C7); // amber-100

  // Semantic Colors
  static const Color success = Color(0xFF10B981); // emerald-500
  static const Color successLight = Color(0xFFECFDF5); // emerald-50
  static const Color successText = Color(0xFF065F46); // emerald-800

  static const Color warning = Color(0xFFF59E0B); // amber-500
  static const Color warningLight = Color(0xFFFFFBEB); // amber-50
  static const Color warningText = Color(0xFF92400E); // amber-800

  static const Color error = Color(0xFFEF4444); // red-500
  static const Color errorLight = Color(0xFFFEF2F2); // red-50
  static const Color errorText = Color(0xFF991B1B); // red-800

  static const Color info = Color(0xFF0EA5E9); // sky-500
  static const Color infoLight = Color(0xFFF0F9FF); // sky-50
  static const Color infoText = Color(0xFF075985); // sky-800

  static const Color neutralDark = Color(0xFF0F172A); // slate-900 / stone-900
  static const Color neutralText = Color(0xFF1E293B); // slate-800
  static const Color neutralMuted = Color(0xFF64748B); // slate-500
  static const Color neutralSubtle = Color(0xFF94A3B8); // slate-400
}
