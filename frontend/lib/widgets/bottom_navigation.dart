import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class CustomBottomNavigation extends StatelessWidget {
  final String activeTab;
  final Function(String) onTabChange;

  const CustomBottomNavigation({
    super.key,
    required this.activeTab,
    required this.onTabChange,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 80,
      decoration: const BoxDecoration(
        color: AppTheme.darkNavy,
        border: Border(
          top: BorderSide(color: AppTheme.borderDark, width: 1),
        ),
      ),
      child: SafeArea(
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _buildNavItem(
              icon: Icons.home_outlined,
              activeIcon: Icons.home,
              label: 'Overview',
              tabKey: 'overview',
            ),
            _buildNavItem(
              icon: Icons.analytics_outlined,
              activeIcon: Icons.analytics,
              label: 'Backtest',
              tabKey: 'backtest',
            ),
            _buildNavItem(
              icon: Icons.balance, // ✅ changed: balance_outlined not available
              activeIcon: Icons.account_balance, // ✅ close alternative
              label: 'Rebalance',
              tabKey: 'rebalance',
            ),
            _buildNavItem(
              icon: Icons.show_chart, // ✅ changed: show_chart_outlined not available
              activeIcon: Icons.insights, // ✅ better highlight
              label: 'Analytics',
              tabKey: 'analytics',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNavItem({
    required IconData icon,
    required IconData activeIcon,
    required String label,
    required String tabKey,
  }) {
    final isActive = activeTab == tabKey;

    return GestureDetector(
      onTap: () => onTabChange(tabKey),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
        decoration: BoxDecoration(
          color: isActive ? AppTheme.darkNavy.withOpacity(0.3) : Colors.transparent, // ✅ subtle highlight
          borderRadius: BorderRadius.circular(12), // ✅ makes selected item stand out
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              isActive ? activeIcon : icon,
              color: isActive ? AppTheme.electricBlue : AppTheme.gray500,
              size: 26, // ✅ slightly larger for clarity
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                color: isActive ? AppTheme.electricBlue : AppTheme.gray500,
                fontSize: 12,
                fontWeight: isActive ? FontWeight.bold : FontWeight.w600, // ✅ stronger emphasis
              ),
            ),
          ],
        ),
      ),
    );
  }
}