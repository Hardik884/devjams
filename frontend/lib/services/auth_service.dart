import 'dart:async';
import 'package:flutter/foundation.dart';
import './api_client.dart';

class MockUser {
  final String id;
  final String email;
  final String? firstName;
  final String? lastName;
  final String? phone;
  MockUser({required this.id, required this.email, this.firstName, this.lastName, this.phone});
  
  String get fullName => '${firstName ?? ''} ${lastName ?? ''}'.trim();

  factory MockUser.fromJson(Map<String, dynamic> json) {
    return MockUser(
      id: json['id'] as String,
      email: json['email'] as String,
      firstName: json['firstName'] as String?,
      lastName: json['lastName'] as String?,
      phone: json['phone'] as String?,
    );
  }
}

class MockAuthResponse {
  final MockUser? user;
  MockAuthResponse({this.user});
}

class AuthService with ChangeNotifier {
  final ApiClient _apiClient;
  MockUser? _currentUser;
  final StreamController<bool> _authStateController = StreamController<bool>.broadcast();
  Stream<bool> get onAuthStateChange => _authStateController.stream;

  AuthService(this._apiClient) {
    _checkInitialAuthStatus();
  }
  void _checkInitialAuthStatus() async {
    if (_apiClient.token != null) {
      try {
        final response = await _apiClient.get('/auth/me');
        _currentUser = MockUser.fromJson(response['user']);
        _authStateController.add(true);
      } catch (e) {
        _apiClient.clearToken();
        _authStateController.add(false);
      }
    } else {
      _authStateController.add(false);
    }
  }

  @override
  void dispose() {
    _authStateController.close();
    super.dispose();
  }

  MockUser? get currentUser => _currentUser;

  Future<MockUser?> signUp(String email, String password, String firstName, {String? lastName, String? phone}) async {
    try {
      final response = await _apiClient.post('/auth/register', body: {
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'password': password,
      });

      if (response['success'] == true) {
        _apiClient.setToken(response['token']);
        _currentUser = MockUser.fromJson(response['user']);
        _authStateController.add(true);
        notifyListeners();
        return _currentUser;
      } else {
        throw Exception(response['error'] ?? 'Sign up failed');
      }
    } catch (e) {
      throw Exception('Sign up failed: $e');
    }
  }

  Future<MockAuthResponse> signInWithPassword(String email, String password) async {
    try {
      final response = await _apiClient.post('/auth/login', body: {
        'email': email,
        'password': password,
      });

      if (response['success'] == true) {
        _apiClient.setToken(response['token']);
        _currentUser = MockUser.fromJson(response['user']);
        _authStateController.add(true);
        notifyListeners();
        return MockAuthResponse(user: _currentUser);
      } else {
        throw Exception(response['error'] ?? 'Login failed');
      }
    } catch (e) {
      throw Exception('Login failed: $e');
    }
  }

  Future<MockAuthResponse?> signInWithGoogle() async {
    // This part is a mock and should be replaced with a real Google OAuth flow.
    await Future.delayed(const Duration(seconds: 1));
    final user = MockUser(id: 'mock-google-user-001', email: 'google.user@example.com', firstName: 'Google', lastName: 'User');
    _currentUser = user;
    _authStateController.add(true);
    return MockAuthResponse(user: user);
  }

  Future<void> signOut() async {
    try {
      await _apiClient.post('/auth/logout');
      _apiClient.clearToken();
      _currentUser = null;
      _authStateController.add(false);
    } catch (e) {
      _apiClient.clearToken();
      _authStateController.add(false);
      debugPrint('Logout API call failed, but user session was cleared locally.');
    }
  }
}