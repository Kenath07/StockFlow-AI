import 'package:flutter/material.dart';
import 'app_colors.dart';

class GridBackgroundWidget extends StatelessWidget {
  final Widget child;
  final bool isDark;
  final double gridSize;
  final double opacity;

  const GridBackgroundWidget({
    super.key,
    required this.child,
    this.isDark = false,
    this.gridSize = 24.0,
    this.opacity = 0.05,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: isDark ? AppColors.darkBg : AppColors.paperBg,
      child: CustomPaint(
        painter: GridPainter(
          isDark: isDark,
          gridSize: gridSize,
          opacity: opacity,
        ),
        child: child,
      ),
    );
  }
}

class GridPainter extends CustomPainter {
  final bool isDark;
  final double gridSize;
  final double opacity;

  GridPainter({
    required this.isDark,
    required this.gridSize,
    required this.opacity,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = isDark
          ? Colors.white.withOpacity(opacity * 1.5)
          : Colors.black.withOpacity(opacity)
      ..strokeWidth = 1.0
      ..style = PaintingStyle.stroke;

    // Draw vertical lines
    for (double x = 0; x <= size.width; x += gridSize) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }

    // Draw horizontal lines
    for (double y = 0; y <= size.height; y += gridSize) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant GridPainter oldDelegate) {
    return oldDelegate.isDark != isDark ||
        oldDelegate.gridSize != gridSize ||
        oldDelegate.opacity != opacity;
  }
}
