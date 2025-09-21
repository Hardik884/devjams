import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../theme/app_theme.dart';

class ChartsAnalytics extends StatefulWidget {
  const ChartsAnalytics({super.key});

  @override
  State<ChartsAnalytics> createState() => _ChartsAnalyticsState();
}

class _ChartsAnalyticsState extends State<ChartsAnalytics> {
  String selectedPeriod = '1Y';
  String selectedChart = 'Performance';

  // Mock data for different charts
  static final Map<String, List<FlSpot>> chartData = {
    'Performance': [
      const FlSpot(0, 100000),
      const FlSpot(1, 102500),
      const FlSpot(2, 101800),
      const FlSpot(3, 104200),
      const FlSpot(4, 106800),
      const FlSpot(5, 105420),
    ],
    'Risk': [
      const FlSpot(0, 6.2),
      const FlSpot(1, 6.8),
      const FlSpot(2, 5.9),
      const FlSpot(3, 6.4),
      const FlSpot(4, 6.1),
      const FlSpot(5, 6.0),
    ],
    'Volatility': [
      const FlSpot(0, 12.8),
      const FlSpot(1, 14.2),
      const FlSpot(2, 11.5),
      const FlSpot(3, 13.1),
      const FlSpot(4, 12.3),
      const FlSpot(5, 12.8),
    ],
  };

