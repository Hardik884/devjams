import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state_provider.dart';
import '../widgets/gradient_background.dart';
import '../widgets/custom_app_bar.dart';
import '../widgets/custom_bottom_navigation.dart';
import '../screens/portfolio_overview_screen.dart';
import '../screens/backtesting_screen.dart';
import '../screens/rebalancing_suggestions_screen.dart';
import '../screens/charts_analytics_screen.dart';
import '../screens/performance_insights_screen.dart';
import '../screens/more_screen.dart';
import '../screens/chatbot_screen.dart'; // ✅ Import the new chatbot screen
import '../widgets/settings_overlay.dart';
import '../widgets/search_overlay.dart';
import '../widgets/account_settings_overlay.dart';
import '../widgets/notifications_settings_overlay.dart';
import '../widgets/privacy_settings_overlay.dart';
import '../widgets/appearance_settings_overlay.dart';

class MainScreen extends StatelessWidget {
  const MainScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AppStateProvider>(
      builder: (context, appState, child) {
        return Stack(
          children: [
            Scaffold(
              extendBodyBehindAppBar: true,
              backgroundColor: Colors.transparent,
              body: Stack(
                children: [
                  const GradientBackground(),
                  Column(
                    children: [
                      // ✅ Pass the new onChatbotTap callback
                      CustomAppBar(
                        onAvatarTap: appState.showSettingsPage,
                        onSearchTap: appState.showSearchOverlay,
                        onChatbotTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => const ChatbotScreen()),
                          );
                        },
                      ),
                      Expanded(
                        child: Container(
                          constraints: const BoxConstraints(maxWidth: 428),
                          margin: const EdgeInsets.symmetric(horizontal: 16),
                          child: _buildCurrentScreen(context, appState.currentTabIndex),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              bottomNavigationBar: CustomBottomNavigation(
                currentIndex: appState.currentTabIndex,
                onTap: (index) {
                  if (index == 5) {
                    showModalBottomSheet(
                      context: context,
                      backgroundColor: Colors.transparent,
                      isScrollControlled: true,
                      builder: (_) => const MoreScreen(),
                    );
                  } else {
                    appState.setCurrentTab(index);
                  }
                },
              ),
            ),
            if (appState.showSearch) SearchOverlay(onClose: appState.hideSearchOverlay),
            if (appState.showSettings)
              SettingsOverlay(
                onClose: appState.hideSettingsPage,
                onNavigateToAccount: appState.showAccountSettingsPage,
                onNavigateToNotifications: appState.showNotificationsSettingsPage,
                onNavigateToPrivacy: appState.showPrivacySettingsPage,
                onNavigateToAppearance: appState.showAppearanceSettingsPage,
              ),
            if (appState.showAccountSettings)
              AccountSettingsOverlay(onClose: appState.hideAccountSettingsPage),
            if (appState.showNotificationsSettings)
              NotificationsSettingsOverlay(onClose: appState.hideNotificationsSettingsPage),
            if (appState.showPrivacySettings)
              PrivacySettingsOverlay(onClose: appState.hidePrivacySettingsPage),
            if (appState.showAppearanceSettings)
              AppearanceSettingsOverlay(onClose: appState.hideAppearanceSettingsPage),
          ],
        );
      },
    );
  }

  Widget _buildCurrentScreen(BuildContext context, int index) {
    switch (index) {
      case 0:
        return const PortfolioOverviewScreen();
      case 1:
        return const BacktestingScreen();
      case 2:
        final suggestions = context.watch<AppStateProvider>().rebalancingSuggestions;
        if (suggestions.isEmpty) {
          return const Center(child: CircularProgressIndicator());
        }
        return RebalancingSuggestionsScreen(recommendations: suggestions);
      case 3:
        return const ChartsAnalyticsScreen();
      case 4:
        return const PerformanceInsightsScreen();
      default:
        return const PortfolioOverviewScreen();
    }
  }
}