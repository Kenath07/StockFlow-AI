import 'package:flutter/material.dart';

class StatusBadge extends StatelessWidget {
  final String status;
  final bool isSmall;

  const StatusBadge({
    super.key,
    required this.status,
    this.isSmall = false,
  });

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color text;
    Color border;
    Color dot;

    switch (status.toLowerCase()) {
      case 'pending':
      case 'pendingsync':
        bg = const Color(0xFFFFFBEB); // amber-50
        text = const Color(0xFF92400E); // amber-800
        border = const Color(0xFFFDE68A); // amber-200
        dot = const Color(0xFFF59E0B); // amber-500
        break;
      case 'confirmed':
        bg = const Color(0xFFEFF6FF); // blue-50
        text = const Color(0xFF1E40AF); // blue-800
        border = const Color(0xFFBFDBFE); // blue-200
        dot = const Color(0xFF3B82F6); // blue-500
        break;
      case 'dispatched':
        bg = const Color(0xFFFFF7ED); // orange-50
        text = const Color(0xFF9A3412); // orange-800
        border = const Color(0xFFFED7AA); // orange-200
        dot = const Color(0xFFF97316); // orange-500
        break;
      case 'fulfilled':
      case 'synced':
      case 'active':
        bg = const Color(0xFFECFDF5); // emerald-50
        text = const Color(0xFF065F46); // emerald-800
        border = const Color(0xFFA7F3D0); // emerald-200
        dot = const Color(0xFF10B981); // emerald-500
        break;
      case 'cancelled':
      case 'failed':
      case 'inactive':
        bg = const Color(0xFFFEF2F2); // red-50
        text = const Color(0xFF991B1B); // red-800
        border = const Color(0xFFFECACA); // red-200
        dot = const Color(0xFFEF4444); // red-500
        break;
      default:
        bg = const Color(0xFFF8FAFC); // slate-50
        text = const Color(0xFF334155); // slate-700
        border = const Color(0xFFE2E8F0); // slate-200
        dot = const Color(0xFF64748B); // slate-500
    }

    String displayLabel = status;
    if (status == 'PendingSync') displayLabel = 'Queued Offline';
    if (status == 'Synced') displayLabel = 'Cloud Synced';

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isSmall ? 8 : 10,
        vertical: isSmall ? 2 : 4,
      ),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: border, width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: isSmall ? 5 : 6,
            height: isSmall ? 5 : 6,
            decoration: BoxDecoration(
              color: dot,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 5),
          Text(
            displayLabel,
            style: TextStyle(
              fontSize: isSmall ? 11 : 12,
              fontWeight: FontWeight.w600,
              color: text,
            ),
          ),
        ],
      ),
    );
  }
}
