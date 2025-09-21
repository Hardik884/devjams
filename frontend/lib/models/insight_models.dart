class RiskReturnPoint {
  final String asset;
  final double risk;   // x-axis
  final double returnRate; // y-axis

  RiskReturnPoint({required this.asset, required this.risk, required this.returnRate});
}

class CorrelationData {
  final String asset1;
  final String asset2;
  final double correlation;

  CorrelationData({required this.asset1, required this.asset2, required this.correlation});
}

class FeeReturnData {
  final String asset;
  final double fees;
  final double returns;

  FeeReturnData({required this.asset, required this.fees, required this.returns});
}

class WhatIfScenario {
  final String scenarioName;
  final double expectedReturn;
  final double risk;

  WhatIfScenario({
    required this.scenarioName,
    required this.expectedReturn,
    required this.risk,
  });
}