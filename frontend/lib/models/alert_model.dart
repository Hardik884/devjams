class AlertItem {
  final String title;
  final String description;
  final bool isPositive;
  final DateTime timestamp; // Add this

  AlertItem({
    required this.title,
    required this.description,
    required this.isPositive,
    required this.timestamp,
  });
}