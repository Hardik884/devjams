import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../providers/app_state_provider.dart';
import '../utils/app_colors.dart';
import '../widgets/elevated_card.dart';
import '../widgets/gradient_background.dart';
import '../models/portfolio_data.dart';
import '../models/search_result_model.dart'; // ✅ Import SearchResult
import '../screens/stock_detail_screen.dart'; // ✅ Import StockDetailScreen

class StocksPage extends StatelessWidget {
  const StocksPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          const GradientBackground(),
          SafeArea(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(context),
                Expanded(
                  child: Consumer<AppStateProvider>(
                    builder: (context, appState, child) {
                      final holdings = appState.portfolioData.holdings;
                      if (holdings.isEmpty) {
                        return Center(
                          child: Text(
                            "No stocks in your portfolio.",
                            style: GoogleFonts.inter(color: Colors.white),
                          ),
                        );
                      }
                      return ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: holdings.length,
                        itemBuilder: (context, index) {
                          final holding = holdings[index];
                          return _buildStockItem(context, holding as AssetData); // ✅ Pass context
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => Navigator.pop(context),
          ),
          const SizedBox(width: 8),
          Text(
            'My Stocks',
            style: GoogleFonts.inter(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  // ✅ The method now accepts BuildContext as a parameter
  Widget _buildStockItem(BuildContext context, AssetData holding) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      // ✅ Wrap the ElevatedCard in a GestureDetector
      child: GestureDetector(
        onTap: () {
          // Create a SearchResult from AssetData to pass to StockDetailScreen
          final stockResult = SearchResult(
            symbol: holding.symbol,
            name: holding.name,
            type: 'Stock', // Assuming all holdings are 'Stock' type for this example
          );
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => StockDetailScreen(stock: stockResult),
            ),
          );
        },
        child: ElevatedCard(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    holding.symbol,
                    style: GoogleFonts.inter(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  Text(
                    holding.name,
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: AppColors.mutedText,
                    ),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    holding.formattedValue,
                    style: GoogleFonts.inter(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  Text(
                    holding.formattedChangePercent,
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: holding.isPositiveChange
                          ? AppColors.positiveGreen
                          : AppColors.negativeRed,
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