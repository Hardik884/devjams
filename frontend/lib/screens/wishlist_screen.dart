import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../providers/app_state_provider.dart';
import '../utils/app_colors.dart';
import '../widgets/elevated_card.dart';
import '../widgets/gradient_background.dart';
import '../models/search_result_model.dart';
import '../screens/stock_detail_screen.dart'; // ✅ Import StockDetailScreen

class WishlistScreen extends StatelessWidget {
  const WishlistScreen({super.key});

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
                      final wishlistedStocks = appState.wishlistedStocks;
                      if (wishlistedStocks.isEmpty) {
                        return Center(
                          child: Text(
                            "Your wishlist is empty.",
                            style: GoogleFonts.inter(color: Colors.white),
                          ),
                        );
                      }
                      return ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: wishlistedStocks.length,
                        itemBuilder: (context, index) {
                          final stock = wishlistedStocks[index];
                          return _buildWishlistStockItem(context, stock);
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

  Widget _buildWishlistStockItem(BuildContext context, SearchResult stock) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      // ✅ Wrap the ElevatedCard in a GestureDetector
      child: GestureDetector(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => StockDetailScreen(stock: stock),
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
                    stock.symbol,
                    style: GoogleFonts.inter(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  Text(
                    stock.name,
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: AppColors.mutedText,
                    ),
                  ),
                ],
              ),
              IconButton(
                icon: const Icon(Icons.favorite, color: AppColors.error),
                onPressed: () {
                  Provider.of<AppStateProvider>(context, listen: false).removeFromWishlist(stock);
                },
              ),
            ],
          ),
        ),
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
            'My Wishlist',
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
}