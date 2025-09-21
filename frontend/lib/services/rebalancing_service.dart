import '../models/rebalance_model.dart';
import '../models/portfolio_data.dart';

class RebalancingService {
  Future<List<RebalanceRecommendation>> fetchSuggestions(PortfolioData portfolio) async {
    await Future.delayed(const Duration(milliseconds: 500));

    // Dummy data
    return [
      RebalanceRecommendation(
        symbol: 'AAPL',
        name: 'Apple Inc.',
        currentWeight: 30,
        targetWeight: 25,
        amount: 5000,
        action: RebalanceAction.sell,
        reason: 'Reduce overweight position',
      ),
      RebalanceRecommendation(
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        currentWeight: 10,
        targetWeight: 15,
        amount: 3000,
        action: RebalanceAction.buy,
        reason: 'Increase allocation to target',
      ),
      RebalanceRecommendation(
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        currentWeight: 20,
        targetWeight: 20,
        amount: 0,
        action: RebalanceAction.hold,
        reason: 'Allocation is optimal',
      ),
    ];
  }
}