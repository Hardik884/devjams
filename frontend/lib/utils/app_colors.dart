import 'package:flutter/material.dart';

class AppColors {
  // Primary brand colors
  static const Color primary = Color(0xFF4C4AEF);
  static const Color primaryDark = Color(0xFF3730A3);

  // Background colors for dark theme
  static const Color darkBackground = Color(0xFF0F0F0F);
  static const Color darkCard = Color(0xFF1E1E1E);
  static const Color darkSurface = Color(0xFF282828);

  // Text colors
  static const Color darkText = Colors.white;
  static const Color lightText = Color(0xFF1F2937);
  static const Color mutedText = Color(0xFF6B7280);

  // Status colors
  static const Color success = Color(0xFF10B981);
  static const Color error = Color(0xFFEF4444);
  static const Color warning = Color(0xFFF59E0B);
  static const Color info = Color(0xFF3B82F6);

  // Gray-scale colors
  static const Color gray400 = Color(0xFF9CA3AF);

  // Updated Gradient colors for the "crystal" effect
  static const List<Color> backgroundGradient = [
    Color(0xFF0A0A0A),
    Color(0xFF15082E),
    Color(0xFF0A0A0A),
  ];

  static const List<Color> blueGradient = [
    Color(0xFF1E3A8A),
    Colors.transparent,
    Color(0xFF581C87),
  ];

  // Define the missing colors using your existing palette
  static const Color positiveGreen = success;
  static const Color negativeRed = error;

  // Color schemes
  static const ColorScheme lightColorScheme = ColorScheme.light(
    primary: primary,
    onPrimary: Colors.white,
    secondary: Color(0xFFF3F4F6),
    onSecondary: Color(0xFF1F2937),
    surface: Colors.white,
    onSurface: Color(0xFF1F2937),
    error: error,
    onError: Colors.white,
  );

  static const ColorScheme darkColorScheme = ColorScheme.dark(
    primary: primary,
    onPrimary: Colors.white,
    secondary: Color(0xFF374151),
    onSecondary: Colors.white,
    surface: darkCard,
    onSurface: Colors.white,
    error: error,
    onError: Colors.white,
  );
}