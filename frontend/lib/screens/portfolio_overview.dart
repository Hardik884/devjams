import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../models/portfolio_data.dart';
import '../theme/app_theme.dart';

class PortfolioOverview extends StatefulWidget {
  final PortfolioData portfolioData;

  const PortfolioOverview({super.key, required this.portfolioData});

  @override
  State<PortfolioOverview> createState() => _PortfolioOverviewState();
}

class _PortfolioOverviewState extends State<PortfolioOverview> {
  String _selectedTimeframe = '1Y';
  final List<String> _timeframes = ['1M', '3M', '6M', '1Y'];

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildPortfolioValueCard(),
          const SizedBox(height: 24),
          _buildPerformanceChartWithTimeframes(),
          const SizedBox(height: 24),
          _buildQuickStats(),
          const SizedBox(height: 24),
          _buildHoldingsSection(),
          const SizedBox(height: 100),
        ],
      ),
    );
  }

  // ---------------- Portfolio Value ----------------
  Widget _buildPortfolioValueCard() {
    final portfolioData = widget.portfolioData;
    return Card(
      color: AppTheme.cardDark,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Total Portfolio Value',
                style: TextStyle(color: AppTheme.gray400, fontSize: 14)),
            const SizedBox(height: 8),
            Text('\$${_formatCurrency(portfolioData.totalValue)}',
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 32,
                    fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(
                  portfolioData.valueChange >= 0
                      ? Icons.trending_up
                      : Icons.trending_down,
                  color: portfolioData.valueChange >= 0
                      ? AppTheme.successGreen
                      : AppTheme.errorRed,
                  size: 16,
                ),
                const SizedBox(width: 4),
                Text(
                  '\$${_formatCurrency(portfolioData.valueChange.abs())} '
                  '(${portfolioData.valueChangePercent >= 0 ? '+' : ''}'
                  '${portfolioData.valueChangePercent.toStringAsFixed(1)}%)',
                  style: TextStyle(
                    color: portfolioData.valueChange >= 0
                        ? AppTheme.successGreen
                        : AppTheme.errorRed,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // ---------------- Performance Chart with Timeframes ----------------
  Widget _buildPerformanceChartWithTimeframes() {
    final portfolioData = widget.portfolioData;
    final history =
        portfolioData.performanceHistory[_selectedTimeframe] ?? [];

    final spots = history
        .asMap()
        .entries
        .map((e) => FlSpot(e.key.toDouble(), e.value))
        .toList();

    final minY = spots.isNotEmpty
        ? spots.map((e) => e.y).reduce((a, b) => a < b ? a : b) * 0.95
        : 0.0;
    final maxY = spots.isNotEmpty
        ? spots.map((e) => e.y).reduce((a, b) => a > b ? a : b) * 1.05
        : 100000.0;

    return Card(
      color: AppTheme.cardDark,
      child: Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Performance',
                style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),

            // Timeframe buttons
            Row(
              children: _timeframes
                  .map(
                    (tf) => Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: GestureDetector(
                        onTap: () {
                          setState(() {
                            _selectedTimeframe = tf;
                          });
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: _selectedTimeframe == tf
                                ? AppTheme.electricBlue
                                : AppTheme.borderDark,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            tf,
                            style: TextStyle(
                                color: _selectedTimeframe == tf
                                    ? Colors.white
                                    : AppTheme.gray400,
                                fontWeight: FontWeight.w600),
                          ),
                        ),
                      ),
                    ),
                  )
                  .toList(),
            ),
            const SizedBox(height: 16),

            // Chart
            SizedBox(
              height: 200,
              child: LineChart(
                LineChartData(
                  gridData: const FlGridData(show: false),
                  titlesData: const FlTitlesData(show: false),
                  borderData: FlBorderData(show: false),
                  minX: 0,
                  maxX: spots.length > 1 ? (spots.length - 1).toDouble() : 5,
                  minY: minY,
                  maxY: maxY,
                  lineBarsData: [
                    LineChartBarData(
                      spots: spots,
                      isCurved: true,
                      color: AppTheme.electricBlue,
                      barWidth: 3,
                      isStrokeCapRound: true,
                      dotData: const FlDotData(show: false),
                      belowBarData: BarAreaData(
                          show: true,
                          color: AppTheme.electricBlue.withOpacity(0.1)),
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

  // ---------------- Quick Stats ----------------
  Widget _buildQuickStats() {
    final portfolioData = widget.portfolioData;
    return Row(
      children: [
        Expanded(
            child: _buildStatCard(
                'Risk Score',
                '${portfolioData.riskScore}/10',
                _getRiskColor(portfolioData.riskScore))),
        const SizedBox(width: 12),
        Expanded(
            child: _buildStatCard('Diversification',
                portfolioData.holdings.isNotEmpty ? 'Well Balanced' : 'N/A', AppTheme.successGreen)),
        const SizedBox(width: 12),
        Expanded(
            child: _buildStatCard(
                'YTD Return',
                '${portfolioData.valueChangePercent.toStringAsFixed(1)}%',
                portfolioData.valueChange >= 0
                    ? AppTheme.successGreen
                    : AppTheme.errorRed)),
      ],
    );
  }

  Widget _buildStatCard(String title, String value, Color valueColor) {
    return GestureDetector(
      onTap: () {
        // Add callback if needed
      },
      child: Card(
        color: AppTheme.cardDark,
        child: Container(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title,
                  style: const TextStyle(color: AppTheme.gray400, fontSize: 12)),
              const SizedBox(height: 4),
              Text(value,
                  style: TextStyle(
                      color: valueColor,
                      fontSize: 14,
                      fontWeight: FontWeight.w600)),
            ],
          ),
        ),
      ),
    );
  }

  // ---------------- Holdings ----------------
  Widget _buildHoldingsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Holdings',
            style: TextStyle(
                color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600)),
        const SizedBox(height: 12),
        ...widget.portfolioData.holdings.map(_buildHoldingItem),
      ],
    );
  }

  Widget _buildHoldingItem(AssetData holding) {
    return GestureDetector(
      onTap: () {
        // Handle holding tap
      },
      child: Card(
        color: AppTheme.cardDark,
        margin: const EdgeInsets.only(bottom: 8),
        child: Container(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Asset Icon
              Container(
                width: 40,
                height: 40,
                decoration: const BoxDecoration(
                  color: AppTheme.borderDark,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    holding.symbol.isNotEmpty ? holding.symbol[0] : '',
                    style: const TextStyle(
                        color: Colors.white, fontWeight: FontWeight.w600),
                  ),
                ),
              ),
              const SizedBox(width: 12),

              // Asset Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(holding.symbol,
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.w600)),
                    Text('${holding.percentage.toStringAsFixed(1)}% of portfolio',
                        style: const TextStyle(color: AppTheme.gray400, fontSize: 12)),
                  ],
                ),
              ),

              // Value and Change
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('\$${holding.value.toStringAsFixed(2)}',
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w600)),
                  Text(
                      '${holding.isPositiveChange ? '+' : ''}${holding.changePercent.toStringAsFixed(1)}%',
                      style: TextStyle(
                          color: holding.isPositiveChange
                              ? AppTheme.successGreen
                              : AppTheme.errorRed,
                          fontSize: 12,
                          fontWeight: FontWeight.w500)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ---------------- Helpers ----------------
  String _formatCurrency(double value) {
    if (value >= 1000000) return '${(value / 1000000).toStringAsFixed(1)}M';
    if (value >= 1000) return '${(value / 1000).toStringAsFixed(0)}K';
    return value.toStringAsFixed(0);
  }

  Color _getRiskColor(int riskScore) {
    if (riskScore <= 3) return AppTheme.successGreen;
    if (riskScore <= 6) return AppTheme.warningYellow;
    return AppTheme.errorRed;
  }
}