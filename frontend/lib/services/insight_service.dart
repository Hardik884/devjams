import '../models/insight_models.dart';

class InsightService {
  // Singleton pattern for a single instance
  static final InsightService _instance = InsightService._internal();
  factory InsightService() => _instance;
  InsightService._internal();

  // Public methods to be used by the UI. They simulate a real API call.
  Future<List<RiskReturnPoint>> getRiskReturnScatter() async {
    // Simulate network delay
    await Future.delayed(const Duration(milliseconds: 700));
    return _getMockRiskReturnData();
  }

  Future<List<CorrelationData>> getCorrelationHeatmap() async {
    await Future.delayed(const Duration(milliseconds: 700));
    return _getMockCorrelationData();
  }

  Future<List<FeeReturnData>> getFeesVsReturn() async {
    await Future.delayed(const Duration(milliseconds: 700));
    return _getMockFeesReturnData();
  }

  Future<List<WhatIfScenario>> getWhatIfScenarios() async {
    await Future.delayed(const Duration(milliseconds: 700));
    return _getMockWhatIfData();
  }

  // Private methods containing the mock data. These are easy to replace.
  List<RiskReturnPoint> _getMockRiskReturnData() {
    return [
      RiskReturnPoint(asset: "NIFTY", risk: 0.12, returnRate: 0.18),
      RiskReturnPoint(asset: "Gold", risk: 0.05, returnRate: 0.07),
      RiskReturnPoint(asset: "BankNIFTY", risk: 0.20, returnRate: 0.25),
      RiskReturnPoint(asset: "Crypto", risk: 0.50, returnRate: 0.40),
    ];
  }

  List<CorrelationData> _getMockCorrelationData() {
    return [
      CorrelationData(asset1: "NIFTY", asset2: "BankNIFTY", correlation: 0.85),
      CorrelationData(asset1: "NIFTY", asset2: "Gold", correlation: -0.2),
      CorrelationData(asset1: "BankNIFTY", asset2: "Gold", correlation: -0.1),
    ];
  }

  List<FeeReturnData> _getMockFeesReturnData() {
    return [
      FeeReturnData(asset: "ETF A", fees: 0.01, returns: 0.15),
      FeeReturnData(asset: "ETF B", fees: 0.02, returns: 0.17),
      FeeReturnData(asset: "ETF C", fees: 0.005, returns: 0.12),
      FeeReturnData(asset: "ETF D", fees: 0.015, returns: 0.18),
    ];
  }

  List<WhatIfScenario> _getMockWhatIfData() {
    return [
      WhatIfScenario(scenarioName: "Aggressive", expectedReturn: 0.20, risk: 0.25),
      WhatIfScenario(scenarioName: "Balanced", expectedReturn: 0.12, risk: 0.12),
      WhatIfScenario(scenarioName: "Conservative", expectedReturn: 0.07, risk: 0.05),
      WhatIfScenario(scenarioName: "High-Growth", expectedReturn: 0.35, risk: 0.40),
    ];
  }
}