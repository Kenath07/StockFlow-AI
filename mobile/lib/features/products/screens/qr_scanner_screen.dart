import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../../core/theme/app_colors.dart';
import '../providers/products_provider.dart';
import 'product_detail_screen.dart';

class QrScannerScreen extends ConsumerStatefulWidget {
  final bool returnProductOnScan;

  const QrScannerScreen({super.key, this.returnProductOnScan = false});

  @override
  ConsumerState<QrScannerScreen> createState() => _QrScannerScreenState();
}

class _QrScannerScreenState extends ConsumerState<QrScannerScreen> {
  final MobileScannerController _cameraController = MobileScannerController();
  final TextEditingController _manualInputController = TextEditingController();
  bool _isTorchOn = false;
  bool _hasScanned = false;

  @override
  void dispose() {
    _cameraController.dispose();
    _manualInputController.dispose();
    super.dispose();
  }

  Future<void> _handleBarcodeDetected(String rawCode) async {
    if (_hasScanned) return;
    _hasScanned = true;

    final cleanCode = rawCode.trim();
    final product =
        await ref.read(productsProvider.notifier).lookupBarcode(cleanCode);

    if (!mounted) return;

    if (product != null) {
      if (widget.returnProductOnScan) {
        Navigator.pop(context, product);
      } else {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => ProductDetailScreen(product: product),
          ),
        );
      }
    } else {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Row(
            children: [
              Icon(Icons.warning_amber_rounded, color: AppColors.warning),
              SizedBox(width: 8),
              Text('Product Not Found'),
            ],
          ),
          content: Text(
            'Scanned Barcode: $cleanCode\n\nNo product is registered with this barcode in online database or local SQLite cache.',
            style: const TextStyle(fontSize: 13, height: 1.4),
          ),
          actions: [
            ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx);
                if (mounted) setState(() => _hasScanned = false);
              },
              child: const Text('Scan Again'),
            ),
          ],
        ),
      );
    }
  }

  void _showManualInputDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Enter SKU or Barcode'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Type a product SKU or barcode to test lookup:',
              style: TextStyle(fontSize: 13, color: AppColors.neutralMuted),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _manualInputController,
              decoration: const InputDecoration(
                hintText: 'e.g. BEV-001 or 4790001001001',
              ),
              autofocus: true,
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 6,
              children: [
                ActionChip(
                  label: const Text('BEV-001'),
                  onPressed: () => _manualInputController.text = 'BEV-001',
                ),
                ActionChip(
                  label: const Text('DAI-002'),
                  onPressed: () => _manualInputController.text = 'DAI-002',
                ),
                ActionChip(
                  label: const Text('STP-003'),
                  onPressed: () => _manualInputController.text = 'STP-003',
                ),
              ],
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              final code = _manualInputController.text.trim();
              Navigator.pop(ctx);
              if (code.isNotEmpty) {
                _handleBarcodeDetected(code);
              }
            },
            child: const Text('Lookup'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: const Text(
          'Scan QR / 1D Barcode',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: Icon(
              _isTorchOn ? Icons.flash_on : Icons.flash_off,
              color: _isTorchOn ? AppColors.secondary : Colors.white,
            ),
            onPressed: () async {
              await _cameraController.toggleTorch();
              setState(() => _isTorchOn = !_isTorchOn);
            },
          ),
          IconButton(
            icon: const Icon(Icons.flip_camera_ios, color: Colors.white),
            onPressed: () => _cameraController.switchCamera(),
          ),
        ],
      ),
      body: Stack(
        alignment: Alignment.center,
        children: [
          // Camera View
          MobileScanner(
            controller: _cameraController,
            onDetect: (capture) {
              final barcodes = capture.barcodes;
              for (final barcode in barcodes) {
                if (barcode.rawValue != null) {
                  _handleBarcodeDetected(barcode.rawValue!);
                  break;
                }
              }
            },
          ),

          // Viewfinder Overlay Box
          Container(
            width: 260,
            height: 260,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.primary, width: 3),
            ),
            child: Stack(
              children: [
                // Top Left Corner
                Positioned(
                  top: 0,
                  left: 0,
                  child: Container(
                    width: 24,
                    height: 24,
                    decoration: const BoxDecoration(
                      border: Border(
                        top: BorderSide(color: Colors.white, width: 4),
                        left: BorderSide(color: Colors.white, width: 4),
                      ),
                    ),
                  ),
                ),
                // Top Right Corner
                Positioned(
                  top: 0,
                  right: 0,
                  child: Container(
                    width: 24,
                    height: 24,
                    decoration: const BoxDecoration(
                      border: Border(
                        top: BorderSide(color: Colors.white, width: 4),
                        right: BorderSide(color: Colors.white, width: 4),
                      ),
                    ),
                  ),
                ),
                // Bottom Left Corner
                Positioned(
                  bottom: 0,
                  left: 0,
                  child: Container(
                    width: 24,
                    height: 24,
                    decoration: const BoxDecoration(
                      border: Border(
                        bottom: BorderSide(color: Colors.white, width: 4),
                        left: BorderSide(color: Colors.white, width: 4),
                      ),
                    ),
                  ),
                ),
                // Bottom Right Corner
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    width: 24,
                    height: 24,
                    decoration: const BoxDecoration(
                      border: Border(
                        bottom: BorderSide(color: Colors.white, width: 4),
                        right: BorderSide(color: Colors.white, width: 4),
                      ),
                    ),
                  ),
                ),
                // Scanning Laser Indicator
                Center(
                  child: Container(
                    width: 230,
                    height: 2,
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withOpacity(0.9),
                          blurRadius: 8,
                          spreadRadius: 2,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Instructions at Bottom
          Positioned(
            bottom: 40,
            left: 20,
            right: 20,
            child: Column(
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.7),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white24),
                  ),
                  child: const Text(
                    'Align barcode or QR code inside the box',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                // Test / Manual Input Button
                ElevatedButton.icon(
                  onPressed: _showManualInputDialog,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: AppColors.neutralDark,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 20, vertical: 12),
                  ),
                  icon: const Icon(Icons.keyboard_alt_outlined, size: 18),
                  label: const Text('Enter SKU / Barcode Manually'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
