import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

class OfflineStatusBanner extends StatelessWidget {
  final int pendingCount;
  final VoidCallback? onSyncPressed;

  const OfflineStatusBanner({
    super.key,
    this.pendingCount = 0,
    this.onSyncPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFBEB), // amber-50
        border: const Border(
          bottom: BorderSide(color: Color(0xFFFDE68A), width: 1),
        ),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.cloud_off_rounded,
            color: AppColors.warning,
            size: 18,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              pendingCount > 0
                  ? 'Offline Mode — $pendingCount item(s) pending sync'
                  : 'Offline Mode — Changes will sync when online',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.warningText,
              ),
            ),
          ),
          if (onSyncPressed != null && pendingCount > 0)
            GestureDetector(
              onTap: onSyncPressed,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.warning,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text(
                  'Sync',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
