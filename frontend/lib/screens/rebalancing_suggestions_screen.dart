import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../utils/app_colors.dart';
import '../widgets/elevated_card.dart';
import '../models/rebalance_model.dart';
import '../models/portfolio_data.dart'; // PortfolioData & AssetData

class RebalancingSuggestionsScreen extends StatefulWidget {
  final List<RebalanceRecommendation> recommendations;
  final PortfolioData? portfolio; // Optional portfolio

  const RebalancingSuggestionsScreen({
    super.key,
    this.recommendations = const [],
    this.portfolio,
  });

  @override
  State<RebalancingSuggestionsScreen> createState() =>
      _RebalancingSuggestionsScreenState();
}

class _RebalancingSuggestionsScreenState
    extends State<RebalancingSuggestionsScreen> {
  late List<RebalanceRecommendation> _recommendations;

  @override
  void initState() {
    super.initState();
    _recommendations = List.from(widget.recommendations);
  }

  void _applyAction(RebalanceRecommendation rec) {
    setState(() {
      _recommendations.remove(rec);
    });
    ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Applied ${rec.symbol} (${rec.actionString})')));
  }

  void _ignoreAction(RebalanceRecommendation rec) {
    setState(() {
      _recommendations.remove(rec);
    });
    ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Ignored ${rec.symbol}')));
  }

  @override
  Widget build(BuildContext context) {
    final buyRecs =
        _recommendations.where((r) => r.action == RebalanceAction.buy).toList();
    final sellRecs = _recommendations
        .where((r) => r.action == RebalanceAction.sell)
        .toList();
    final holdRecs = _recommendations
        .where((r) => r.action == RebalanceAction.hold)
        .toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(),
          const SizedBox(height: 24),

          // Portfolio Summary
          if (widget.portfolio != null) _buildPortfolioSummary(widget.portfolio!),
          if (widget.portfolio != null) const SizedBox(height: 16),
          if (widget.portfolio != null)
            _buildHoldingsList(widget.portfolio!.holdings),
          if (widget.portfolio != null) const SizedBox(height: 24),

          // Optimization Summary
          _buildSummaryCard(),
          const SizedBox(height: 24),

          // Sell / Buy / Hold Recommendations
          if (sellRecs.isNotEmpty)
            _buildRecommendationSection('Sell Recommendations', sellRecs, context),
          if (sellRecs.isNotEmpty) const SizedBox(height: 24),

          if (buyRecs.isNotEmpty)
            _buildRecommendationSection('Buy Recommendations', buyRecs, context),
          if (buyRecs.isNotEmpty) const SizedBox(height: 24),

          if (holdRecs.isNotEmpty)
            _buildRecommendationSection('Hold Recommendations', holdRecs, context),
          if (holdRecs.isNotEmpty) const SizedBox(height: 24),

          // RL Agent Recommendations (reusing all remaining recs with actions)
          if (_recommendations.isNotEmpty)
            _buildRLRecommendationsSection(context, _recommendations),
          const SizedBox(height: 24),

          // Projected Impact + Fees + Execute
          _buildProjectedImpact(),
          const SizedBox(height: 24),
          _buildFeesCard(),
          const SizedBox(height: 24),
          _buildExecuteButton(context),
        ],
      ),
    );
  }

  // ---------------- Header ----------------
  Widget _buildHeader() {
    return Row(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: AppColors.primary.withOpacity(0.2),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(Icons.bolt, color: AppColors.primary, size: 20),
        ),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Rebalancing Suggestions',
                style: GoogleFonts.inter(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: Colors.white)),
            Text('RL-optimized portfolio adjustments',
                style:
                    GoogleFonts.inter(fontSize: 14, color: Colors.grey[400])),
          ],
        ),
      ],
    );
  }

  // ---------------- Portfolio Summary ----------------
  Widget _buildPortfolioSummary(PortfolioData portfolio) {
    return ElevatedCard(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Portfolio Overview',
                style: GoogleFonts.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Colors.white)),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(portfolio.formattedTotalValue,
                        style: GoogleFonts.inter(
                            fontSize: 24,
                            fontWeight: FontWeight.w600,
                            color: Colors.white)),
                    Text(
                        '${portfolio.formattedValueChange} (${portfolio.formattedValueChangePercent})',
                        style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: portfolio.isPositiveChange
                                ? AppColors.success
                                : AppColors.error)),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(8)),
                  child: Text('Risk Score: ${portfolio.riskScore}',
                      style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: Colors.white)),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // ---------------- Holdings List ----------------
  Widget _buildHoldingsList(List<AssetData> holdings) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: holdings.map((asset) {
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          child: ElevatedCard(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  CircleAvatar(
                    backgroundImage: AssetImage(asset.iconUrl),
                    radius: 16,
                    backgroundColor: Colors.transparent,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(asset.symbol,
                              style: GoogleFonts.inter(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white)),
                          Text(asset.name,
                              style: GoogleFonts.inter(
                                  fontSize: 12, color: Colors.grey[400])),
                        ]),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(asset.formattedValue,
                          style: GoogleFonts.inter(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: Colors.white)),
                      Text(asset.formattedChangePercent,
                          style: GoogleFonts.inter(
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                              color: asset.isPositiveChange
                                  ? AppColors.success
                                  : AppColors.error)),
                    ],
                  )
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  // ---------------- Summary Card ----------------
  Widget _buildSummaryCard() {
    final totalAmount =
        _recommendations.fold<double>(0, (sum, r) => sum + r.amount);
    final totalDifferencePercent =
        _recommendations.fold<double>(0, (sum, r) => sum + r.difference);

    return ElevatedCard(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child:
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(
            children: [
              Icon(Icons.trending_up, color: AppColors.success, size: 20),
              const SizedBox(width: 8),
              Text('Optimization Summary',
                  style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.white)),
            ],
          ),
          const SizedBox(height: 12),
          RichText(
            text: TextSpan(
              style: GoogleFonts.inter(
                  fontSize: 14, color: Colors.grey[300], height: 1.5),
              children: [
                const TextSpan(text: 'Your portfolio is '),
                TextSpan(
                    text: '${totalDifferencePercent.toStringAsFixed(1)}%',
                    style: GoogleFonts.inter(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w600)),
                const TextSpan(
                    text:
                        ' away from optimal weights. The RL agent recommends rebalancing '),
                TextSpan(
                    text: '\$${totalAmount.toStringAsFixed(2)}',
                    style: GoogleFonts.inter(
                        color: AppColors.success,
                        fontWeight: FontWeight.w600)),
                const TextSpan(
                    text:
                        ' to improve risk-adjusted returns.'),
              ],
            ),
          ),
        ]),
      ),
    );
  }

  // ---------------- Buy/Sell/Hold Recommendation Section ----------------
  Widget _buildRecommendationSection(
      String title, List<RebalanceRecommendation> recs, BuildContext context) {
    final isBuy = title.toLowerCase().contains('buy');
    final isSell = title.toLowerCase().contains('sell');
    final icon = isBuy
        ? Icons.trending_up
        : isSell
            ? Icons.trending_down
            : Icons.pause_circle_filled;
    final iconColor =
        isBuy ? AppColors.success : isSell ? AppColors.error : AppColors.warning;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: iconColor, size: 16),
            const SizedBox(width: 8),
            Text(title,
                style: GoogleFonts.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Colors.white)),
          ],
        ),
        const SizedBox(height: 12),
        ...recs.map((rec) =>
            _buildRecommendationCard(rec, context, showActions: false)),
      ],
    );
  }

  // ---------------- Recommendation Card ----------------
  Widget _buildRecommendationCard(
      RebalanceRecommendation rec, BuildContext context,
      {bool showActions = false}) {
    final isBuy = rec.action == RebalanceAction.buy;
    final isSell = rec.action == RebalanceAction.sell;
    final actionColor =
        isBuy ? AppColors.success : isSell ? AppColors.error : AppColors.warning;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: ElevatedCard(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(children: [
            Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                      color: actionColor,
                      borderRadius: BorderRadius.circular(16)),
                  child: Center(
                    child: Text(rec.symbol[0],
                        style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: Colors.white)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(rec.symbol,
                            style: GoogleFonts.inter(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: Colors.white)),
                        Text(rec.name,
                            style: GoogleFonts.inter(
                                fontSize: 12, color: Colors.grey[400])),
                      ]),
                ),
                Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                  Text(rec.formattedAmount,
                      style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: actionColor)),
                  Text(rec.formattedPercentage,
                      style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: actionColor)),
                ]),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Current: ${rec.currentWeight.toStringAsFixed(1)}%',
                    style: GoogleFonts.inter(
                        fontSize: 12, color: Colors.grey[400])),
                Text('Target: ${rec.targetWeight.toStringAsFixed(1)}%',
                    style: GoogleFonts.inter(
                        fontSize: 12, color: Colors.grey[400])),
              ],
            ),
            const SizedBox(height: 8),
            _buildWeightProgressBar(rec),

            // ✅ Show Apply / Ignore buttons if RL
            if (showActions) ...[
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  OutlinedButton(
                    onPressed: () => _ignoreAction(rec),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.grey[300],
                      side: BorderSide(color: Colors.grey[600]!),
                    ),
                    child: const Text('Ignore'),
                  ),
                  const SizedBox(width: 12),
                  ElevatedButton(
                    onPressed: () => _applyAction(rec),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                    ),
                    child: Text('Apply', style: GoogleFonts.inter(color: Colors.white)),
                  ),
                ],
              )
            ]
          ]),
        ),
      ),
    );
  }

  // ---------------- Weight Progress Bar ----------------
  Widget _buildWeightProgressBar(RebalanceRecommendation rec) {
    final isBuy = rec.action == RebalanceAction.buy;
    final isSell = rec.action == RebalanceAction.sell;
    final actionColor =
        isBuy ? AppColors.success : isSell ? AppColors.error : AppColors.warning;

    final maxWeight =
        rec.currentWeight > rec.targetWeight ? rec.currentWeight : rec.targetWeight;

    final widthFactor = (rec.currentWeight / maxWeight).clamp(0.0, 1.0);
    final indicatorFactor = (rec.targetWeight / maxWeight).clamp(0.0, 1.0);

    return Container(
      height: 6,
      decoration: BoxDecoration(
          color: Colors.grey[700], borderRadius: BorderRadius.circular(3)),
      child: Stack(children: [
        FractionallySizedBox(
          widthFactor: widthFactor,
          child: Container(
            decoration: BoxDecoration(
                color: actionColor, borderRadius: BorderRadius.circular(3)),
          ),
        ),
        FractionallySizedBox(
          widthFactor: indicatorFactor,
          child: Align(
            alignment: Alignment.centerRight,
            child: Container(width: 2, height: 6, color: AppColors.primary),
          ),
        ),
      ]),
    );
  }

  // ---------------- RL Agent Recommendations ----------------
  Widget _buildRLRecommendationsSection(
      BuildContext context, List<RebalanceRecommendation> rlRecs) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('RL Agent Recommendations',
            style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.white)),
        const SizedBox(height: 12),
        ...rlRecs.map(
            (rec) => _buildRecommendationCard(rec, context, showActions: true)),
      ],
    );
  }

  // ---------------- Projected Impact ----------------
  Widget _buildProjectedImpact() {
    final totalBuy = _recommendations
        .where((r) => r.action == RebalanceAction.buy)
        .fold<double>(0, (sum, r) => sum + r.amount);
    final totalSell = _recommendations
        .where((r) => r.action == RebalanceAction.sell)
        .fold<double>(0, (sum, r) => sum + r.amount);
    final netChange = totalBuy - totalSell;

    final metrics = [
      {
        'label': 'Expected Return',
        'current': '8.4%',
        'projected': '${(8.4 + netChange / 10000).toStringAsFixed(1)}%',
        'improvement': '+${(netChange / 10000).toStringAsFixed(1)}%'
      },
      {
        'label': 'Portfolio Risk',
        'current': '14.2%',
        'projected': '${(14.2 - netChange / 20000).toStringAsFixed(1)}%',
        'improvement': '-${(netChange / 20000).toStringAsFixed(1)}%'
      },
      {
        'label': 'Sharpe Ratio',
        'current': '0.89',
        'projected': '${(0.89 + netChange / 50000).toStringAsFixed(2)}',
        'improvement': '+${(netChange / 50000).toStringAsFixed(2)}'
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Projected Impact',
            style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.white)),
        const SizedBox(height: 12),
        ...metrics.map((metric) => _buildMetricCard(metric)),
      ],
    );
  }

  Widget _buildMetricCard(Map<String, String> metric) {
    final improvement = metric['improvement']!;
    final isPositive = improvement.startsWith('+');
    final improvementColor = isPositive ? AppColors.success : AppColors.error;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: ElevatedCard(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Expanded(
                child: Text(metric['label']!,
                    style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: Colors.white)),
              ),
              Row(
                children: [
                  Text(metric['current']!,
                      style: GoogleFonts.inter(
                          fontSize: 14, color: Colors.grey[400])),
                  const SizedBox(width: 8),
                  Text('→',
                      style: GoogleFonts.inter(
                          fontSize: 14, color: Colors.grey[400])),
                  const SizedBox(width: 8),
                  Text(metric['projected']!,
                      style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.white)),
                  const SizedBox(width: 8),
                  Text(metric['improvement']!,
                      style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: improvementColor)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ---------------- Fees Card ----------------
  Widget _buildFeesCard() {
    return ElevatedCard(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Icon(Icons.account_balance_wallet,
                color: AppColors.primary, size: 20),
            const SizedBox(width: 8),
            Text('Estimated Costs',
                style: GoogleFonts.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Colors.white)),
          ]),
          const SizedBox(height: 12),
          _buildFeeRow('Transaction Fees', '\$12.40'),
          _buildFeeRow('Slippage Estimate', '\$8.75'),
          _buildFeeRow('Tax Implications', 'Handled automatically',
              isSecondary: true),
        ]),
      ),
    );
  }

  Widget _buildFeeRow(String label, String value, {bool isSecondary = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child:
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text(label,
            style: GoogleFonts.inter(
                fontSize: 14,
                color: isSecondary ? Colors.grey[400] : Colors.grey[300])),
        Text(value,
            style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: Colors.white)),
      ]),
    );
  }

  // ---------------- Execute Button ----------------
  Widget _buildExecuteButton(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: () {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
              content: Text('Rebalance executed successfully!')));
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        child: Text('Execute Rebalance',
            style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.white)),
      ),
    );
  }
}