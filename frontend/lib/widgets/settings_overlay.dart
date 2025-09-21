import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../utils/app_colors.dart';
import 'elevated_card.dart';
import '../providers/app_state_provider.dart';
import '../services/auth_service.dart'; // ✅ Import the AuthService

class SettingsOverlay extends StatefulWidget {
  final VoidCallback onClose;
  final VoidCallback onNavigateToAccount;
  final VoidCallback onNavigateToNotifications;
  final VoidCallback onNavigateToPrivacy;
  final VoidCallback onNavigateToAppearance;

  const SettingsOverlay({
    super.key,
    required this.onClose,
    required this.onNavigateToAccount,
    required this.onNavigateToNotifications,
    required this.onNavigateToPrivacy,
    required this.onNavigateToAppearance,
  });

  @override
  State<SettingsOverlay> createState() => _SettingsOverlayState();
}

class _SettingsOverlayState extends State<SettingsOverlay>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<Offset> _slideAnimation;

  final List<Map<String, dynamic>> _settingsItems = [
    {
      'id': 'account',
      'title': 'Account',
      'icon': Icons.person_outline,
      'description': 'Profile and account settings',
    },
    {
      'id': 'notifications',
      'title': 'Notifications',
      'icon': Icons.notifications_outlined,
      'description': 'Push notifications and alerts',
    },
    {
      'id': 'privacy',
      'title': 'Privacy & Security',
      'icon': Icons.security_outlined,
      'description': 'Data protection and security',
    },
    {
      'id': 'appearance',
      'title': 'Appearance',
      'icon': Icons.brightness_6_outlined,
      'description': 'Dark mode and display settings',
    },
    {
      'id': 'about',
      'title': 'About App',
      'icon': Icons.info_outline,
      'description': 'Version and developer info',
    },
  ];

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _slideAnimation = Tween<Offset>(
      begin: const Offset(1.0, 0.0),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));
    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _close() async {
    await _animationController.reverse();
    widget.onClose();
  }

  void _handleItemClick(String id) {
    switch (id) {
      case 'account':
        widget.onNavigateToAccount();
        break;
      case 'notifications':
        widget.onNavigateToNotifications();
        break;
      case 'privacy':
        widget.onNavigateToPrivacy();
        break;
      case 'appearance':
        widget.onNavigateToAppearance();
        break;
    }
  }

  void _handleLogout() async {
    // ✅ Get the AuthService from the Provider tree
    final authService = Provider.of<AuthService>(context, listen: false);
    await authService.signOut();
    // After signing out, navigate to the login screen
    if (mounted) {
       Navigator.of(context).pushNamedAndRemoveUntil('/login', (route) => false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppStateProvider>(context);

    return SlideTransition(
      position: _slideAnimation,
      child: Scaffold(
        backgroundColor: AppColors.darkBackground,
        body: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: _close,
                      icon: const Icon(Icons.arrow_back_ios,
                          color: Colors.white, size: 20),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Settings',
                      style: GoogleFonts.inter(
                        fontSize: 24,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: SingleChildScrollView(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // ------------------ User Info Card ------------------
                        ElevatedCard(
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              children: [
                                Container(
                                  width: 56,
                                  height: 56,
                                  decoration: BoxDecoration(
                                    color: AppColors.primary,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Icon(Icons.person,
                                      color: Colors.white, size: 32),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(appState.userName,
                                          style: GoogleFonts.inter(
                                              fontSize: 18,
                                              fontWeight: FontWeight.w600,
                                              color: Colors.white)),
                                      const SizedBox(height: 2),
                                      Text(appState.email,
                                          style: GoogleFonts.inter(
                                              fontSize: 14,
                                              color: AppColors.mutedText)),
                                    ],
                                  ),
                                ),
                                IconButton(
                                  onPressed: () => _handleItemClick('account'),
                                  icon: const Icon(Icons.edit,
                                      color: AppColors.mutedText, size: 20),
                                ),
                              ],
                            ),
                          ),
                        ),

                        const SizedBox(height: 16),

                        // ------------------ Settings Items ------------------
                        ..._settingsItems.map((item) {
                          final index = _settingsItems.indexOf(item);
                          return _buildSettingsItem(
                            title: item['title'] as String,
                            description: item['description'] as String,
                            icon: item['icon'] as IconData,
                            onTap: () => _handleItemClick(item['id'] as String),
                            index: index,
                          );
                        }).toList(),

                        const SizedBox(height: 16),
                        _buildAboutSection(),

                        const SizedBox(height: 16),

                        // ------------------ Logout ------------------
                        ElevatedCard(
                          onTap: _handleLogout,
                          child: Padding(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 12),
                            child: Row(
                              children: [
                                Container(
                                  width: 48,
                                  height: 48,
                                  decoration: BoxDecoration(
                                    color: AppColors.darkCard,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Center(
                                    child: Icon(Icons.logout,
                                        color: Colors.redAccent, size: 24),
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Text(
                                    'Logout',
                                    style: GoogleFonts.inter(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w500,
                                      color: Colors.redAccent,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),

                        const SizedBox(height: 40),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ------------------ Helper Methods ------------------

  Widget _buildSettingsItem({
    required String title,
    required String description,
    required IconData icon,
    required VoidCallback onTap,
    required int index,
  }) {
    return AnimatedBuilder(
      animation: _animationController,
      builder: (context, child) {
        final slideAnimation = Tween<Offset>(
          begin: const Offset(1.0, 0.0),
          end: Offset.zero,
        ).animate(
          CurvedAnimation(
            parent: _animationController,
            curve: Interval(0.2 + index * 0.1, 1.0, curve: Curves.easeInOut),
          ),
        );

        final fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
          CurvedAnimation(
            parent: _animationController,
            curve: Interval(0.2 + index * 0.1, 1.0, curve: Curves.easeInOut),
          ),
        );

        return SlideTransition(
          position: slideAnimation,
          child: FadeTransition(
            opacity: fadeAnimation,
            child: child!,
          ),
        );
      },
      child: Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: ElevatedCard(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AppColors.darkCard,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: Icon(
                      icon,
                      color: AppColors.primary,
                      size: 24,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: GoogleFonts.inter(
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        description,
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          color: AppColors.mutedText,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.arrow_forward_ios,
                    color: AppColors.mutedText, size: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildAboutSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ElevatedCard(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'About Portfolio Tracker',
                  style: GoogleFonts.inter(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 16),
                _buildAboutItem('Version', '1.0.0'),
                _buildAboutItem('Build', '2024.1.1'),
                _buildAboutItem('Developer', 'FinTech Labs'),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildAboutItem(String title, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 14,
              color: AppColors.mutedText,
            ),
          ),
          Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}