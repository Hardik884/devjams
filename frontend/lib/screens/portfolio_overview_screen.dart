import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:google_fonts/google_fonts.dart';

import '../providers/app_state_provider.dart';
import '../utils/app_colors.dart';
import '../widgets/elevated_card.dart';
import '../models/portfolio_data.dart';

class PortfolioOverviewScreen extends StatelessWidget {
  const PortfolioOverviewScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AppStateProvider>(
      builder: (context, appState, child) {
        final portfolioData = appState.portfolioData;

        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Portfolio Summary
              _buildPortfolioSummary(portfolioData),

              const SizedBox(height: 24),

              // Performance Chart
              _buildPerformanceChart(appState),

              const SizedBox(height: 24),

              // Stats Cards
              _buildStatsCards(portfolioData),

              const SizedBox(height: 24),

              // Holdings
              _buildHoldingsSection(portfolioData),

              const SizedBox(height: 100), // Bottom padding
            ],
          ),
        );
      },
    );
  }

  // ---------------- Portfolio Summary ----------------
  Widget _buildPortfolioSummary(PortfolioData data) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Total Portfolio Value',
          style: TextStyle(color: AppColors.gray400, fontSize: 14),
        ),
        const SizedBox(height: 8),
        Text(
          data.formattedTotalValue,
          style: const TextStyle(
              color: Colors.white, fontSize: 32, fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Icon(
              data.isPositiveChange ? Icons.trending_up : Icons.trending_down,
              color: data.isPositiveChange ? AppColors.success : AppColors.error,
              size: 16,
            ),
            const SizedBox(width: 4),
            Text(
              '${data.formattedValueChange} • ${data.formattedValueChangePercent}',
              style: TextStyle(
                  color: data.isPositiveChange ? AppColors.success : AppColors.error,
                  fontSize: 14,
                  fontWeight: FontWeight.w600),
            ),
            const SizedBox(width: 8),
            const Text(
              'this year',
              style: TextStyle(color: AppColors.gray400, fontSize: 14),
            ),
          ],
        ),
      ],
    );
  }

  // ---------------- Performance Chart ----------------
  Widget _buildPerformanceChart(AppStateProvider appState) {
    final chartData = appState.performanceChartData;

    // Use dynamic keys from performanceHistory
    final availableTimeframes =
        appState.portfolioData.performanceHistory.keys.toList();

    return ElevatedCard(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header + Timeframe Buttons
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Performance',
                  style: GoogleFonts.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
                Row(
                  children: availableTimeframes
                      .map((tf) => _buildTimeButton(tf, appState))
                      .toList(),
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Line Chart
            SizedBox(
              height: 200,
              child: chartData.isEmpty
                  ? Center(
                      child: Text(
                        'No data available',
                        style: GoogleFonts.inter(color: Colors.grey[400]),
                      ),
                    )
                  : LineChart(
                      LineChartData(
                        gridData: FlGridData(show: false),
                        titlesData: FlTitlesData(show: false),
                        borderData: FlBorderData(show: false),
                        minY: 0,
                        maxY: chartData.reduce((a, b) => a > b ? a : b) * 1.2,
                        lineBarsData: [
                          LineChartBarData(
                            spots: _generateChartData(chartData),
                            isCurved: true,
                            color: AppColors.success,
                            barWidth: 3,
                            isStrokeCapRound: true,
                            dotData: FlDotData(show: true),
                            belowBarData: BarAreaData(
                              show: true,
                              color: AppColors.success.withOpacity(0.1),
                            ),
                          ),
                        ],
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  // ---------------- Timeframe Button ----------------
  Widget _buildTimeButton(String timeframe, AppStateProvider appState) {
    final isSelected = appState.selectedTimeframe == timeframe;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          appState.setSelectedTimeframe(timeframe);
        },
        borderRadius: BorderRadius.circular(8),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          margin: const EdgeInsets.only(left: 8),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.primary : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: AppColors.gray400.withOpacity(0.3)),
          ),
          child: Text(
            timeframe,
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: isSelected ? Colors.white : Colors.grey[400],
            ),
          ),
        ),
      ),
    );
  }

  List<FlSpot> _generateChartData(List<double> history) {
    return history
        .asMap()
        .entries
        .map((e) => FlSpot(e.key.toDouble(), e.value))
        .toList();
  }

  // ---------------- Stats Cards ----------------
  Widget _buildStatsCards(PortfolioData data) {
    return Row(
      children: [
        Expanded(
          child: ElevatedCard(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 24,
                        height: 24,
                        decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.2),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(Icons.circle,
                            color: AppColors.primary, size: 12),
                      ),
                      const SizedBox(width: 8),
                      Flexible(
                        child: Text(
                          'Portfolio Value',
                          style: GoogleFonts.inter(
                              fontSize: 14,
                              color: Colors.white,
                              fontWeight: FontWeight.w500),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    data.formattedTotalValue,
                    style: GoogleFonts.inter(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: Colors.white),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${data.formattedValueChange} • ${data.formattedValueChangePercent}',
                    style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: data.isPositiveChange
                            ? AppColors.success
                            : AppColors.error),
                  ),
                  Text(
                    'year to date',
                    style: GoogleFonts.inter(
                        fontSize: 10, color: Colors.grey[400]),
                  ),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: ElevatedCard(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 24,
                        height: 24,
                        decoration: BoxDecoration(
                          color: AppColors.warning.withOpacity(0.2),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(Icons.circle,
                            color: AppColors.warning, size: 12),
                      ),
                      const SizedBox(width: 8),
                      Flexible(
                        child: Text(
                          'Risk Score',
                          style: GoogleFonts.inter(
                              fontSize: 14,
                              color: Colors.white,
                              fontWeight: FontWeight.w500),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    '${data.riskScore}/10',
                    style: GoogleFonts.inter(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: _getRiskColor(data.riskScore)),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _getRiskLevel(data.riskScore),
                    style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: _getRiskColor(data.riskScore)),
                  ),
                  Text(
                    'current level',
                    style: GoogleFonts.inter(
                        fontSize: 10, color: Colors.grey[400]),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Color _getRiskColor(int riskScore) {
    if (riskScore <= 3) return AppColors.success;
    if (riskScore <= 6) return AppColors.warning;
    return AppColors.error;
  }

  String _getRiskLevel(int riskScore) {
    if (riskScore <= 3) return 'Low';
    if (riskScore <= 6) return 'Moderate';
    return 'High';
  }

  // ---------------- Holdings ----------------
  Widget _buildHoldingsSection(PortfolioData data) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Current Holdings',
          style: GoogleFonts.inter(
              fontSize: 18, fontWeight: FontWeight.w600, color: Colors.white),
        ),
        const SizedBox(height: 16),
        ...data.holdings.map(_buildHoldingItem).toList(),
      ],
    );
  }

  Widget _buildHoldingItem(AssetData asset) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: ElevatedCard(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Center(
                  child: Text(
                    asset.symbol.isNotEmpty ? asset.symbol[0] : '',
                    style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppColors.primary),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      asset.symbol,
                      style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.white),
                    ),
                    Text(
                      asset.name,
                      style:
                          GoogleFonts.inter(fontSize: 12, color: Colors.grey[400]),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    asset.formattedValue,
                    style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Colors.white),
                  ),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        asset.formattedPercentage,
                        style:
                            GoogleFonts.inter(fontSize: 12, color: Colors.grey[400]),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        asset.formattedChangePercent,
                        style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: asset.isPositiveChange
                                ? AppColors.success
                                : AppColors.error),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}