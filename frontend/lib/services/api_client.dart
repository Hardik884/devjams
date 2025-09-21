import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

const String API_BASE_URL = 'http://localhost:8000/api';

class ApiClient {
  String? _token;
  String? get token => _token;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('authToken');
  }

  void setToken(String token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    prefs.setString('authToken', token);
  }

  void clearToken() async {
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    prefs.remove('authToken');
  }

  Future<Map<String, dynamic>> get(String endpoint) async {
    return _request('GET', endpoint);
  }

  Future<Map<String, dynamic>> post(String endpoint, {dynamic body}) async {
    return _request('POST', endpoint, body: body);
  }

  Future<Map<String, dynamic>> _request(String method, String endpoint, {dynamic body}) async {
    final url = Uri.parse('$API_BASE_URL$endpoint');
    final headers = {
      'Content-Type': 'application/json',
      if (_token != null) 'Authorization': 'Bearer $_token',
    };
    http.Response response;
    try {
      switch (method) {
        case 'GET':
          response = await http.get(url, headers: headers);
          break;
        case 'POST':
          response = await http.post(url, headers: headers, body: json.encode(body));
          break;
        default:
          throw Exception('Unsupported HTTP method: $method');
      }
      
      final responseData = json.decode(response.body);
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return responseData;
      } else {
        // Handle API error responses
        if (responseData is Map<String, dynamic> && responseData.containsKey('error')) {
          throw Exception(responseData['error']);
        } else if (responseData is Map<String, dynamic> && responseData.containsKey('message')) {
          throw Exception(responseData['message']);
        } else {
          throw Exception('API request failed with status code ${response.statusCode}');
        }
      }
    } catch (e) {
      if (e is Exception) {
        rethrow;
      }
      throw Exception('Network error: $e');
    }
  }
}