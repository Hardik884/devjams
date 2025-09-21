import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/theme_provider.dart';
import '../utils/app_colors.dart';

class AppearanceSettingsOverlay extends StatelessWidget {
  final VoidCallback onClose;

  const AppearanceSettingsOverlay({
    super.key,
    required this.onClose,
  });

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;

    return Material(
      color: Colors.black54,
      child: TweenAnimationBuilder<double>(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeOutCubic,
        tween: Tween(begin: 1, end: 0),
        builder: (context, value, child) {
          return Transform.translate(
            offset: Offset(screenWidth * value, 0),
            child: child,
          );
        },
        child: Container(
          width: screenWidth,
          height: double.infinity,
          decoration: BoxDecoration(
            color: AppColors.darkBackground.withOpacity(0.95),
            borderRadius: BorderRadius.circular(0),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.6),
                blurRadius: 20,
                offset: const Offset(-6, 0),
              ),
            ],
          ),
          child: ClipRRect(
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
              child: SafeArea(
                child: Column(
                  children: [
                    // --- Header ---
                    Padding(
                      padding: const EdgeInsets.all(20),
                      child: Row(
                        children: [
                          IconButton(
                            onPressed: onClose,
                            icon: const Icon(Icons.arrow_back,
                                color: Colors.white),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Appearance',
                            style: GoogleFonts.inter(
                              fontSize: 24,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Divider(
                      color: Colors.white.withOpacity(0.15),
                      thickness: 0.5,
                    ),

                    // --- Content ---
                    Expanded(
                      child: Consumer<ThemeProvider>(
                        builder: (context, themeProvider, child) {
                          return ListView(
                            padding:
                                const EdgeInsets.symmetric(horizontal: 20),
                            children: [
                              _buildThemeOption(
                                title: 'Dark Theme',
                                subtitle:
                                    'Use dark theme for better viewing in low light',
                                value: themeProvider.isDarkMode,
                                onChanged: (value) {
                                  if (value) {
                                    themeProvider
                                        .setThemeMode(ThemeMode.dark);
                                  } else {
                                    themeProvider
                                        .setThemeMode(ThemeMode.light);
                                  }
                                },
                              ),
                              const SizedBox(height: 28),
                              _buildThemeSelector(themeProvider),
                            ],
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  // --- Dark Theme Toggle ---
  Widget _buildThemeOption({
    required String title,
    required String subtitle,
    required bool value,
    required Function(bool) onChanged,
  }) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),
      curve: Curves.easeOut,
      decoration: BoxDecoration(
        color: AppColors.darkBackground.withOpacity(0.9),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.25),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: SwitchListTile(
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
        title: Text(
          title,
          style: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.white,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: GoogleFonts.inter(
            fontSize: 13,
            color: Colors.grey[400],
          ),
        ),
        value: value,
        onChanged: onChanged,
        activeColor: AppColors.primary,
      ),
    );
  }

  // --- Theme Selector (System / Light / Dark) ---
  Widget _buildThemeSelector(ThemeProvider themeProvider) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Theme Mode',
          style: GoogleFonts.inter(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 16),
        Column(
          children: [
            _buildThemeRadio(
              title: 'System Default',
              subtitle: 'Follow system theme setting',
              icon: Icons.settings_outlined,
              value: ThemeMode.system,
              groupValue: themeProvider.themeMode,
              onChanged: themeProvider.setThemeMode,
            ),
            const SizedBox(height: 14),
            _buildThemeRadio(
              title: 'Light',
              subtitle: 'Use light theme',
              icon: Icons.light_mode_outlined,
              value: ThemeMode.light,
              groupValue: themeProvider.themeMode,
              onChanged: themeProvider.setThemeMode,
            ),
            const SizedBox(height: 14),
            _buildThemeRadio(
              title: 'Dark',
              subtitle: 'Use dark theme',
              icon: Icons.dark_mode_outlined,
              value: ThemeMode.dark,
              groupValue: themeProvider.themeMode,
              onChanged: themeProvider.setThemeMode,
            ),
          ],
        ),
      ],
    );
  }

  // --- Theme Radio Button ---
  Widget _buildThemeRadio({
    required String title,
    required String subtitle,
    required IconData icon,
    required ThemeMode value,
    required ThemeMode groupValue,
    required Function(ThemeMode) onChanged,
  }) {
    final bool isActive = value == groupValue;

    return InkWell(
      onTap: () => onChanged(value),
      borderRadius: BorderRadius.circular(18),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.darkBackground.withOpacity(0.9),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: isActive
                ? AppColors.primary.withOpacity(0.7)
                : Colors.white.withOpacity(0.06),
          ),
          boxShadow: isActive
              ? [
                  BoxShadow(
                    color: AppColors.primary.withOpacity(0.3),
                    blurRadius: 14,
                    spreadRadius: 2,
                  )
                ]
              : [],
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: AppColors.primary),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      color: Colors.grey[500],
                    ),
                  ),
                ],
              ),
            ),
            Radio<ThemeMode>(
              value: value,
              groupValue: groupValue,
              onChanged: (ThemeMode? newValue) {
                if (newValue != null) onChanged(newValue);
              },
              activeColor: AppColors.primary,
            ),
          ],
        ),
      ),
    );
  }
}