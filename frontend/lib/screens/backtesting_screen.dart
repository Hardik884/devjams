import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fl_chart/fl_chart.dart';
import '../utils/app_colors.dart';
import '../widgets/elevated_card.dart';
import '../models/backtest_result_model.dart';
import '../services/backtest_service.dart';

class BacktestingScreen extends StatefulWidget {
  const BacktestingScreen({super.key});

  @override
  State<BacktestingScreen> createState() => _BacktestingScreenState();
}

class _BacktestingScreenState extends State<BacktestingScreen> {
  final BacktestService _service = BacktestService();
  late Future<List<BacktestResultModel>> _backtestFuture;
  String _selectedPeriod = '1Y';
  List<String> _periods = [];

  @override
  void initState() {
    super.initState();
    _backtestFuture = _service.fetchBacktestResults();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<BacktestResultModel>>(
      future: _backtestFuture,
      builder: (context, snapshot) {
        if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
        final results = snapshot.data!;
        _periods = results.map((e) => e.period).toList();
        final currentResult = results.firstWhere((r) => r.period == _selectedPeriod);

        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(),
              const SizedBox(height: 24),
              _buildPeriodSelector(),
              const SizedBox(height: 24),
              _buildPerformanceMetrics(currentResult),
              const SizedBox(height: 24),
              _buildBacktestChart(results),
              const SizedBox(height: 24),
              _buildStrategyComparison(currentResult),
              const SizedBox(height: 24),
              _buildRunBacktestButton(),
            ],
          ),
        );
      },
    );
  }

  Widget _buildHeader() {
    return Row(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: AppColors.info.withOpacity(0.2),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(Icons.timeline, color: AppColors.info, size: 20),
        ),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Strategy Backtesting',
                style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w600, color: Colors.white)),
            Text('RL-optimized portfolio performance',
                style: GoogleFonts.inter(fontSize: 14, color: Colors.grey[400])),
          ],
        ),
      ],
    );
  }

  Widget _buildPeriodSelector() {
    return ElevatedCard(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Wrap(
          spacing: 8,
          children: _periods.map((period) {
            final isSelected = period == _selectedPeriod;
            return GestureDetector(
              onTap: () => setState(() => _selectedPeriod = period),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: isSelected ? AppColors.primary : Colors.transparent,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: isSelected ? AppColors.primary : Colors.grey[600]!),
                ),
                child: Text(period,
                    style: GoogleFonts.inter(
                        fontSize: 14, fontWeight: FontWeight.w500, color: isSelected ? Colors.white : Colors.grey[400])),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildPerformanceMetrics(BacktestResultModel result) {
    return ElevatedCard(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Performance Metrics ($_selectedPeriod)',
                style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white)),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(child: _buildMetricItem('Total Return', result.formattedReturn, AppColors.success)),
                Expanded(child: _buildMetricItem('Sharpe Ratio', result.formattedSharpeRatio, AppColors.info)),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: _buildMetricItem('Max Drawdown', result.formattedMaxDrawdown, AppColors.error)),
                Expanded(child: _buildMetricItem('Volatility', result.formattedVolatility, AppColors.warning)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricItem(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      margin: const EdgeInsets.symmetric(horizontal: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[400])),
        const SizedBox(height: 4),
        Text(value, style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600, color: color)),
      ]),
    );
  }

  Widget _buildBacktestChart(List<BacktestResultModel> results) {
    return ElevatedCard(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: SizedBox(
          height: 200,
          child: LineChart(LineChartData(
            gridData: FlGridData(show: true, drawVerticalLine: true, drawHorizontalLine: true),
            titlesData: const FlTitlesData(show: false),
            borderData: FlBorderData(show: false),
            lineBarsData: [
              LineChartBarData(
                spots: _generatePortfolioData(),
                isCurved: true,
                color: AppColors.primary,
                barWidth: 3,
                dotData: const FlDotData(show: false),
                belowBarData: BarAreaData(show: true, color: AppColors.primary.withOpacity(0.1)),
              ),
              LineChartBarData(
                spots: _generateBenchmarkData(),
                isCurved: true,
                color: Colors.grey[400]!,
                barWidth: 2,
                dotData: const FlDotData(show: false),
                dashArray: [4, 4],
              ),
            ],
          )),
        ),
      ),
    );
  }

  List<FlSpot> _generatePortfolioData() {
    return List.generate(12, (i) => FlSpot(i.toDouble(), 10000 + i * 240));
  }

  List<FlSpot> _generateBenchmarkData() {
    return List.generate(12, (i) => FlSpot(i.toDouble(), 10000 + i * 180));
  }

  Widget _buildStrategyComparison(BacktestResultModel result) {
    return ElevatedCard(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Strategy Comparison', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white)),
          const SizedBox(height: 16),
          _buildComparisonRow('Portfolio Return', result.formattedReturn, '+18.7%'),
          _buildComparisonRow('Sharpe Ratio', result.formattedSharpeRatio, '1.23'),
          _buildComparisonRow('Max Drawdown', result.formattedMaxDrawdown, '-15.6%'),
          _buildComparisonRow('Win Rate', '67%', '58%'),
        ]),
      ),
    );
  }

  Widget _buildComparisonRow(String metric, String portfolioValue, String benchmarkValue) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Expanded(flex: 2, child: Text(metric, style: GoogleFonts.inter(fontSize: 14, color: Colors.grey[400]))),
          Expanded(child: Text(portfolioValue, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.success), textAlign: TextAlign.center)),
          Expanded(child: Text(benchmarkValue, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: Colors.grey[300]), textAlign: TextAlign.center)),
        ],
      ),
    );
  }

  Widget _buildRunBacktestButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: () {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Running new backtest...'), duration: Duration(seconds: 2)));
        },
        icon: const Icon(Icons.play_arrow),
        label: Text('Run New Backtest', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
    );
  }
}