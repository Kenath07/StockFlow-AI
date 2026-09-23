import 'package:intl/intl.dart';

class CurrencyFormatter {
  static final NumberFormat _formatter = NumberFormat.currency(
    locale: 'en_LK',
    symbol: 'Rs. ',
    decimalDigits: 2,
  );

  static final NumberFormat _compactFormatter = NumberFormat.compactCurrency(
    locale: 'en_LK',
    symbol: 'Rs. ',
    decimalDigits: 1,
  );

  static String format(num? amount) {
    if (amount == null) return 'Rs. 0.00';
    return _formatter.format(amount);
  }

  static String formatCompact(num? amount) {
    if (amount == null) return 'Rs. 0';
    return _compactFormatter.format(amount);
  }
}
