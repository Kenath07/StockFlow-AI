import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/main.dart';

void main() {
  testWidgets('StockFlow mobile smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: StockFlowMobileApp(),
      ),
    );
    expect(find.byType(StockFlowMobileApp), findsOneWidget);
    await tester.pumpAndSettle(const Duration(seconds: 3));
  });
}
