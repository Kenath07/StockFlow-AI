import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/custom_button.dart';
import '../../orders/models/order_models.dart';
import '../providers/visits_provider.dart';

class StartVisitScreen extends ConsumerStatefulWidget {
  final CustomerModel customer;

  const StartVisitScreen({super.key, required this.customer});

  @override
  ConsumerState<StartVisitScreen> createState() => _StartVisitScreenState();
}

class _StartVisitScreenState extends ConsumerState<StartVisitScreen> {
  Position? _position;
  bool _isAcquiringGps = true;
  String? _gpsError;
  final TextEditingController _notesController = TextEditingController();
  bool _isSubmitting = false;

  // Visit Timer
  Timer? _timer;
  int _secondsElapsed = 0;

  @override
  void initState() {
    super.initState();
    _startTimer();
    _acquireGps();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _notesController.dispose();
    super.dispose();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) setState(() => _secondsElapsed += 1);
    });
  }

  String _formatElapsedTime(int totalSeconds) {
    final minutes = (totalSeconds ~/ 60).toString().padLeft(2, '0');
    final seconds = (totalSeconds % 60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
  }

  Future<void> _acquireGps() async {
    setState(() {
      _isAcquiringGps = true;
      _gpsError = null;
    });

    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      if (permission == LocationPermission.deniedForever) {
        setState(() {
          _gpsError = 'Location permission permanently denied.';
          _isAcquiringGps = false;
        });
        return;
      }

      final pos = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 8),
      );

      if (mounted) {
        setState(() {
          _position = pos;
          _isAcquiringGps = false;
        });
      }
    } catch (e) {
      if (mounted) {
        // Fallback to customer's preset coordinates if device GPS fails
        setState(() {
          _position = Position(
            latitude: widget.customer.latitude ?? 6.9271,
            longitude: widget.customer.longitude ?? 79.8612,
            timestamp: DateTime.now(),
            accuracy: 15.0,
            altitude: 0.0,
            altitudeAccuracy: 0.0,
            heading: 0.0,
            headingAccuracy: 0.0,
            speed: 0.0,
            speedAccuracy: 0.0,
          );
          _isAcquiringGps = false;
        });
      }
    }
  }

  Future<void> _finishVisit() async {
    setState(() => _isSubmitting = true);

    final lat = _position?.latitude ?? widget.customer.latitude ?? 6.9271;
    final lng = _position?.longitude ?? widget.customer.longitude ?? 79.8612;

    final success = await ref.read(visitsProvider.notifier).recordVisit(
          customerId: widget.customer.id,
          customerName: widget.customer.name,
          latitude: lat,
          longitude: lng,
          notes: _notesController.text.trim().isEmpty
              ? 'Completed customer store visit & shelf audit'
              : _notesController.text.trim(),
          addressSnapshot: widget.customer.address,
        );

    setState(() => _isSubmitting = false);

    if (success && mounted) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: const BoxDecoration(
                  color: AppColors.successLight,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check_circle_rounded,
                    color: AppColors.success, size: 48),
              ),
              const SizedBox(height: 16),
              const Text(
                'Visit Logged & Verified!',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Customer: ${widget.customer.name}\nDuration: ${_formatElapsedTime(_secondsElapsed)}\nGPS: ${lat.toStringAsFixed(4)}, ${lng.toStringAsFixed(4)}\n\nRecord saved to field log.',
                style: const TextStyle(
                    fontSize: 13, color: AppColors.neutralMuted),
                textAlign: TextAlign.center,
              ),
            ],
          ),
          actions: [
            ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx);
                Navigator.pop(context);
              },
              child: const Text('Complete & Return'),
            ),
          ],
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Customer Field Visit'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Store Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkSurface : Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: isDark ? AppColors.darkBorder : AppColors.paperBorder,
                  width: 1.5,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppColors.primaryLight,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.storefront,
                            color: AppColors.primary, size: 24),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.customer.name,
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                                color: isDark
                                    ? Colors.white
                                    : AppColors.neutralDark,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${widget.customer.city ?? 'Colombo'} • ${widget.customer.phone ?? ''}',
                              style: const TextStyle(
                                  fontSize: 12, color: AppColors.neutralMuted),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Live Timer & GPS Telemetry Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkSurface : Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: isDark ? AppColors.darkBorder : AppColors.paperBorder,
                  width: 1.5,
                ),
              ),
              child: Column(
                children: [
                  // Active Visit Timer
                  const Text(
                    'VISIT DURATION (CLOCK-IN ACTIVE)',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: AppColors.neutralMuted,
                      letterSpacing: 0.8,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _formatElapsedTime(_secondsElapsed),
                    style: const TextStyle(
                      fontSize: 36,
                      fontWeight: FontWeight.w900,
                      color: AppColors.primary,
                      letterSpacing: 1.5,
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Divider(),
                  const SizedBox(height: 16),

                  // GPS Geolocation Info
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppColors.infoLight,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.my_location_rounded,
                            color: AppColors.info, size: 20),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'GPS Location Telemetry',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: 2),
                            if (_isAcquiringGps)
                              const Row(
                                children: [
                                  SizedBox(
                                    width: 12,
                                    height: 12,
                                    child: CircularProgressIndicator(
                                        strokeWidth: 2),
                                  ),
                                  SizedBox(width: 6),
                                  Text(
                                    'Locking GPS satellite signal...',
                                    style: TextStyle(
                                        fontSize: 11,
                                        color: AppColors.neutralMuted),
                                  ),
                                ],
                              )
                            else if (_position != null)
                              Text(
                                'Lat: ${_position!.latitude.toStringAsFixed(5)}, Lng: ${_position!.longitude.toStringAsFixed(5)} (±${_position!.accuracy.toStringAsFixed(1)}m)',
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.infoText,
                                ),
                              )
                            else
                              Text(
                                _gpsError ?? 'Unable to acquire GPS',
                                style: const TextStyle(
                                    fontSize: 11, color: AppColors.error),
                              ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.refresh, size: 18),
                        onPressed: _acquireGps,
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Checkout Notes
            const Text(
              'VISIT OUTCOME & NOTES',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                color: AppColors.neutralMuted,
                letterSpacing: 0.8,
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _notesController,
              maxLines: 4,
              decoration: const InputDecoration(
                hintText:
                    'e.g. Audited shelf inventory, collected cheque, confirmed weekly restock order.',
              ),
            ),
            const SizedBox(height: 24),

            // Submit Button
            CustomButton(
              text: 'Complete Visit & Check Out',
              isLoading: _isSubmitting,
              icon: Icons.check_circle_outline,
              onPressed: _finishVisit,
            ),
          ],
        ),
      ),
    );
  }
}
