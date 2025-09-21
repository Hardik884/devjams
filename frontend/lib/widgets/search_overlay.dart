import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../utils/app_colors.dart';
import '../widgets/elevated_card.dart';
import '../widgets/gradient_background.dart';
import '../services/search_service.dart';
import '../models/search_result_model.dart';
import '../screens/stock_detail_screen.dart';

class SearchOverlay extends StatefulWidget {
  final VoidCallback onClose;
  const SearchOverlay({super.key, required this.onClose});

  @override
  State<SearchOverlay> createState() => _SearchOverlayState();
}

class _SearchOverlayState extends State<SearchOverlay>
    with SingleTickerProviderStateMixin {
  final SearchService _searchService = SearchService();
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _focusNode = FocusNode();

  List<String> _recentSearches = [];
  List<SearchResult> _trendingResults = [];
  List<SearchResult> _filteredResults = [];

  @override
  void initState() {
    super.initState();
    _animationController =
        AnimationController(duration: const Duration(milliseconds: 300), vsync: this);
    _fadeAnimation = CurvedAnimation(parent: _animationController, curve: Curves.easeInOut);
    _slideAnimation = Tween<Offset>(begin: const Offset(0, -1), end: Offset.zero)
        .animate(CurvedAnimation(parent: _animationController, curve: Curves.easeInOut));

    _animationController.forward();
    _fetchData();
    
    _searchController.addListener(_onSearchChanged);

    WidgetsBinding.instance.addPostFrameCallback((_) => _focusNode.requestFocus());
  }

  Future<void> _fetchData() async {
    final recents = await _searchService.getRecentSearches();
    final trending = await _searchService.getTrendingResults();
    setState(() {
      _recentSearches = recents;
      _trendingResults = trending;
      _filteredResults = trending;
    });
  }

  void _onSearchChanged() {
    final query = _searchController.text.toLowerCase();
    setState(() {
      if (query.isEmpty) {
        _filteredResults = _trendingResults;
      } else {
        _filteredResults = _trendingResults
            .where((result) =>
                result.symbol.toLowerCase().contains(query) ||
                result.name.toLowerCase().contains(query))
            .toList();
      }
    });
  }

  @override
  void dispose() {
    _animationController.dispose();
    _searchController.removeListener(_onSearchChanged);
    _searchController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  Future<void> _close() async {
    await _animationController.reverse();
    widget.onClose();
  }

  @override
  Widget build(BuildContext context) {
    return SlideTransition(
      position: _slideAnimation,
      child: FadeTransition(
        opacity: _fadeAnimation,
        child: Material(
          color: Colors.transparent,
          child: Stack(
            children: [
              const GradientBackground(),
              SafeArea(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildSearchBar(),
                    if (_searchController.text.isEmpty) ...[
                      _buildSectionTitle('Recent Searches', Icons.access_time),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Wrap(
                          spacing: 8.0,
                          runSpacing: 8.0,
                          children: _recentSearches
                              .map((symbol) => _buildPill(symbol, onTap: () {
                                    _searchController.text = symbol;
                                  }))
                              .toList(),
                        ),
                      ),
                      const SizedBox(height: 24),
                      _buildSectionTitle('Trending', Icons.trending_up),
                    ],
                    Expanded(
                      child: ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: _filteredResults.length,
                        itemBuilder: (context, index) =>
                            _buildTrendingItem(_filteredResults[index]),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
Widget _buildSearchBar() {
  return Container(
    padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
    child: TextField(
      controller: _searchController,
      focusNode: _focusNode,
      style: GoogleFonts.inter(color: Colors.black, fontSize: 16),
      decoration: InputDecoration(
        hintText: 'Search stocks, ETFs, or crypto...',
        hintStyle: GoogleFonts.inter(color: Colors.black45),
        prefixIcon: const Icon(Icons.search, color: Colors.black54),
        suffixIcon: IconButton(
          icon: const Icon(Icons.close, color: Colors.black54),
          onPressed: _close,
        ),
        filled: true,
        fillColor: const Color.fromARGB(255, 240, 237, 237), // keep input area white
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.grey), // 🔥 no blue glow
        ),
      ),
    ),
  );
}

  Widget _buildSectionTitle(String title, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Icon(icon, color: AppColors.mutedText, size: 20),
          const SizedBox(width: 8),
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: AppColors.mutedText,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPill(String text, {VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: AppColors.darkCard,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          text,
          style: GoogleFonts.inter(
            color: Colors.white,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
    );
  }

  Widget _buildTrendingItem(SearchResult result) {
    return GestureDetector(
      onTap: () {
        _close();
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => StockDetailScreen(stock: result),
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        child: ElevatedCard(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AppColors.darkSurface,
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      result.symbol[0],
                      style: GoogleFonts.inter(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        result.symbol,
                        style: GoogleFonts.inter(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        result.name,
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          color: AppColors.mutedText,
                        ),
                      ),
                    ],
                  ),
                ),
                _buildPill(result.type),
              ],
            ),
          ),
        ),
      ),
    );
  }
}