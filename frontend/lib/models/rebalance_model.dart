enum RebalanceAction { buy, sell, hold }

class RebalanceRecommendation {
  final String symbol;
  final String name;
  final double currentWeight;
  final double targetWeight;
  final double amount;
  final RebalanceAction action;
  final String reason;

  RebalanceRecommendation({
    required this.symbol,
    required this.name,
    required this.currentWeight,
    required this.targetWeight,
    required this.amount,
    required this.action,
    required this.reason,
  });

  String get actionString {
    switch (action) {
      case RebalanceAction.buy:
        return 'BUY';
      case RebalanceAction.sell:
        return 'SELL';
      case RebalanceAction.hold:
        return 'HOLD';
    }
  }

  String get formattedAmount => '\$${amount.toStringAsFixed(2)}';
  String get formattedPercentage =>
      '${(targetWeight - currentWeight).toStringAsFixed(1)}%';

  double get difference => (targetWeight - currentWeight).abs();
}