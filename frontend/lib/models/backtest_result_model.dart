class BacktestResultModel {
  final String period;
  final double returnPercent;
  final double sharpeRatio;
  final double maxDrawdown;
  final double volatility;

  BacktestResultModel({
    required this.period,
    required this.returnPercent,
    required this.sharpeRatio,
    required this.maxDrawdown,
    required this.volatility,
  });

  String get formattedReturn => '${returnPercent.toStringAsFixed(2)}%';
  String get formattedSharpeRatio => sharpeRatio.toStringAsFixed(2);
  String get formattedMaxDrawdown => '${maxDrawdown.toStringAsFixed(2)}%';
  String get formattedVolatility => '${volatility.toStringAsFixed(2)}%';

  factory BacktestResultModel.fromJson(Map<String, dynamic> json) {
    return BacktestResultModel(
      period: json['period'],
      returnPercent: json['returnPercent'].toDouble(),
      sharpeRatio: json['sharpeRatio'].toDouble(),
      maxDrawdown: json['maxDrawdown'].toDouble(),
      volatility: json['volatility'].toDouble(),
    );
  }
}