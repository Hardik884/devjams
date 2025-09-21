import '../models/portfolio_data.dart';

class PortfolioService {
  // Fetch portfolio data for a given timeframe
  Future<PortfolioData> fetchPortfolioData({String timeframe = '1Y'}) async {
    await Future.delayed(const Duration(milliseconds: 500));

    Map<String, List<double>> performanceMap = {
      "1M": [100000, 102000, 101500, 103000, 104500],
      "3M": [95000, 97000, 99000, 100500, 102000, 104000, 105000],
      "6M": [90000, 92000, 94000, 96000, 98000, 100000, 102000, 104000],
      "1Y": [80000, 82000, 84000, 90000, 95000, 97000, 102000, 103220],
    };

    final holdings = [
      AssetData(
          symbol: 'SPY',
          name: 'SPDR S&P 500 ETF',
          value: 43247.32,
          percentage: 41.0,
          changePercent: 2.34,
          iconUrl: ''),
      AssetData(
          symbol: 'QQQ',
          name: 'Invesco QQQ ETF',
          value: 29166.54,
          percentage: 27.7,
          changePercent: 1.87,
          iconUrl: ''),
      AssetData(
          symbol: 'VTI',
          name: 'Vanguard Total Stock',
          value: 18975.60,
          percentage: 18.0,
          changePercent: -0.45,
          iconUrl: ''),
      AssetData(
          symbol: 'BND',
          name: 'Vanguard Total Bond',
          value: 14030.54,
          percentage: 13.3,
          changePercent: 0.12,
          iconUrl: ''),
    ];

    double totalValue = holdings.fold(0, (sum, h) => sum + h.value);
    double valueChange = 8420;
    double valueChangePercent =
        (valueChange / (totalValue - valueChange)) * 100;

    return PortfolioData(
      totalValue: totalValue,
      valueChange: valueChange,
      valueChangePercent: valueChangePercent,
      riskScore: 6,
      performanceHistory: performanceMap, // return all timeframes
      holdings: holdings,
    );
  }
}
