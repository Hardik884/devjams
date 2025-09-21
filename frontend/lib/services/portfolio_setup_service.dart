import 'dart:io';
import 'dart:async';
import 'package:flutter/foundation.dart';
import './auth_service.dart';

Map<String, bool> _portfolioStatus = {};

class PortfolioSetupService {
  final AuthService _authService; // ✅ Store the AuthService instance

  // ✅ New constructor to receive the AuthService
  PortfolioSetupService(this._authService);

  Future<bool> hasUserPortfolio() async {
    try {
      final userId = _authService.currentUser?.id;
      if (userId == null) {
        return false;
      }

      await Future.delayed(const Duration(milliseconds: 500));
      
      return _portfolioStatus[userId] ?? false;
      
    } catch (e) {
      debugPrint('Error checking for portfolio: $e');
      return false;
    }
  }

  Future<void> createInitialPortfolio(
    String name,
    String? description,
    File excelFile,
  ) async {
    try {
      final userId = _authService.currentUser?.id;
      if (userId == null) {
        throw Exception('User not logged in.');
      }
      
      debugPrint('API CALL: Creating portfolio for user $userId');
      await Future.delayed(const Duration(seconds: 2));
      debugPrint('API SUCCESS: Portfolio creation faked successfully.');

      _portfolioStatus[userId] = true;

    } catch (e) {
      debugPrint('API FAILED: $e');
      rethrow;
    }
  }

  Future<void> updatePortfolio(
    String name,
    String? description,
    File excelFile,
  ) async {
    try {
      final userId = _authService.currentUser?.id;
      if (userId == null) {
        throw Exception('User not logged in.');
      }

      debugPrint('API CALL: Updating portfolio for user $userId');
      await Future.delayed(const Duration(seconds: 2));
      debugPrint('API SUCCESS: Portfolio update faked successfully.');
    } catch (e) {
      debugPrint('API FAILED: $e');
      rethrow;
    }
  }
}