import '../models/backtest_result_model.dart';

class BacktestService {
  Future<List<BacktestResultModel>> fetchBacktestResults() async {
    // TODO: Replace with real API call
    await Future.delayed(const Duration(milliseconds: 500));

    // Dummy data
    return [
      BacktestResultModel(period: '1M', returnPercent: 2.4, sharpeRatio: 1.12, maxDrawdown: -3.2, volatility: 12.4),
      BacktestResultModel(period: '3M', returnPercent: 8.7, sharpeRatio: 1.34, maxDrawdown: -5.8, volatility: 14.2),
      BacktestResultModel(period: '6M', returnPercent: 15.3, sharpeRatio: 1.45, maxDrawdown: -8.1, volatility: 16.7),
      BacktestResultModel(period: '1Y', returnPercent: 24.8, sharpeRatio: 1.62, maxDrawdown: -12.4, volatility: 18.9),
      BacktestResultModel(period: '2Y', returnPercent: 48.2, sharpeRatio: 1.58, maxDrawdown: -18.7, volatility: 19.3),
      BacktestResultModel(period: '5Y', returnPercent: 127.4, sharpeRatio: 1.71, maxDrawdown: -22.1, volatility: 17.8),
    ];
  }
}