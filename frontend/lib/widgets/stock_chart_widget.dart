import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/stock_data_model.dart';
import '../utils/app_colors.dart';
import 'elevated_card.dart'; // Import the elevated card widget

class StockChartWidget extends StatelessWidget {
  final List<HistoricalDataPoint> historicalData;

  const StockChartWidget({super.key, required this.historicalData});

  @override
  Widget build(BuildContext context) {
    if (historicalData.isEmpty) {
      return ElevatedCard( // Use ElevatedCard for the "no data" state
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16.0),
          child: Center(
            child: Text(
              'No chart data available.',
              style: GoogleFonts.inter(color: AppColors.mutedText),
            ),
          ),
        ),
      );
    }

    final List<FlSpot> spots = historicalData
        .map((data) => FlSpot(
              data.timestamp.toDouble(),
              data.close,
            ))
        .toList();

    return ElevatedCard( // Use ElevatedCard to wrap the entire chart
      padding: const EdgeInsets.all(0),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16.0),
        child: LineChart(
          LineChartData(
            gridData: const FlGridData(show: false),
            titlesData: const FlTitlesData(show: false),
            borderData: FlBorderData(show: false),
            lineBarsData: [
              LineChartBarData(
                spots: spots,
                isCurved: true,
                color: AppColors.primary,
                barWidth: 2,
                dotData: const FlDotData(show: false),
                belowBarData: BarAreaData(
                  show: true,
                  gradient: LinearGradient(
                    colors: [
                      AppColors.primary.withOpacity(0.5),
                      Colors.transparent,
                    ],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}