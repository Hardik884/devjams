import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/theme_provider.dart';
import 'providers/app_state_provider.dart';
import 'services/auth_service.dart';
import 'services/portfolio_setup_service.dart';
import 'theme/app_theme.dart';
import 'screens/splash_screen.dart';
import 'screens/LoginScreen.dart';
import 'screens/SignUpScreen.dart';
import 'screens/main_screen.dart';
import 'services/api_client.dart'; // ✅ Import the new API client

// Global instance of ApiClient
final apiClient = ApiClient();

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await apiClient.init(); // ✅ Initialize the API client
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (_) => AuthService(apiClient)), // ✅ Pass the API client
        Provider(
          create: (context) => PortfolioSetupService(Provider.of<AuthService>(context, listen: false)),
        ),
        ChangeNotifierProvider(
          create: (context) {
            final authService = Provider.of<AuthService>(context, listen: false);
            final portfolioSetupService = Provider.of<PortfolioSetupService>(context, listen: false);
            final provider = AppStateProvider(authService: authService, portfolioSetupService: portfolioSetupService);
            provider.initializeUser(); 
            return provider;
          },
        ),
      ],
      child: Consumer<ThemeProvider>(
        builder: (context, themeProvider, child) {
          return MaterialApp(
            title: 'Portfolio Rebalancer',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: themeProvider.themeMode,
            initialRoute: '/',
            routes: {
              '/': (context) => const SplashScreen(),
              '/login': (context) => const LoginScreen(),
              '/signup': (context) => const SignUpScreen(),
              '/main': (context) => const MainScreen(),
            },
          );
        },
      ),
    );
  }
}