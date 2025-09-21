import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import '../services/portfolio_setup_service.dart';
import '../models/portfolio_data.dart';
import '../models/rebalance_model.dart';
import '../models/news_model.dart';
import '../services/portfolio_service.dart';
import '../services/rebalancing_service.dart';
import '../services/news_service.dart';
import '../models/search_result_model.dart';
import '../services/auth_service.dart';
import 'package:provider/provider.dart';

class AppStateProvider extends ChangeNotifier {
  int _currentTabIndex = 0;
  bool _showSettings = false;
  bool _showSearch = false;
  bool _showAccountSettings = false;
  bool _showNotificationsSettings = false;
  bool _showPrivacySettings = false;
  bool _showAppearanceSettings = false;

  PortfolioData _portfolioData = const PortfolioData(
    totalValue: 0.0,
    valueChange: 0.0,
    valueChangePercent: 0.0,
    riskScore: 0,
    performanceHistory: {},
    holdings: [],
  );

  String _selectedTimeframe = '1M';
  final PortfolioService _portfolioService = PortfolioService();
  
  final PortfolioSetupService _portfolioSetupService;
  final AuthService _authService;

  List<RebalanceRecommendation> _rebalancingSuggestions = [];
  List<RebalanceRecommendation> get rebalancingSuggestions =>
      _rebalancingSuggestions;
  final RebalancingService _rebalancingService = RebalancingService();

  bool _isLoggedIn = false;

  String? _userName;
  String? _email;
  String? _phone;

  bool _isDisposed = false;

  final NewsService _newsService = NewsService();
  List<NewsItem> _newsItems = [];
  List<NewsItem> get newsItems => _newsItems;
  
  final List<SearchResult> _wishlistedStocks = [];
  List<SearchResult> get wishlistedStocks => _wishlistedStocks;

  int get currentTabIndex => _currentTabIndex;
  bool get showSettings => _showSettings;
  bool get showSearch => _showSearch;
  bool get showAccountSettings => _showAccountSettings;
  bool get showNotificationsSettings => _showNotificationsSettings;
  bool get showPrivacySettings => _showPrivacySettings;
  bool get showAppearanceSettings => _showAppearanceSettings;
  PortfolioData get portfolioData => _portfolioData;
  bool get isLoggedIn => _isLoggedIn;

  String get userName => _userName ?? 'Unknown User';
  String get email => _email ?? 'No Email';
  String get phone => _phone ?? '';
  String get selectedTimeframe => _selectedTimeframe;
  List<double> get performanceChartData =>
      _portfolioData.performanceHistory[_selectedTimeframe] ?? [];

  String get formattedTotalValue => _portfolioData.formattedTotalValue;
  String get formattedValueChange => _portfolioData.formattedValueChange;
  String get formattedValueChangePercent =>
      _portfolioData.formattedValueChangePercent;
  bool get isPositiveChange => _portfolioData.isPositiveChange;

  AppStateProvider({
    required AuthService authService,
    required PortfolioSetupService portfolioSetupService,
  }) : _authService = authService, _portfolioSetupService = portfolioSetupService;

  void safeNotifyListeners() {
    if (!_isDisposed) notifyListeners();
  }

  @override
  void dispose() {
    _isDisposed = true;
    super.dispose();
  }

  void setCurrentTab(int index) {
    _currentTabIndex = index;
    safeNotifyListeners();
  }

  // ---------- Settings Toggles ----------
  void showSettingsPage() {
    _showSettings = true;
    safeNotifyListeners();
  }

  void hideSettingsPage() {
    _showSettings = false;
    safeNotifyListeners();
  }

  void showSearchOverlay() {
    _showSearch = true;
    safeNotifyListeners();
  }

  void hideSearchOverlay() {
    _showSearch = false;
    safeNotifyListeners();
  }

  void showAccountSettingsPage() {
    _showAccountSettings = true;
    safeNotifyListeners();
  }

  void hideAccountSettingsPage() {
    _showAccountSettings = false;
    safeNotifyListeners();
  }

  void showNotificationsSettingsPage() {
    _showNotificationsSettings = true;
    safeNotifyListeners();
  }

  void hideNotificationsSettingsPage() {
    _showNotificationsSettings = false;
    safeNotifyListeners();
  }

  void showPrivacySettingsPage() {
    _showPrivacySettings = true;
    safeNotifyListeners();
  }