  static final List<PieChartSectionData> allocationData = [
    PieChartSectionData(
      color: AppTheme.blue500,
      value: 35,
      title: 'SPY\n35%',
      radius: 60,
      titleStyle: const TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.bold,
        color: Colors.white,
      ),
    ),
    PieChartSectionData(
      color: AppTheme.green500,
      value: 25,
      title: 'QQQ\n25%',
      radius: 60,
      titleStyle: const TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.bold,
        color: Colors.white,
      ),
    ),
    PieChartSectionData(
      color: AppTheme.yellow500,
      value: 20,
      title: 'VTI\n20%',
      radius: 60,
      titleStyle: const TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.bold,
        color: Colors.white,
      ),
    ),
    PieChartSectionData(
      color: AppTheme.red500,
      value: 15,
      title: 'BND\n15%',
      radius: 60,
      titleStyle: const TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.bold,
        color: Colors.white,
      ),
    ),
    PieChartSectionData(
      color: AppTheme.gray500,
      value: 5,
      title: 'VEA\n5%',
      radius: 60,
      titleStyle: const TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.bold,
        color: Colors.white,
      ),
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          _buildHeader(),
          const SizedBox(height: 24),
          
          // Controls
          _buildControls(),
          const SizedBox(height: 24),
          
          // Main Chart
          _buildMainChart(),
          const SizedBox(height: 24),
          
          // Asset Allocation Chart
          _buildAllocationChart(),
          const SizedBox(height: 24),
          
          // Performance Metrics
          _buildPerformanceMetrics(),
          const SizedBox(height: 24),
          
          // Risk Analytics
          _buildRiskAnalytics(),
          
          const SizedBox(height: 100), // Bottom navigation padding
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return const Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Portfolio Analytics',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w500,
          ),
        ),
        SizedBox(height: 4),
        Text(
          'Advanced performance insights',
          style: TextStyle(
            color: AppTheme.gray400,
            fontSize: 14,
          ),
        ),
      ],
    );
  }

  Widget _buildControls() {
    return Column(
      children: [
        // Period Selector
        Row(
          children: ['1M', '3M', '6M', '1Y', '2Y', 'ALL'].map((period) {
            final isSelected = selectedPeriod == period;
            return Expanded(
              child: GestureDetector(
                onTap: () => setState(() => selectedPeriod = period),
                child: Container(
                  margin: const EdgeInsets.only(right: 8),
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  decoration: BoxDecoration(
                    color: isSelected ? AppTheme.blue500 : AppTheme.gray800,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: isSelected ? AppTheme.blue500 : AppTheme.gray700,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      period,
                      style: TextStyle(
                        color: isSelected ? Colors.white : AppTheme.gray400,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 16),
        
        // Chart Type Selector
        Row(
          children: ['Performance', 'Risk', 'Volatility'].map((chart) {
            final isSelected = selectedChart == chart;
            return Expanded(
              child: GestureDetector(
                onTap: () => setState(() => selectedChart = chart),
                child: Container(
                  margin: const EdgeInsets.only(right: 8),
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  decoration: BoxDecoration(
                    color: isSelected ? AppTheme.gray700 : AppTheme.gray800,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: isSelected ? AppTheme.gray600 : AppTheme.gray700,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      chart,
                      style: TextStyle(
                        color: isSelected ? Colors.white : AppTheme.gray400,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildMainChart() {
    return Card(
      child: Container(
        padding: const EdgeInsets.all(16),
        height: 250,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '$selectedChart Chart ($selectedPeriod)',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: LineChart(
                LineChartData(
                  gridData: FlGridData(
                    show: true,
                    drawVerticalLine: false,
                    getDrawingHorizontalLine: (value) {
                      return const FlLine(
                        color: AppTheme.gray700,
                        strokeWidth: 1,
                      );
                    },
                  ),
                  titlesData: FlTitlesData(
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        getTitlesWidget: (value, meta) {
                          const months = ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'];
                          if (value.toInt() < months.length) {
                            return Text(
                              months[value.toInt()],
                              style: const TextStyle(
                                color: AppTheme.gray400,
                                fontSize: 12,
                              ),
                            );
                          }
                          return const Text('');
                        },
                      ),
                    ),
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 40,
                        getTitlesWidget: (value, meta) {
                          return Text(
                            _getYAxisLabel(value, selectedChart),
                            style: const TextStyle(
                              color: AppTheme.gray400,
                              fontSize: 10,
                            ),
                          );
                        },
                      ),
                    ),
                    topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  ),
                  borderData: FlBorderData(show: false),
                  lineBarsData: [
                    LineChartBarData(
                      spots: chartData[selectedChart] ?? [],
                      isCurved: true,
                      color: _getChartColor(selectedChart),
                      barWidth: 3,
                      dotData: const FlDotData(show: false),
                      belowBarData: BarAreaData(
                        show: true,
                        color: _getChartColor(selectedChart).withOpacity(0.1),
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

  Widget _buildAllocationChart() {
    return Card(
      child: Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Asset Allocation',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 200,
              child: PieChart(
                PieChartData(
                  sections: allocationData,
                  centerSpaceRadius: 40,
                  sectionsSpace: 2,
                ),
              ),
            ),
            const SizedBox(height: 16),
            _buildAllocationLegend(),
          ],
        ),
      ),
    );
  }

  Widget _buildAllocationLegend() {
    final assets = [
      {'name': 'SPY', 'color': AppTheme.blue500, 'percent': '35%'},
      {'name': 'QQQ', 'color': AppTheme.green500, 'percent': '25%'},
      {'name': 'VTI', 'color': AppTheme.yellow500, 'percent': '20%'},
      {'name': 'BND', 'color': AppTheme.red500, 'percent': '15%'},
      {'name': 'VEA', 'color': AppTheme.gray500, 'percent': '5%'},
    ];

    return Wrap(
      spacing: 16,
      runSpacing: 8,
      children: assets.map((asset) {
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 12,
              height: 12,
              decoration: BoxDecoration(
                color: asset['color'] as Color,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 6),
            Text(
              '${asset['name']} ${asset['percent']}',
              style: const TextStyle(
                color: AppTheme.gray300,
                fontSize: 12,
              ),
            ),
          ],
        );
      }).toList(),
    );
  }

  Widget _buildPerformanceMetrics() {
    return Card(
      child: Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Performance Metrics',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildMetricItem('Total Return', '+8.7%', AppTheme.green500),
                ),
                Expanded(
                  child: _buildMetricItem('Annualized', '+12.4%', AppTheme.green500),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildMetricItem('Sharpe Ratio', '1.42', Colors.white),
                ),
                Expanded(
                  child: _buildMetricItem('Alpha', '+2.1%', AppTheme.blue400),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildMetricItem('Beta', '0.89', Colors.white),
                ),
                Expanded(
                  child: _buildMetricItem('R-Squared', '0.92', Colors.white),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRiskAnalytics() {
    return Card(
      child: Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Risk Analytics',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildMetricItem('Max Drawdown', '-3.2%', AppTheme.red400),
                ),
                Expanded(
                  child: _buildMetricItem('Volatility', '12.8%', AppTheme.yellow400),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildMetricItem('VaR (95%)', '-2.1%', AppTheme.red400),
                ),
                Expanded(
                  child: _buildMetricItem('Calmar Ratio', '3.88', AppTheme.green400),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _buildRiskGauge(),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricItem(String label, String value, Color valueColor) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: AppTheme.gray400,
            fontSize: 12,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            color: valueColor,
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _buildRiskGauge() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Risk Level',
          style: TextStyle(
            color: AppTheme.gray400,
            fontSize: 12,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: Container(
                height: 8,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(4),
                  gradient: const LinearGradient(
                    colors: [
                      AppTheme.green500,
                      AppTheme.yellow500,
                      AppTheme.red500,
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            const Text(
              '6/10',
              style: TextStyle(
                color: AppTheme.yellow500,
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        const Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Low',
              style: TextStyle(
                color: AppTheme.gray400,
                fontSize: 10,
              ),
            ),
            Text(
              'Moderate',
              style: TextStyle(
                color: AppTheme.gray400,
                fontSize: 10,
              ),
            ),
            Text(
              'High',
              style: TextStyle(
                color: AppTheme.gray400,
                fontSize: 10,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Color _getChartColor(String chartType) {
    switch (chartType) {
      case 'Performance':
        return AppTheme.blue500;
      case 'Risk':
        return AppTheme.yellow500;
      case 'Volatility':
        return AppTheme.red500;
      default:
        return AppTheme.blue500;
    }
  }

  String _getYAxisLabel(double value, String chartType) {
    switch (chartType) {
      case 'Performance':
        return '${(value / 1000).toStringAsFixed(0)}K';
      case 'Risk':
        return value.toStringAsFixed(1);
      case 'Volatility':
        return '${value.toStringAsFixed(0)}%';
      default:
        return value.toStringAsFixed(0);
    }
  }
}