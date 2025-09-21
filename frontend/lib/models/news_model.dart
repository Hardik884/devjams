// lib/models/news_model.dart
class NewsItem {
  final String title;
  final String description;
  final String category;
  final DateTime date;

  NewsItem({
    required this.title,
    required this.description,
    required this.category,
    required this.date,
  });
}