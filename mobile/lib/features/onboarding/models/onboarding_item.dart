import 'package:flutter/material.dart';

class OnboardingItem {
  final String title;
  final String description;
  final String badgeText;
  final Color badgeColor;
  final int illustrationIndex;

  const OnboardingItem({
    required this.title,
    required this.description,
    required this.badgeText,
    required this.badgeColor,
    required this.illustrationIndex,
  });

  static const List<OnboardingItem> items = [
    OnboardingItem(
      title: 'Real-time Field Sales & Stock',
      description:
          'Empower your field operations with instant inventory checks, smart SKU lookup, and live LKR pricing on ground.',
      badgeText: 'Live Inventory',
      badgeColor: Color(0xFFF97316),
      illustrationIndex: 0,
    ),
    OnboardingItem(
      title: 'Smart Barcode & GPS Check-Ins',
      description:
          'Scan 1D barcodes and 2D QR codes in milliseconds. Log verified customer store visits with auto-captured GPS coordinates.',
      badgeText: 'Hardware Sensors',
      badgeColor: Color(0xFF0EA5E9),
      illustrationIndex: 1,
    ),
    OnboardingItem(
      title: 'Offline-First Resilience & Sync',
      description:
          'Book multi-line customer orders seamlessly with zero connectivity. Everything syncs automatically to PostgreSQL once online.',
      badgeText: 'Offline Engine',
      badgeColor: Color(0xFF10B981),
      illustrationIndex: 2,
    ),
  ];
}
