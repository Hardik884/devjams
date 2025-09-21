// lib/models/stock_data_model.dart
class StockQuote {
  final double currentPrice;
  final double change;
  final double percentChange;
  final double high;
  final double low;
  final double open;
  final double previousClose;

  StockQuote({
    required this.currentPrice,
    required this.change,
    required this.percentChange,
    required this.high,
    required this.low,
    required this.open,
    required this.previousClose,
  });

  factory StockQuote.fromJson(Map<String, dynamic> json) {
    return StockQuote(
      currentPrice: (json['c'] as num).toDouble(),
      change: (json['d'] as num).toDouble(),
      percentChange: (json['dp'] as num).toDouble(),
      high: (json['h'] as num).toDouble(),
      low: (json['l'] as num).toDouble(),
      open: (json['o'] as num).toDouble(),
      previousClose: (json['pc'] as num).toDouble(),
    );
  }
}

class HistoricalDataPoint {
  final int timestamp;
  final double open;
  final double high;
  final double low;
  final double close;
  final int volume;

  HistoricalDataPoint({
    required this.timestamp,
    required this.open,
    required this.high,
    required this.low,
    required this.close,
    required this.volume,
  });

  factory HistoricalDataPoint.fromJson(Map<String, dynamic> json) {
    return HistoricalDataPoint(
      timestamp: json['t'] as int,
      open: (json['o'] as num).toDouble(),
      high: (json['h'] as num).toDouble(),
      low: (json['l'] as num).toDouble(),
      close: (json['c'] as num).toDouble(),
      volume: (json['v'] as num).toInt(),
    );
  }
}

class CompanyProfile {
  final String ticker;
  final String name;
  final String exchange;
  final String ipoDate;
  final double marketCapitalization;
  final double shareOutstanding;
  final String country;

  CompanyProfile({
    required this.ticker,
    required this.name,
    required this.exchange,
    required this.ipoDate,
    required this.marketCapitalization,
    required this.shareOutstanding,
    required this.country,
  });

  factory CompanyProfile.fromJson(Map<String, dynamic> json) {
    return CompanyProfile(
      ticker: json['ticker'] as String,
      name: json['name'] as String,
      exchange: json['exchange'] as String,
      ipoDate: json['ipo'] as String,
      marketCapitalization: (json['marketCapitalization'] as num).toDouble(),
      shareOutstanding: (json['shareOutstanding'] as num).toDouble(),
      country: json['country'] as String,
    );
  }
}

class StockFundamentals {
  final int qualityRating;
  final String qualityDescription;
  final int valuationRating;
  final String valuationDescription;
  final int financeRating;
  final String financeDescription;
  final double oneYearReturn;
  final double sectorReturn;
  final double marketReturn;
  final double peRatio;
  final double priceToBookValue;

  StockFundamentals({
    required this.qualityRating,
    required this.qualityDescription,
    required this.valuationRating,
    required this.valuationDescription,
    required this.financeRating,
    required this.financeDescription,
    required this.oneYearReturn,
    required this.sectorReturn,
    required this.marketReturn,
    required this.peRatio,
    required this.priceToBookValue,
  });

  factory StockFundamentals.fromJson(Map<String, dynamic> json) {
    return StockFundamentals(
      qualityRating: (json['qualityRating'] as num).toInt(),
      qualityDescription: json['qualityDescription'] as String,
      valuationRating: (json['valuationRating'] as num).toInt(),
      valuationDescription: json['valuationDescription'] as String,
      financeRating: (json['financeRating'] as num).toInt(),
      financeDescription: json['financeDescription'] as String,
      oneYearReturn: (json['oneYearReturn'] as num).toDouble(),
      sectorReturn: (json['sectorReturn'] as num).toDouble(),
      marketReturn: (json['marketReturn'] as num).toDouble(),
      peRatio: (json['peRatio'] as num).toDouble(),
      priceToBookValue: (json['priceToBookValue'] as num).toDouble(),
    );
  }
}

class TechnicalData {
  final double rsi;
  final double macd;
  final String trend;

  TechnicalData({
    required this.rsi,
    required this.macd,
    required this.trend,
  });

  factory TechnicalData.fromJson(Map<String, dynamic> json) {
    return TechnicalData(
      rsi: (json['rsi'] as num).toDouble(),
      macd: (json['macd'] as num).toDouble(),
      trend: json['trend'] as String,
    );
  }
}

class DerivativesData {
  final int openInterest;
  final int volume;
  final String contractType;

  DerivativesData({
    required this.openInterest,
    required this.volume,
    required this.contractType,
  });

  factory DerivativesData.fromJson(Map<String, dynamic> json) {
    return DerivativesData(
      openInterest: (json['openInterest'] as num).toInt(),
      volume: (json['volume'] as num).toInt(),
      contractType: json['contractType'] as String,
    );
  }
}