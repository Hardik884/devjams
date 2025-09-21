import '../models/news_model.dart';

class NewsService {
  // Latest general news
  Future<List<NewsItem>> getLatestNews() async {
    await Future.delayed(const Duration(seconds: 1)); // simulate API delay
    return [
      NewsItem(
        title: "Market Opens Higher Today",
        description: "Nifty and Sensex show positive momentum...",
        category: "General",
        date: DateTime.now(),
      ),
      NewsItem(
        title: "Tech Stocks Rally",
        description: "Infosys, TCS, and HCL lead the IT sector gains...",
        category: "Sector",
        date: DateTime.now().subtract(const Duration(minutes: 30)),
      ),
      NewsItem(
        title: "Oil Prices Surge",
        description: "Crude oil hits new highs impacting energy stocks...",
        category: "Macro",
        date: DateTime.now().subtract(const Duration(hours: 1)),
      ),
    ];
  }

  // Curated News (stock-specific, sector, macroeconomic)
  Future<List<NewsItem>> getCuratedNews() async {
    await Future.delayed(const Duration(seconds: 1)); // simulate API delay
    return [
      NewsItem(
        title: "Infosys Q2 Earnings Beat Expectations",
        description: "Infosys reported higher-than-expected revenue this quarter...",
        category: "Stock",
        date: DateTime.now(),
      ),
      NewsItem(
        title: "Banking Sector Outlook",
        description: "The RBI's repo rate hike may impact banking sector...",
        category: "Sector",
        date: DateTime.now().subtract(const Duration(minutes: 30)),
      ),
      NewsItem(
        title: "US Inflation Data Released",
        description: "Macro update: US inflation rose by 0.4% this month...",
        category: "Macro",
        date: DateTime.now().subtract(const Duration(hours: 1)),
      ),
    ];
  }

  // Smart Alerts (repo rate changes, earnings, other key alerts)
  Future<List<NewsItem>> getSmartAlerts() async {
    await Future.delayed(const Duration(seconds: 1)); // simulate API delay
    return [
      NewsItem(
        title: "Repo rate up by 0.5%",
        description: "Defensive allocation suggested for equity portfolios.",
        category: "Alert",
        date: DateTime.now(),
      ),
      NewsItem(
        title: "Infosys Q2 Earnings",
        description: "Tech overweight suggested after earnings beat.",
        category: "Alert",
        date: DateTime.now().subtract(const Duration(minutes: 45)),
      ),
      NewsItem(
        title: "Oil Prices Surge",
        description: "Energy sector alert: consider reducing exposure to oil stocks.",
        category: "Alert",
        date: DateTime.now().subtract(const Duration(hours: 2)),
      ),
    ];
  }
}