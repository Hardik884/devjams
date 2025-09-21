import 'package:flutter/material.dart';

class AppTheme {
  // Colors based on the reference fintech image
  // Very dark navy/black backgrounds
  static const Color darkNavy = Color(0xFF0A0E27);
  static const Color darkBlue = Color(0xFF1A1D3A);
  static const Color cardDark = Color(0xFF1E2139);
  static const Color borderDark = Color(0xFF2A2D4A);
  
  // Grays for text hierarchy
  static const Color gray900 = Color(0xFF0A0E27); // Main background
  static const Color gray800 = Color(0xFF1A1D3A); // Card backgrounds
  static const Color gray700 = Color(0xFF2A2D4A); // Borders
  static const Color gray600 = Color(0xFF4B5563);
  static const Color gray500 = Color(0xFF6B7280);
  static const Color gray400 = Color(0xFF9CA3AF);
  static const Color gray300 = Color(0xFFD1D5DB);
  static const Color gray200 = Color(0xFFE5E7EB);
  static const Color gray100 = Color(0xFFF3F4F6);
  
  // Accent colors matching the reference
  static const Color electricBlue = Color(0xFF4A90FF); // Primary blue accent
  static const Color brightBlue = Color(0xFF3B82F6);
  static const Color lightBlue = Color(0xFF60A5FA);
  
  // Status colors
  static const Color successGreen = Color(0xFF00D4AA); // Bright green for gains
  static const Color warningYellow = Color(0xFFFFC107);
  static const Color errorRed = Color(0xFFFF4757); // Bright red for losses
  
  // Additional accent colors
  static const Color purple = Color(0xFF8B5CF6);
  static const Color orange = Color(0xFFFF9500);

  // Missing color properties that screens are looking for
  static const Color blue500 = Color(0xFF3B82F6);
  static const Color blue400 = Color(0xFF60A5FA);
  static const Color green500 = Color(0xFF10B981);
  static const Color green400 = Color(0xFF34D399);
  static const Color yellow500 = Color(0xFFF59E0B);
  static const Color yellow400 = Color(0xFFFBBF24);
  static const Color red500 = Color(0xFFEF4444);
  static const Color red400 = Color(0xFFF87171);

  // Light theme for completeness (though fintech apps typically use dark)
  static ThemeData get lightTheme {
    return ThemeData(
      brightness: Brightness.light,
      scaffoldBackgroundColor: Colors.white,
      primaryColor: electricBlue,
      colorScheme: const ColorScheme.light(
        primary: electricBlue,
        secondary: successGreen,
        surface: Colors.white,
        error: errorRed,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: Colors.black,
        onError: Colors.white,
        brightness: Brightness.light,
      ),
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: darkNavy,
      primaryColor: electricBlue,
      
      // App Bar Theme
      appBarTheme: const AppBarTheme(
        backgroundColor: darkNavy,
        elevation: 0,
        iconTheme: IconThemeData(color: Colors.white),
        titleTextStyle: TextStyle(
          color: Colors.white,
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
      ),
      
      // Card Theme - Fixed type and deprecated method
      cardTheme: CardThemeData(
        color: cardDark,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: borderDark.withValues(alpha: 0.5), width: 1),
        ),
        shadowColor: Colors.transparent,
      ),
      
      // Text Theme - High contrast
      textTheme: const TextTheme(
        headlineLarge: TextStyle(
          color: Colors.white,
          fontSize: 28,
          fontWeight: FontWeight.w700,
          height: 1.2,
        ),
        headlineMedium: TextStyle(
          color: Colors.white,
          fontSize: 24,
          fontWeight: FontWeight.w600,
          height: 1.3,
        ),
        headlineSmall: TextStyle(
          color: Colors.white,
          fontSize: 20,
          fontWeight: FontWeight.w600,
          height: 1.3,
        ),
        titleLarge: TextStyle(
          color: Colors.white,
          fontSize: 18,
          fontWeight: FontWeight.w600,
          height: 1.4,
        ),
        titleMedium: TextStyle(
          color: Colors.white,
          fontSize: 16,
          fontWeight: FontWeight.w600,
          height: 1.4,
        ),
        titleSmall: TextStyle(
          color: Colors.white,
          fontSize: 14,
          fontWeight: FontWeight.w600,
          height: 1.4,
        ),
        bodyLarge: TextStyle(
          color: Colors.white,
          fontSize: 16,
          fontWeight: FontWeight.w400,
          height: 1.5,
        ),
        bodyMedium: TextStyle(
          color: Colors.white,
          fontSize: 14,
          fontWeight: FontWeight.w400,
          height: 1.5,
        ),
        bodySmall: TextStyle(
          color: gray400,
          fontSize: 12,
          fontWeight: FontWeight.w400,
          height: 1.4,
        ),
      ),
      
      // Button Theme
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: electricBlue,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          elevation: 0,
          shadowColor: Colors.transparent,
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      
      // Outlined Button Theme
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: Colors.white,
          side: const BorderSide(color: borderDark, width: 1),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      
      // Icon Theme
      iconTheme: const IconThemeData(
        color: gray400,
        size: 24,
      ),
      
 
      
      // Input Decoration Theme
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: cardDark,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: borderDark),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: borderDark),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: electricBlue, width: 2),
        ),
        hintStyle: const TextStyle(color: gray400),
        labelStyle: const TextStyle(color: gray400),
      ),
      
      // Switch Theme - Updated to use WidgetStateProperty
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return electricBlue;
          }
          return gray500;
        }),
        trackColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return electricBlue.withValues(alpha: 0.5);
          }
          return gray700;
        }),
      ),
      
      // Slider Theme
      sliderTheme: SliderThemeData(
        activeTrackColor: electricBlue,
        inactiveTrackColor: gray700,
        thumbColor: electricBlue,
        overlayColor: electricBlue.withValues(alpha: 0.2),
        trackHeight: 8,
        thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 10),
        overlayShape: const RoundSliderOverlayShape(overlayRadius: 20),
      ),
      
      // ColorScheme - Fixed deprecated background/onBackground
      colorScheme: const ColorScheme.dark(
        primary: electricBlue,
        secondary: successGreen,
        surface: cardDark,
        error: errorRed,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: Colors.white,
        onError: Colors.white,
        brightness: Brightness.dark,
      ).copyWith(
        tertiary: warningYellow,
      ),
    );
  }
}