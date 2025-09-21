import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:provider/provider.dart';
import '../utils/app_colors.dart';
import '../widgets/elevated_card.dart';
import '../models/portfolio_data.dart';
import '../providers/app_state_provider.dart';
import '../models/analytics_models.dart';

class ChartsAnalyticsScreen extends StatelessWidget {
  const ChartsAnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppStateProvider>(context);
    final portfolioData = appState.portfolioData;

    final List<EarningsData> earningsChartData = [
      EarningsData(period: 'W', amount: 2800.0),
      EarningsData(period: 'M', amount: 4200.0),
      EarningsData(period: '3M', amount: 6800.0),
      EarningsData(period: '6M', amount: 8900.0),
      EarningsData(period: 'Y', amount: 12045.0),
    ];
    
    final List<FlSpot> performanceChartData = appState.performanceChartData
        .asMap()
        .entries
        .map((entry) => FlSpot(entry.key.toDouble(), entry.value))
        .toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(),
          const SizedBox(height: 24),
          _buildTotalEarnings(portfolioData),
          const SizedBox(height: 24),
          _buildEarningsChart(earningsChartData),
          const SizedBox(height: 24),
          _buildPortfolioPerformanceChart(performanceChartData),
          const SizedBox(height: 24),
          _buildFeaturedEarnings(portfolioData.holdings),
        ],
      ),
    );
  }

  // ---------------- Header ----------------
  Widget _buildHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          'My Earn',
          style: GoogleFonts.inter(
            fontSize: 24,
            fontWeight: FontWeight.w600,
            color: Colors.white,
          ),
        ),
        Text(
          'Discover',
          style: GoogleFonts.inter(
            fontSize: 16,
            color: Colors.grey[400],
          ),
        ),
      ],
    );
  }

  // ---------------- Total Earnings ----------------
  Widget _buildTotalEarnings(PortfolioData data) {
    return Center(
      child: Column(
        children: [
          Text(
            data.formattedTotalValue,
            style: GoogleFonts.inter(
              fontSize: 36,
              fontWeight: FontWeight.w600,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                data.formattedValueChange,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: data.isPositiveChange ? AppColors.success : AppColors.error,
                ),
              ),
              Text(
                ' • ',
                style: GoogleFonts.inter(
                  fontSize: 14,
                  color: Colors.grey[400],
                ),
              ),
              Text(
                '${data.formattedValueChangePercent} this month',
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: data.isPositiveChange ? AppColors.success : AppColors.error,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ---------------- Earnings Chart ----------------
  Widget _buildEarningsChart(List<EarningsData> earningsChartData) {
    return ElevatedCard(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            SizedBox(
              height: 200,
              child: BarChart(
                BarChartData(
                  alignment: BarChartAlignment.spaceAround,
                  maxY: earningsChartData.isEmpty
                      ? 100
                      : earningsChartData.map((e) => e.amount).reduce((a, b) => a > b ? a : b) * 1.2,
                  barTouchData: BarTouchData(enabled: false),
                  titlesData: FlTitlesData(
                    show: true,
                    rightTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    topTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    leftTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        getTitlesWidget: (double value, TitleMeta meta) {
                          if (value.toInt() < earningsChartData.length) {
                            return SideTitleWidget(
                              axisSide: meta.axisSide,
                              child: Text(
                                earningsChartData[value.toInt()].period,
                                style: const TextStyle(
                                  color: Colors.grey,
                                  fontSize: 12,
                                ),
                              ),
                            );
                          }
                          return const SizedBox();
                        },
                      ),
                    ),
                  ),
                  borderData: FlBorderData(show: false),
                  gridData: const FlGridData(show: false),
                  barGroups: earningsChartData.asMap().entries.map((entry) {
                    final index = entry.key;
                    final data = entry.value;
                    return BarChartGroupData(
                      x: index,
                      barRods: [
                        BarChartRodData(
                          toY: data.amount,
                          color: AppColors.primary,
                          width: 24,
                          borderRadius: const BorderRadius.only(
                            topLeft: Radius.circular(4),
                            topRight: Radius.circular(4),
                          ),
                        ),
                      ],
                    );
                  }).toList(),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ---------------- Portfolio Performance Chart ----------------
  Widget _buildPortfolioPerformanceChart(List<FlSpot> portfolioPerformanceData) {
    return ElevatedCard(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Portfolio Performance',
              style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 120,
              child: LineChart(
                LineChartData(
                  gridData: const FlGridData(show: false),
                  titlesData: const FlTitlesData(show: false),
                  borderData: FlBorderData(show: false),
                  lineBarsData: [
                    LineChartBarData(
                      spots: portfolioPerformanceData,
                      isCurved: true,
                      color: AppColors.success,
                      barWidth: 2,
                      isStrokeCapRound: true,
                      dotData: const FlDotData(show: false),
                      belowBarData: BarAreaData(show: false),
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

  // ---------------- Featured Earnings ----------------
  Widget _buildFeaturedEarnings(List<AssetData> featuredAssets) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Featured Earnings',
          style: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 12),
        ...featuredAssets.map((asset) => _buildAssetCard(asset)),
      ],
    );
  }

  Widget _buildAssetCard(AssetData asset) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: ElevatedCard(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Asset icon
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: asset.isPositiveChange ? AppColors.success : AppColors.error,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Center(
                  child: Text(
                    asset.symbol,
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              // Asset info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      asset.name,
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: Colors.white,
                      ),
                    ),
                    Text(
                      asset.formattedValue,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: Colors.grey[400],
                      ),
                    ),
                  ],
                ),
              ),
              // Change indicator
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: asset.isPositiveChange ? AppColors.success : AppColors.error,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Center(
                      child: Icon(Icons.show_chart, color: Colors.white),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    asset.formattedChangePercent,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: asset.isPositiveChange ? AppColors.success : AppColors.error,
                    ),
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