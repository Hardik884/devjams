import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../models/search_result_model.dart';
import '../models/stock_data_model.dart';
import '../utils/app_colors.dart';
import '../widgets/gradient_background.dart';
import '../services/stock_data_service.dart';
import '../widgets/elevated_card.dart';
import '../widgets/stock_chart_widget.dart';
import '../providers/app_state_provider.dart';

class StockDetailScreen extends StatefulWidget {
  final SearchResult stock;

  const StockDetailScreen({super.key, required this.stock});

  @override
  State<StockDetailScreen> createState() => _StockDetailScreenState();
}

class _StockDetailScreenState extends State<StockDetailScreen>
    with SingleTickerProviderStateMixin {
  final StockDataService _stockDataService = StockDataService();
  late TabController _tabController;

  StockQuote? _stockQuote;
  CompanyProfile? _companyProfile;
  List<HistoricalDataPoint>? _historicalData;
  StockFundamentals? _stockFundamentals;
  TechnicalData? _technicalData;
  DerivativesData? _derivativesData;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _fetchStockData();
  }

  Future<void> _fetchStockData() async {
    try {
      final quote = await _stockDataService.fetchQuote(widget.stock.symbol);
      final profile =
          await _stockDataService.fetchCompanyProfile(widget.stock.symbol);
      final historical =
          await _stockDataService.fetchHistoricalData(widget.stock.symbol, 'D');
      final fundamentals =
          await _stockDataService.fetchFundamentals(widget.stock.symbol);
      final technical =
          await _stockDataService.fetchTechnicalData(widget.stock.symbol);
      final derivatives =
          await _stockDataService.fetchDerivativesData(widget.stock.symbol);

      setState(() {
        _stockQuote = StockQuote.fromJson(quote);
        _companyProfile = CompanyProfile.fromJson(profile);
        _historicalData = historical
            .map((json) => HistoricalDataPoint.fromJson(json))
            .toList();
        _stockFundamentals = StockFundamentals.fromJson(fundamentals);
        _technicalData = TechnicalData.fromJson(technical);
        _derivativesData = DerivativesData.fromJson(derivatives);
        _isLoading = false;
      });
    } catch (e) {
      print('Error fetching stock data: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          const GradientBackground(),
          SafeArea(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: AppColors.primary))
                : SingleChildScrollView(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildHeader(),
                          _buildPriceAndChange(),
                          const SizedBox(height: 24),
                          _buildTabBar(),
                          SizedBox(
                            height: MediaQuery.of(context).size.height * 0.6,
                            child: TabBarView(
                              controller: _tabController,
                              children: [
                                _buildOverviewTab(),
                                _buildTechnicalTab(),
                                _buildDerivativesTab(),
                                _buildFundamentalsTab(),
                              ],
                            ),
                          ),
                     
                        ],
                      ),
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: GoogleFonts.inter(color: AppColors.mutedText, fontSize: 16),
          ),
          Text(
            value,
            style: GoogleFonts.inter(
                color: Colors.white, fontSize: 16, fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Row(
      children: [
        IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () {
            Navigator.pop(context);
          },
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _companyProfile?.ticker ?? '',
                style: GoogleFonts.inter(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              Text(
                _companyProfile?.name ?? '',
                style: GoogleFonts.inter(
                  fontSize: 16,
                  color: AppColors.mutedText,
                ),
              ),
            ],
          ),
        ),
        // ✅ Add the wishlist icon here
        Consumer<AppStateProvider>(
          builder: (context, appState, child) {
            final isWishlisted = appState.isStockWishlisted(widget.stock.symbol);
            return IconButton(
              icon: Icon(
                isWishlisted ? Icons.favorite : Icons.favorite_border,
                color: isWishlisted ? AppColors.error : AppColors.mutedText,
              ),
              onPressed: () {
                if (isWishlisted) {
                  appState.removeFromWishlist(widget.stock);
                } else {
                  appState.addToWishlist(widget.stock);
                }
              },
            );
          },
        ),
      ],
    );
  }

  Widget _buildPriceAndChange() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (_stockQuote != null)
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '\$${_stockQuote!.currentPrice.toStringAsFixed(2)}',
                style: GoogleFonts.inter(
                  fontSize: 48,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '${_stockQuote!.change.toStringAsFixed(2)} (${_stockQuote!.percentChange.toStringAsFixed(2)}%)',
                style: GoogleFonts.inter(
                  fontSize: 20,
                  fontWeight: FontWeight.w500,
                  color: _stockQuote!.change >= 0
                      ? AppColors.positiveGreen
                      : AppColors.negativeRed,
                ),
              ),
            ],
          ),
      ],
    );
  }

