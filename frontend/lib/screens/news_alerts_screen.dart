// lib/screens/news_alerts_screen.dart
import 'package:flutter/material.dart';
import '../models/news_model.dart';
import '../services/news_service.dart';
import '../widgets/elevated_card.dart';
import '../widgets/gradient_background.dart';
import '../utils/app_colors.dart';
import '../screens/NewsDetailScreen.dart'; // Import the new screen

class NewsAlertsScreen extends StatefulWidget {
  const NewsAlertsScreen({super.key});

  @override
  State<NewsAlertsScreen> createState() => _NewsAlertsScreenState();
}

class _NewsAlertsScreenState extends State<NewsAlertsScreen>
    with SingleTickerProviderStateMixin {
  final NewsService _newsService = NewsService();

  late Future<List<NewsItem>> curatedNewsFuture;
  late Future<List<NewsItem>> smartAlertsFuture;

  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    curatedNewsFuture = _newsService.getCuratedNews();
    smartAlertsFuture = _newsService.getSmartAlerts();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        title: Text(
          "Market News & Alerts",
          style: TextStyle(
            color: AppColors.darkText,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primary,
          labelColor: AppColors.darkText,
          unselectedLabelColor: Colors.white54,
          tabs: const [
            Tab(text: "Curated News"),
            Tab(text: "Smart Alerts"),
          ],
        ),
      ),
      body: Stack(
        children: [
          const GradientBackground(),
          TabBarView(
            controller: _tabController,
            children: [
              _buildNewsTab(curatedNewsFuture),
              _buildNewsTab(smartAlertsFuture),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildNewsTab(Future<List<NewsItem>> newsFuture) {
    return FutureBuilder<List<NewsItem>>(
      future: newsFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        } else if (snapshot.hasError) {
          return Center(
            child: Text(
              "Error: ${snapshot.error}",
              style: TextStyle(color: AppColors.darkText),
            ),
          );
        } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return Center(
            child: Text(
              "No news available",
              style: TextStyle(color: AppColors.darkText),
            ),
          );
        }

        final newsList = snapshot.data!;
        return Center(
          child: Container(
            constraints: const BoxConstraints(maxWidth: 428),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            child: ListView.separated(
              itemCount: newsList.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final news = newsList[index];
                return ElevatedCard(
                  padding: const EdgeInsets.all(16),
                  onTap: () {
                    // Navigate to the NewsDetailScreen when the card is tapped
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => NewsDetailScreen(newsItem: news),
                      ),
                    );
                  },
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Title
                      Text(
                        news.title,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 8),
                      // Description
                      Text(
                        news.description,
                        style: const TextStyle(
                          color: AppColors.mutedText,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 12),
                      // Footer
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            news.category,
                            style: const TextStyle(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w500,
                              fontSize: 12,
                            ),
                          ),
                          Text(
                            "${news.date.hour}:${news.date.minute.toString().padLeft(2, '0')}",
                            style: const TextStyle(
                              color: AppColors.mutedText,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        );
      },
    );
  }
}

