import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/shared/widgets/custom_button.dart';
import 'package:mobile/shared/widgets/empty_state.dart';
import 'package:mobile/shared/widgets/metric_card.dart';
import 'package:mobile/shared/widgets/status_badge.dart';

void main() {
  group('Shared Widgets UI Tests', () {
    testWidgets('CustomButton renders text and triggers callback', (WidgetTester tester) async {
      bool tapped = false;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomButton(
              text: 'Confirm Order',
              onPressed: () => tapped = true,
            ),
          ),
        ),
      );

      expect(find.text('Confirm Order'), findsOneWidget);
      await tester.tap(find.text('Confirm Order'));
      expect(tapped, isTrue);
    });

    testWidgets('CustomButton shows CircularProgressIndicator when isLoading', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomButton(
              text: 'Processing',
              isLoading: true,
              onPressed: () {},
            ),
          ),
        ),
      );

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('StatusBadge displays correct status text and color', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: StatusBadge(status: 'Confirmed'),
          ),
        ),
      );

      expect(find.text('Confirmed'), findsOneWidget);
    });

    testWidgets('EmptyStateWidget renders icon, title and description', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: EmptyStateWidget(
              icon: Icons.inventory_2_outlined,
              title: 'No Products Found',
              message: 'Try scanning a different barcode or searching.',
            ),
          ),
        ),
      );

      expect(find.text('No Products Found'), findsOneWidget);
      expect(find.text('Try scanning a different barcode or searching.'), findsOneWidget);
      expect(find.byIcon(Icons.inventory_2_outlined), findsOneWidget);
    });

    testWidgets('MetricCard displays title, value and subtitle', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: MetricCard(
              title: 'Active Orders',
              value: '12',
              subtitle: '+3 today',
              icon: Icons.shopping_bag_outlined,
            ),
          ),
        ),
      );

      expect(find.text('Active Orders'), findsOneWidget);
      expect(find.text('12'), findsOneWidget);
      expect(find.text('+3 today'), findsOneWidget);
    });
  });
}
