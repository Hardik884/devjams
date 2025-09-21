import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../services/insight_service.dart';
import '../models/insight_models.dart';
import '../utils/app_colors.dart';
import '../widgets/elevated_card.dart';

class PerformanceInsightsScreen extends StatefulWidget {
  const PerformanceInsightsScreen({super.key});

  @override
  State<PerformanceInsightsScreen> createState() =>
      _PerformanceInsightsScreenState();
}

class _PerformanceInsightsScreenState
    extends State<PerformanceInsightsScreen> {
  final InsightService _service = InsightService();

  late Future<List<RiskReturnPoint>> riskReturnFuture;
  late Future<List<CorrelationData>> correlationFuture;
  late Future<List<FeeReturnData>> feeReturnFuture;
  late Future<List<WhatIfScenario>> whatIfFuture;

  @override
  void initState() {
    super.initState();
    riskReturnFuture = _service.getRiskReturnScatter();
    correlationFuture = _service.getCorrelationHeatmap();
    feeReturnFuture = _service.getFeesVsReturn();
    whatIfFuture = _service.getWhatIfScenarios();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0x1F1E1E1E), // dark transparent background
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Screen title (removed ElevatedCard)
            const Center(
              child: Text(
                "📈 Performance Insights",
                style: TextStyle(
                  color: AppColors.darkText,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(height: 24),

            _buildSectionTitle("📊 Risk-Return Scatter"),
            const SizedBox(height: 8),
            _buildRiskReturnScatter(),
            const SizedBox(height: 24),

            _buildSectionTitle("🔥 Correlation Heatmap"),
            const SizedBox(height: 8),
            _buildCorrelationHeatmap(),
            const SizedBox(height: 24),

            _buildSectionTitle("💰 Fees vs Return"),
            const SizedBox(height: 8),
            _buildFeeReturnChart(),
            const SizedBox(height: 24),

            _buildSectionTitle("🤔 What-if Scenarios"),
            const SizedBox(height: 8),
            _buildWhatIfCards(),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.bold,
        color: AppColors.darkText,
      ),
    );
  }

  Widget _buildRiskReturnScatter() {
    return FutureBuilder<List<RiskReturnPoint>>(
      future: riskReturnFuture,
      builder: (context, snapshot) {
        if (!snapshot.hasData)
          return const Center(child: CircularProgressIndicator());

        final data = snapshot.data!;
        return ElevatedCard(
          padding: const EdgeInsets.all(16),
          height: 260,
          child: ScatterChart(
            ScatterChartData(
              scatterSpots: data
                  .map((e) => ScatterSpot(
                        e.risk,
                        e.returnRate,
                        dotPainter: FlDotCirclePainter(
                          radius: 6,
                          color: AppColors.primary,
                          strokeWidth: 0,
                        ),
                      ))
                  .toList(),
              titlesData: FlTitlesData(
                leftTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    reservedSize: 40,
                    getTitlesWidget: (value, meta) => Text(
                      value.toStringAsFixed(1),
                      style: const TextStyle(
                          color: AppColors.darkText, fontSize: 12),
                    ),
                  ),
                ),
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    reservedSize: 40,
                    getTitlesWidget: (value, meta) => Text(
                      value.toStringAsFixed(1),
                      style: const TextStyle(
                          color: AppColors.darkText, fontSize: 12),
                    ),
                  ),
                ),
              ),
              borderData: FlBorderData(
                show: true,
                border: const Border(
                  left: BorderSide(color: Colors.white54),
                  bottom: BorderSide(color: Colors.white54),
                  top: BorderSide(color: Colors.transparent),
                  right: BorderSide(color: Colors.transparent),
                ),
              ),
              gridData: FlGridData(
                show: true,
                drawHorizontalLine: true,
                drawVerticalLine: true,
                getDrawingHorizontalLine: (_) =>
                    const FlLine(color: Colors.white12, strokeWidth: 1),
                getDrawingVerticalLine: (_) =>
                    const FlLine(color: Colors.white12, strokeWidth: 1),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildCorrelationHeatmap() {
    return FutureBuilder<List<CorrelationData>>(
      future: correlationFuture,
      builder: (context, snapshot) {
        if (!snapshot.hasData)
          return const Center(child: CircularProgressIndicator());

        final data = snapshot.data!;
        return ElevatedCard(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: data
                .map((e) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: const Icon(Icons.grid_3x3,
                            color: AppColors.warning),
                        title: Text("${e.asset1} ↔ ${e.asset2}",
                            style: const TextStyle(color: AppColors.darkText)),
                        subtitle: Text(
                            "Correlation: ${e.correlation.toStringAsFixed(2)}",
                            style: const TextStyle(color: AppColors.mutedText)),
                      ),
                    ))
                .toList(),
          ),
        );
      },
    );
  }

  Widget _buildFeeReturnChart() {
    return FutureBuilder<List<FeeReturnData>>(
      future: feeReturnFuture,
      builder: (context, snapshot) {
        if (!snapshot.hasData)
          return const Center(child: CircularProgressIndicator());

        final data = snapshot.data!;
        return ElevatedCard(
          padding: const EdgeInsets.all(16),
          height: 260,
          child: BarChart(
            BarChartData(
              alignment: BarChartAlignment.spaceAround,
              groupsSpace: 20,
              borderData: FlBorderData(show: false),
              titlesData: FlTitlesData(
                leftTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    reservedSize: 40,
                    getTitlesWidget: (value, meta) => Text(
                      value.toStringAsFixed(1),
                      style: const TextStyle(
                          color: AppColors.darkText, fontSize: 12),
                    ),
                  ),
                ),
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    reservedSize: 40,
                    getTitlesWidget: (value, meta) {
                      int index = value.toInt();
                      if (index >= 0 && index < data.length) {
                        return Text(data[index].asset,
                            style: const TextStyle(
                                color: AppColors.darkText, fontSize: 12));
                      }
                      return const Text('');
                    },
                  ),
                ),
              ),
              barGroups: data
                  .map((e) => BarChartGroupData(
                        x: data.indexOf(e),
                        barRods: [
                          BarChartRodData(
                              toY: e.returns,
                              color: AppColors.success,
                              width: 14),
                          BarChartRodData(
                              toY: e.fees, color: AppColors.error, width: 14),
                        ],
                      ))
                  .toList(),
            ),
          ),
        );
      },
    );
  }

  Widget _buildWhatIfCards() {
    return FutureBuilder<List<WhatIfScenario>>(
      future: whatIfFuture,
      builder: (context, snapshot) {
        if (!snapshot.hasData)
          return const Center(child: CircularProgressIndicator());

        final scenarios = snapshot.data!;
        return Column(
          children: scenarios
              .map((e) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: ElevatedCard(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.lightbulb, color: AppColors.primary, size: 28),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  e.scenarioName,
                                  style: const TextStyle(
                                    fontSize: 17,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.darkText,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(
                            "Expected Return: ${e.expectedReturn.toStringAsFixed(2)}%",
                            style: const TextStyle(
                              color: AppColors.success,
                              fontSize: 15,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            "Risk: ${e.risk.toStringAsFixed(2)}%",
                            style: const TextStyle(
                              color: AppColors.error,
                              fontSize: 15,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ))
              .toList(),
        );
      },
    );
  }
}