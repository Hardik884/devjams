import 'package:flutter/material.dart';

class HeatmapChart extends StatelessWidget {
  final List<List<double>> matrix;
  final List<String> labels;

  const HeatmapChart({super.key, required this.matrix, required this.labels});

  Color _colorForValue(double val) {
    if (val > 0.7) return Colors.green;
    if (val > 0.3) return Colors.yellow;
    return Colors.red;
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text("Correlation Heatmap", style: Theme.of(context).textTheme.titleMedium),
        Table(
          border: TableBorder.all(),
          children: [
            // Header row
            TableRow(
              children: [
                Container(
                  padding: const EdgeInsets.all(4),
                  child: const Text(""),
                ),
                ...labels.map((l) => Container(
                      padding: const EdgeInsets.all(4),
                      alignment: Alignment.center,
                      child: Text(l),
                    )),
              ],
            ),
            // Data rows
            for (int i = 0; i < matrix.length; i++)
              TableRow(
                children: [
                  Container(
                    padding: const EdgeInsets.all(4),
                    alignment: Alignment.center,
                    child: Text(labels[i]),
                  ),
                  ...matrix[i].map((val) => Container(
                        alignment: Alignment.center,
                        height: 30,
                        color: _colorForValue(val).withOpacity(0.6),
                        child: Text(val.toStringAsFixed(2)),
                      )),
                ],
              ),
          ],
        ),
      ],
    );
  }
}