import '../models/search_result_model.dart';

class SearchService {
  // Dummy recent searches
  Future<List<String>> getRecentSearches() async {
    await Future.delayed(const Duration(milliseconds: 200));
    return ['AAPL', 'TSLA', 'NVDA', 'BTC'];
  }

  // Dummy trending results
  Future<List<SearchResult>> getTrendingResults() async {
    await Future.delayed(const Duration(milliseconds: 200));
    return [
      SearchResult(symbol: 'AAPL', name: 'Apple Inc.', type: 'Stock'),
      SearchResult(symbol: 'TSLA', name: 'Tesla Inc.', type: 'Stock'),
      SearchResult(symbol: 'BTC', name: 'Bitcoin', type: 'Crypto'),
      SearchResult(symbol: 'ETH', name: 'Ethereum', type: 'Crypto'),
      SearchResult(symbol: 'QQQ', name: 'Invesco QQQ Trust', type: 'ETF'),
      SearchResult(symbol: 'SPY', name: 'SPDR S&P 500', type: 'ETF'),
    ];
  }
}