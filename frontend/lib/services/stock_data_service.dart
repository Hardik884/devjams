// lib/services/stock_data_service.dart
import '../models/stock_data_model.dart';

class StockDataService {
  Future<Map<String, dynamic>> fetchQuote(String symbol) async {
    await Future.delayed(const Duration(milliseconds: 200));
    return {
      'c': 150.25, 'd': -1.5, 'dp': -0.99, 'h': 152.00, 'l': 148.50, 'o': 151.75, 'pc': 151.75
    };
  }

  Future<List<Map<String, dynamic>>> fetchHistoricalData(String symbol, String resolution) async {
    await Future.delayed(const Duration(milliseconds: 200));
    return [
      {'t': 1678886400, 'o': 100.0, 'h': 105.0, 'l': 98.0, 'c': 103.0, 'v': 1000},
      {'t': 1678972800, 'o': 103.0, 'h': 108.0, 'l': 102.0, 'c': 106.0, 'v': 1200},
      {'t': 1679059200, 'o': 106.0, 'h': 109.0, 'l': 105.0, 'c': 107.5, 'v': 1100},
      {'t': 1679145600, 'o': 107.5, 'h': 115.0, 'l': 107.0, 'c': 113.2, 'v': 1500},
      {'t': 1679232000, 'o': 113.2, 'h': 114.5, 'l': 110.0, 'c': 111.8, 'v': 1300},
    ];
  }

  Future<Map<String, dynamic>> fetchCompanyProfile(String symbol) async {
    await Future.delayed(const Duration(milliseconds: 200));
    return {
      'ticker': symbol, 'name': 'Mock Company Inc.', 'exchange': 'NASDAQ', 'ipo': '2000-01-01',
      'marketCapitalization': 200000000000, 'shareOutstanding': 1000000000, 'country': 'USA',
    };
  }

  Future<Map<String, dynamic>> fetchFundamentals(String symbol) async {
    await Future.delayed(const Duration(milliseconds: 200));
    return {
      'qualityRating': 4, 'qualityDescription': 'Good Quality', 'valuationRating': 2, 'valuationDescription': 'Expensive Valuation',
      'financeRating': 1, 'financeDescription': 'Negative Finance Trends', 'oneYearReturn': -8.59,
      'sectorReturn': 6.64, 'marketReturn': -0.35, 'peRatio': 13.53, 'priceToBookValue': 1.91,
    };
  }

  Future<Map<String, dynamic>> fetchTechnicalData(String symbol) async {
    await Future.delayed(const Duration(milliseconds: 200));
    return {
      'rsi': 65.45,
      'macd': 2.15,
      'trend': 'Bullish',
    };
  }

  Future<Map<String, dynamic>> fetchDerivativesData(String symbol) async {
    await Future.delayed(const Duration(milliseconds: 200));
    return {
      'openInterest': 1234567,
      'volume': 543210,
      'contractType': 'Futures',
    };
  }
}