// ----------------------------
// Portfolio Data Model
// ----------------------------
class PortfolioData {
  final double totalValue;
  final double valueChange;
  final double valueChangePercent;
  final int riskScore;

  // Support multiple timeframes for performance chart
  final Map<String, List<double>> performanceHistory;
  final List<AssetData> holdings;

  const PortfolioData({
    required this.totalValue,
    required this.valueChange,
    required this.valueChangePercent,
    required this.riskScore,
    this.performanceHistory = const {},
    this.holdings = const [],
  });

  bool get isPositiveChange => valueChange >= 0;

  String get formattedTotalValue =>
      '\$${totalValue.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')}';

  String get formattedValueChange =>
      '${isPositiveChange ? '+' : ''}\$${valueChange.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')}';

  String get formattedValueChangePercent =>
      '${isPositiveChange ? '+' : ''}${valueChangePercent.toStringAsFixed(1)}%';

  PortfolioData copyWith({
    double? totalValue,
    double? valueChange,
    double? valueChangePercent,
    int? riskScore,
    Map<String, List<double>>? performanceHistory,
    List<AssetData>? holdings,
  }) {
    return PortfolioData(
      totalValue: totalValue ?? this.totalValue,
      valueChange: valueChange ?? this.valueChange,
      valueChangePercent: valueChangePercent ?? this.valueChangePercent,
      riskScore: riskScore ?? this.riskScore,
      performanceHistory: performanceHistory ?? this.performanceHistory,
      holdings: holdings ?? this.holdings,
    );
  }
}

// ----------------------------
// AssetData for holdings
// ----------------------------
class AssetData {
  final String symbol;
  final String name;
  final double value;
  final double percentage;
  final double changePercent;
  final String iconUrl;

  const AssetData({
    required this.symbol,
    required this.name,
    required this.value,
    required this.percentage,
    required this.changePercent,
    required this.iconUrl,
  });

  bool get isPositiveChange => changePercent >= 0;

  String get formattedValue =>
      '\$${value.toStringAsFixed(2).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')}';

  String get formattedChangePercent =>
      '${isPositiveChange ? '+' : ''}${changePercent.toStringAsFixed(2)}%';

  String get formattedPercentage => '${percentage.toStringAsFixed(1)}%';
}