  void hidePrivacySettingsPage() {
    _showPrivacySettings = false;
    safeNotifyListeners();
  }

  void showAppearanceSettingsPage() {
    _showAppearanceSettings = true;
    safeNotifyListeners();
  }

  void hideAppearanceSettingsPage() {
    _showAppearanceSettings = false;
    safeNotifyListeners();
  }

  // ---------- Portfolio ----------
  void updatePortfolioData(PortfolioData newData) {
    _portfolioData = newData;
    _selectedTimeframe =
        _portfolioData.performanceHistory.containsKey(_selectedTimeframe)
            ? _selectedTimeframe
            : (_portfolioData.performanceHistory.isNotEmpty
                ? _portfolioData.performanceHistory.keys.first
                : '1M');
    safeNotifyListeners();
  }

  void updateUserInfo({
    required String userName,
    required String email,
    String? phone,
  }) {
    _userName = userName;
    _email = email;
    _phone = phone;
    debugPrint('User info updated: $_userName | $_email | $_phone');
    safeNotifyListeners();
  }

  void setSelectedTimeframe(String timeframe) {
    _selectedTimeframe = _portfolioData.performanceHistory.containsKey(timeframe)
        ? timeframe
        : (_portfolioData.performanceHistory.isNotEmpty
            ? _portfolioData.performanceHistory.keys.first
            : '1M');
    safeNotifyListeners();
  }

  Future<void> loadPortfolio() async {
    try {
      final data = await _portfolioService.fetchPortfolioData();
      updatePortfolioData(data);
      await loadRebalancingSuggestions();
    } catch (e) {
      debugPrint('Failed to load portfolio: $e');
    }
  }

  Future<bool> checkForExistingPortfolio() async {
    return await _portfolioSetupService.hasUserPortfolio();
  }

  Future<void> createPortfolio(
    String name,
    String? description,
    File excelFile,
  ) async {
    try {
      await _portfolioSetupService.createInitialPortfolio(name, description, excelFile);
      await loadPortfolio();
    } catch (e) {
      debugPrint('Failed to create portfolio: $e');
      rethrow;
    }
  }

  Future<void> updateExistingPortfolio(
    String name,
    String? description,
    File excelFile,
  ) async {
    try {
      await _portfolioSetupService.updatePortfolio(name, description, excelFile);
      await loadPortfolio();
    } catch (e) {
      debugPrint('Failed to update portfolio: $e');
      rethrow;
    }
  }

  // ---------- Auth ----------
  // ✅ Removed login, logout, and initializeUser methods as they are no longer needed here.

  // ---------- Rebalancing ----------
  Future<void> loadRebalancingSuggestions() async {
    try {
      final suggestions =
          await _rebalancingService.fetchSuggestions(_portfolioData);
      _rebalancingSuggestions = suggestions;
      safeNotifyListeners();
    } catch (e) {
      debugPrint('Failed to load rebalancing suggestions: $e');
    }
  }

  void updateRebalancingSuggestions(
      List<RebalanceRecommendation> newSuggestions) {
    _rebalancingSuggestions = newSuggestions;
    safeNotifyListeners();
  }

  // ---------- News ----------
  Future<void> loadNews() async {
    try {
      final data = await _newsService.getLatestNews();
      _newsItems = data;
      safeNotifyListeners();
    } catch (e) {
      debugPrint("Failed to load news: $e");
    }
  }

  // ---------- Wishlist ----------
  bool isStockWishlisted(String symbol) {
    return _wishlistedStocks.any((stock) => stock.symbol == symbol);
  }

  void addToWishlist(SearchResult stock) {
    if (!isStockWishlisted(stock.symbol)) {
      _wishlistedStocks.add(stock);
      safeNotifyListeners();
    }
  }

  void removeFromWishlist(SearchResult stock) {
    _wishlistedStocks.removeWhere((item) => item.symbol == stock.symbol);
    safeNotifyListeners();
  }

  void initializeUser() {
    final user = _authService.currentUser;
    if (user != null) {
      _isLoggedIn = true;
      updateUserInfo(
        // ✅ Corrected user data access to use direct fields
        userName: '${user.firstName ?? ''} ${user.lastName ?? ''}'.trim(),
        email: user.email,
        phone: user.phone ?? '',
      );
      loadPortfolio();
      loadNews();
    }
  }
}