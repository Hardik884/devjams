import 'package:flutter/material.dart';
import '../screens/news_alerts_screen.dart';
import '../screens/smart_alerts_screen.dart';
import '../screens/update_portfolio_screen.dart';
import '../screens/stocks_page.dart';
import '../screens/wishlist_screen.dart';
import '../widgets/gradient_background.dart';
import '../utils/app_colors.dart';
import '../theme/app_theme.dart';

class MoreScreen extends StatelessWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return FractionallySizedBox(
      heightFactor: 0.45, // slightly increased for more space
      child: ClipRRect(
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        child: Stack(
          children: [
            const GradientBackground(),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 40,
                    height: 4,
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                      color: Colors.white24,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const Text(
                    "More Options",
                    style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.white),
                  ),
                  const SizedBox(height: 16),
                  Expanded(
                    child: GridView.count(
                      crossAxisCount: 3,
                      shrinkWrap: true,
                      crossAxisSpacing: 16,
                      mainAxisSpacing: 16,
                      physics: const NeverScrollableScrollPhysics(),
                      children: [
                        _buildOption(context, Icons.article, "News", const NewsAlertsScreen()),
                        _buildOption(context, Icons.notifications_active, "Alerts", const SmartAlertsScreen()),
                        _buildOption(context, Icons.refresh, "Update Portfolio", const UpdatePortfolioScreen()),
                        _buildOption(context, Icons.inventory, "My Stocks", const StocksPage()),
                        _buildOption(context, Icons.favorite, "Wishlist", const WishlistScreen()),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOption(BuildContext context, IconData icon, String label, Widget screen) {
    final iconColor = AppTheme.darkTheme.iconTheme.color ?? AppColors.primary;

    return GestureDetector(
      onTap: () {
        Navigator.pop(context);
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => screen),
        );
      },
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.4),
              borderRadius: BorderRadius.circular(12),
            ),
            padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 20),
            child: Icon(icon, color: iconColor, size: 32),
          ),
          const SizedBox(height: 12),
          Text(
            label,
            style: const TextStyle(color: Colors.white, fontSize: 14),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}