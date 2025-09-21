import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../utils/app_colors.dart';

class PrivacySettingsOverlay extends StatefulWidget {
  final VoidCallback onClose;

  const PrivacySettingsOverlay({super.key, required this.onClose});

  @override
  State<PrivacySettingsOverlay> createState() => _PrivacySettingsOverlayState();
}

class _PrivacySettingsOverlayState extends State<PrivacySettingsOverlay>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<Offset> _slideAnimation;

  bool _twoFactorEnabled = true;

  final List<Map<String, dynamic>> _privacyItems = [
    {
      'id': 'change-password',
      'title': 'Change Password',
      'description': 'Update your account password',
      'icon': Icons.lock_outline,
      'type': 'action',
    },
    {
      'id': 'two-factor',
      'title': 'Two-Factor Authentication',
      'description': 'Add an extra layer of security',
      'icon': Icons.security_outlined,
      'type': 'toggle',
    },
    {
      'id': 'linked-devices',
      'title': 'Manage Linked Devices',
      'description': 'See devices connected to your account',
      'icon': Icons.smartphone_outlined,
      'type': 'action',
    },
    {
      'id': 'data-permissions',
      'title': 'Data Permissions',
      'description': 'Control what data we can access',
      'icon': Icons.storage_outlined,
      'type': 'action',
    },
    {
      'id': 'privacy-policy',
      'title': 'Privacy Policy',
      'description': 'Review our privacy practices',
      'icon': Icons.remove_red_eye_outlined,
      'type': 'action',
    },
  ];

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 280),
    );
    _slideAnimation = Tween<Offset>(
      begin: const Offset(1.0, 0.0),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOutCubic,
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

  @override
  Widget build(BuildContext context) {
    return SlideTransition(
      position: _slideAnimation,
      child: Scaffold(
        backgroundColor: AppColors.darkBackground,
        body: SafeArea(
          child: Column(
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
                      'Privacy & Security',
                      style: GoogleFonts.inter(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),

              Expanded(
                child: ListView(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  children: [
                    _buildSecurityStatusCard(),
                    const SizedBox(height: 24),

                    // Items
                    ..._privacyItems.map((item) {
                      if (item['type'] == 'toggle') {
                        return _buildToggleItem(
                          title: item['title'],
                          description: item['description'],
                          icon: item['icon'],
                          value: _twoFactorEnabled,
                          onChanged: (v) => setState(() => _twoFactorEnabled = v),
                        );
                      } else {
                        return _buildActionItem(
                          title: item['title'],
                          description: item['description'],
                          icon: item['icon'],
                          onTap: () {},
                        );
                      }
                    }),
                    const SizedBox(height: 24),

                    _buildSecurityTipsSection(),
                    const SizedBox(height: 24),
                    _buildDataProtectionNotice(),
                    const SizedBox(height: 100),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // --- COMPONENTS ---

  Widget _buildSecurityStatusCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.success.withOpacity(0.3)),
        boxShadow: [
          BoxShadow(
            color: AppColors.success.withOpacity(0.15),
            blurRadius: 20,
            spreadRadius: 2,
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: AppColors.success.withOpacity(0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.shield_outlined,
                color: AppColors.success, size: 24),
          ),
          const SizedBox(width: 14),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Account Secure',
                  style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: AppColors.success)),
              Text('Your account is well protected',
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    color: AppColors.success.withOpacity(0.7),
                  )),
            ],
          )
        ],
      ),
    );
  }

  Widget _buildActionItem({
    required String title,
    required String description,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: ListTile(
        onTap: onTap,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        leading: _buildIconBox(icon),
        title: Text(title,
            style: GoogleFonts.inter(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: Colors.white,
            )),
        subtitle: Text(description,
            style: GoogleFonts.inter(
              fontSize: 13,
              color: Colors.grey[400],
            )),
        trailing: const Icon(Icons.arrow_forward_ios,
            size: 16, color: Colors.grey),
      ),
    );
  }

  Widget _buildToggleItem({
    required String title,
    required String description,
    required IconData icon,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: ListTile(
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        leading: _buildIconBox(icon),
        title: Text(title,
            style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.w500,
                color: Colors.white)),
        subtitle: Text(description,
            style: GoogleFonts.inter(
              fontSize: 13,
              color: Colors.grey[400],
            )),
        trailing: Switch(
          value: value,
          onChanged: onChanged,
          activeColor: AppColors.primary,
        ),
        onTap: () => onChanged(!value),
      ),
    );
  }

  Widget _buildSecurityTipsSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.info.withOpacity(0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.info.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Security Tips',
              style: GoogleFonts.inter(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppColors.info)),
          const SizedBox(height: 10),
          _buildTipItem('Use a strong, unique password for your account'),
          _buildTipItem('Enable two-factor authentication for extra security'),
          _buildTipItem('Regularly review your linked devices'),
          _buildTipItem('Never share your login credentials with others'),
        ],
      ),
    );
  }

  Widget _buildTipItem(String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Text("• $text",
          style: GoogleFonts.inter(
            fontSize: 14,
            color: AppColors.info.withOpacity(0.75),
          )),
    );
  }

  Widget _buildDataProtectionNotice() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: Text(
        'We use industry-standard encryption to protect your financial data. '
        'Your privacy and security are our top priorities.',
        style: GoogleFonts.inter(fontSize: 13, color: Colors.grey[400]),
        textAlign: TextAlign.center,
      ),
    );
  }

  Widget _buildIconBox(IconData icon) {
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: AppColors.primary.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Icon(icon, color: AppColors.primary, size: 22),
    );
  }
}