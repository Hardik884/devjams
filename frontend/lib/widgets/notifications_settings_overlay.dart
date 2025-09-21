import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../utils/app_colors.dart';
import '../widgets/elevated_card.dart';

class NotificationsSettingsOverlay extends StatefulWidget {
  final VoidCallback onClose;

  const NotificationsSettingsOverlay({
    super.key,
    required this.onClose,
  });

  @override
  State<NotificationsSettingsOverlay> createState() =>
      _NotificationsSettingsOverlayState();
}

class _NotificationsSettingsOverlayState
    extends State<NotificationsSettingsOverlay>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<Offset> _slideAnimation;

  // Manage notification settings state
  final Map<String, Map<String, bool>> _settings = {
    'pushNotifications': {
      'appAlerts': true,
      'priceAlerts': true,
      'newsUpdates': false,
    },
    'emailAlerts': {
      'portfolioUpdates': true,
      'weeklyReports': true,
      'promotions': false,
      'securityAlerts': true,
    },
    'inAppNotifications': {
      'appAlerts': true,
      'priceAlerts': false,
      'newsUpdates': true,
    },
  };

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

  void _handleToggle(String section, String setting) {
    setState(() {
      _settings[section]![setting] = !_settings[section]![setting]!;
    });
  }

  final List<Map<String, dynamic>> _notificationSections = [
    {
      'id': 'pushNotifications',
      'title': 'Push Notifications',
      'description': 'Receive notifications on your device',
      'icon': Icons.smartphone_outlined,
      'items': [
        {'key': 'appAlerts', 'label': 'App Alerts', 'description': 'General app notifications'},
        {'key': 'priceAlerts', 'label': 'Price Alerts', 'description': 'When assets reach target prices'},
        {'key': 'newsUpdates', 'label': 'News Updates', 'description': 'Breaking financial news'},
      ],
    },
    {
      'id': 'emailAlerts',
      'title': 'Email Alerts',
      'description': 'Receive updates via email',
      'icon': Icons.mail_outline,
      'items': [
        {'key': 'portfolioUpdates', 'label': 'Portfolio Updates', 'description': 'Daily portfolio performance'},
        {'key': 'weeklyReports', 'label': 'Weekly Reports', 'description': 'Weekly portfolio summary'},
        {'key': 'promotions', 'label': 'Promotions', 'description': 'Special offers and features'},
        {'key': 'securityAlerts', 'label': 'Security Alerts', 'description': 'Account security notifications'},
      ],
    },
    {
      'id': 'inAppNotifications',
      'title': 'In-App Notifications',
      'description': 'Notifications within the app',
      'icon': Icons.notifications_outlined,
      'items': [
        {'key': 'appAlerts', 'label': 'App Alerts', 'description': 'General app notifications'},
        {'key': 'priceAlerts', 'label': 'Price Alerts', 'description': 'When assets reach target prices'},
        {'key': 'newsUpdates', 'label': 'News Updates', 'description': 'Relevant market updates'},
      ],
    },
  ];

  @override
  Widget build(BuildContext context) {
    return SlideTransition(
      position: _slideAnimation,
      child: Scaffold(
        backgroundColor: const Color(0xFF0D0D0D),
        body: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: _close,
                      icon: const Icon(Icons.arrow_back, color: Colors.white),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Notifications',
                      style: GoogleFonts.inter(
                        fontSize: 20,
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
                        // Notification Sections
                        ..._notificationSections.map((section) {
                          return _buildNotificationSection(section);
                        }).toList(),
                        const SizedBox(height: 24),
    
                        // Footer Note
                        _buildFooterNote(),
                        const SizedBox(height: 100),
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

  Widget _buildNotificationSection(Map<String, dynamic> section) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: AppColors.darkCard,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Center(
                  child: Icon(
                    section['icon'] as IconData,
                    color: AppColors.mutedText,
                    size: 16,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    section['title'] as String,
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                      color: Colors.white,
                    ),
                  ),
                  Text(
                    section['description'] as String,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: AppColors.mutedText,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        ElevatedCard(
          child: Column(
            children: (section['items'] as List<Map<String, String>>)
                .asMap()
                .entries
                .map((entry) {
              final item = entry.value;
              final isLast = entry.key == section['items'].length - 1;
              return _buildNotificationItem(
                sectionId: section['id'] as String,
                itemKey: item['key'] as String,
                label: item['label'] as String,
                description: item['description'] as String,
                isLast: isLast,
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildNotificationItem({
    required String sectionId,
    required String itemKey,
    required String label,
    required String description,
    required bool isLast,
  }) {
    return Container(
      decoration: BoxDecoration(
        border: Border(
          bottom: isLast
              ? BorderSide.none
              : BorderSide(
                  color: Colors.white.withOpacity(0.1),
                  width: 1,
                ),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
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
                      fontSize: 12,
                      color: AppColors.mutedText,
                    ),
                  ),
                ],
              ),
            ),
            Switch(
              value: _settings[sectionId]![itemKey]!,
              onChanged: (value) {
                _handleToggle(sectionId, itemKey);
              },
              activeColor: AppColors.primary,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFooterNote() {
    return ElevatedCard(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Text(
          'You can adjust these settings anytime. Some notifications may be required for security purposes.',
          style: GoogleFonts.inter(
            fontSize: 12,
            color: AppColors.mutedText,
          ),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}