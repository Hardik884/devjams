import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../screens/LoginScreen.dart';
import 'main_screen.dart';
import 'splash_screen.dart';
import '../services/auth_service.dart'; // ✅ Import your mock AuthService

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    // ✅ Use a Consumer to get the AuthService instance
    final authService = Provider.of<AuthService>(context);

    // ✅ Listen to a new authentication stream from your mock AuthService
    return StreamBuilder<bool>(
      stream: authService.onAuthStateChange,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const SplashScreen();
        }
        
        // ✅ Check the boolean value from the mock stream
        if (snapshot.hasData && snapshot.data == true) {
          return const MainScreen();
        }
        
        // Otherwise, show the LoginScreen
        return const LoginScreen();
      },
    );
  }
}