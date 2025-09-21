import 'package:flutter/material.dart';
import '../models/analytics_models.dart';
import '../utils/app_colors.dart';
import '../models/portfolio_data.dart'; // Import the correct AssetData class

class AnalyticsService {
  // Singleton pattern (optional)
  static final AnalyticsService _instance = AnalyticsService._internal();
  factory AnalyticsService() => _instance;
  AnalyticsService._internal();

  // ----------------- Dummy Earnings Data -----------------
  List<EarningsData> getEarningsData() {
    return [
      EarningsData(period: 'W', amount: 2800.0),
      EarningsData(period: 'M', amount: 4200.0),
      EarningsData(period: '3M', amount: 6800.0),
      EarningsData(period: '6M', amount: 8900.0),
      EarningsData(period: 'Y', amount: 12045.0),
    ];
  }

  // ----------------- Dummy Portfolio Performance Data -----------------
  List<double> getPortfolioPerformanceData() {
    return [
      8000, 9200, 8800, 10500, 12000, 11500, 13200, 14800, 16200, 15800, 17100, 17258
    ];
  }

  // ----------------- Dummy Featured Assets -----------------
  List<AssetData> getFeaturedAssets() {
    return [
      AssetData(
        symbol: 'ETH',
        name: 'Ethereum',
        value: 3646.5,
        percentage: 15.2,
        changePercent: 9.23,
        iconUrl: '',
      ),
      AssetData(
        symbol: 'USDT',
        name: 'Tether',
        value: 2969.69,
        percentage: 12.4,
        changePercent: 0.96,
        iconUrl: '',
      ),
      AssetData(
        symbol: 'BNB',
        name: 'Binance Coin',
        value: 6185.3,
        percentage: 25.8,
        changePercent: -2.14,
        iconUrl: '',
      ),
    ];
  }

  // ... (rest of the file)
}