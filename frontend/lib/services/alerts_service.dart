import '../models/alert_model.dart';

class AlertsService {
  Future<List<AlertItem>> getSmartAlerts() async {
    // Simulate network/API delay
    await Future.delayed(const Duration(milliseconds: 300));

    // Dummy data (can later be replaced with API response)
    return [
      AlertItem(
        title: "Repo rate up by 0.5%",
        description: "Defensive allocation suggested",
        isPositive: true,
        timestamp: DateTime.now().subtract(const Duration(minutes: 5)),
      ),
      AlertItem(
        title: "Infosys earnings beat expectations",
        description: "Tech overweight suggested",
        isPositive: true,
        timestamp: DateTime.now().subtract(const Duration(hours: 1, minutes: 20)),
      ),
      AlertItem(
        title: "Oil prices spike 5%",
        description: "Energy sector caution",
        isPositive: false,
        timestamp: DateTime.now().subtract(const Duration(hours: 3, minutes: 10)),
      ),
    ];
  }
}