Widget _buildTabBar() {
  return ElevatedCard(
    padding: const EdgeInsets.symmetric(vertical: 2, horizontal: 2),
    child: TabBar(
      controller: _tabController,
      labelColor: Colors.white,
      unselectedLabelColor: AppColors.mutedText,
      // ✅ Set the divider color to transparent to remove the white line
      dividerColor: Colors.transparent,
      indicator: BoxDecoration(
        color: AppColors.primary,
        borderRadius: BorderRadius.circular(8),
      ),
      labelStyle: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 10),
      unselectedLabelStyle: GoogleFonts.inter(fontWeight: FontWeight.normal, fontSize: 10),
      indicatorSize: TabBarIndicatorSize.tab,
      tabs: const [
        Tab(text: 'Overview'),
        Tab(text: 'Technical'),
        Tab(text: 'Derivative'),
        Tab(text: 'Fundamentals'),
      ],
    ),
  );
}

  Widget _buildOverviewTab() {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 24),
          Text(
            'Performance Chart',
            style: GoogleFonts.inter(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 250,
            child: StockChartWidget(historicalData: _historicalData ?? []),
          ),
        ],
      ),
    );
  }

  Widget _buildTechnicalTab() {
    if (_technicalData == null) {
      return const Center(child: CircularProgressIndicator());
    }
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 24),
          ElevatedCard(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Technical Indicators',
                  style: GoogleFonts.inter(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 12),
                _buildStatRow(
                    'RSI (14)', _technicalData!.rsi.toStringAsFixed(2)),
                _buildStatRow('MACD', _technicalData!.macd.toStringAsFixed(2)),
                _buildStatRow('Trend', _technicalData!.trend),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDerivativesTab() {
    if (_derivativesData == null) {
      return const Center(child: CircularProgressIndicator());
    }
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 24),
          ElevatedCard(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Derivatives Data',
                  style: GoogleFonts.inter(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 12),
                _buildStatRow(
                    'Open Interest', _derivativesData!.openInterest.toString()),
                _buildStatRow('Volume', _derivativesData!.volume.toString()),
                _buildStatRow('Contract Type', _derivativesData!.contractType),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFundamentalsTab() {
    if (_stockFundamentals == null) {
      return const Center(child: CircularProgressIndicator());
    }
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 24),
          Text(
            'Know Your Stock',
            style: GoogleFonts.inter(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildRatingCard(
                  _stockFundamentals!.qualityRating,
                  _stockFundamentals!.qualityDescription,
                  AppColors.positiveGreen),
              const SizedBox(width: 12),
              _buildRatingCard(
                  _stockFundamentals!.valuationRating,
                  _stockFundamentals!.valuationDescription,
                  AppColors.negativeRed),
              const SizedBox(width: 12),
              _buildRatingCard(_stockFundamentals!.financeRating,
                  _stockFundamentals!.financeDescription, AppColors.primary),
            ],
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildReturnCard(
                  '1 Year Return', _stockFundamentals!.oneYearReturn),
              const SizedBox(width: 12),
              _buildReturnCard(
                  'Sector Return', _stockFundamentals!.sectorReturn),
              const SizedBox(width: 12),
              _buildReturnCard(
                  'Market Return', _stockFundamentals!.marketReturn),
            ],
          ),
          const SizedBox(height: 24),
          Text(
            'Fundamental Ratios',
            style: GoogleFonts.inter(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildRatioCard('PE Ratio', _stockFundamentals!.peRatio),
              const SizedBox(width: 12),
              _buildRatioCard(
                  'Price to Book Value', _stockFundamentals!.priceToBookValue),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRatingCard(int rating, String description, Color color) {
    return Expanded(
      child: ElevatedCard(
        padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            SizedBox(
              width: 50,
              height: 50,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  CircularProgressIndicator(
                    value: rating / 5.0,
                    strokeWidth: 4,
                    color: color,
                    backgroundColor: AppColors.mutedText.withOpacity(0.3),
                  ),
                  Text(
                    '$rating/5',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Text(
              description,
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: 12,
                color: AppColors.mutedText,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReturnCard(String label, double value) {
    final bool isPositive = value >= 0;
    return Expanded(
      child: ElevatedCard(
        padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Text(
              '${value.toStringAsFixed(2)}%',
              style: GoogleFonts.inter(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: isPositive ? AppColors.positiveGreen : AppColors.negativeRed,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: 12,
                color: AppColors.mutedText,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRatioCard(String label, double value) {
    return Expanded(
      child: ElevatedCard(
        padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: GoogleFonts.inter(color: AppColors.mutedText, fontSize: 16),
            ),
            const SizedBox(height: 8),
            Text(
              value.toStringAsFixed(2),
              style: GoogleFonts.inter(
                color: Colors.white,
                fontSize: 28,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  
}