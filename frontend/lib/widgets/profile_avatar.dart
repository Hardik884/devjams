import 'package:flutter/material.dart';
import '../utils/app_colors.dart';

class ProfileAvatar extends StatelessWidget {
  final double size;
  final bool showBorder;

  const ProfileAvatar({
    super.key,
    this.size = 40,
    this.showBorder = true,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: showBorder 
          ? Border.all(
              color: Colors.white.withOpacity(0.2),
              width: 2,
            )
          : null,
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.primary,
            Color(0xFF8B5CF6), // purple-500
          ],
        ),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(10),
        child: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Color(0xFF4C4AEF),
                Color(0xFF7C3AED),
              ],
            ),
          ),
          child: Stack(
            children: [
              // Financial chart pattern overlay
              Positioned.fill(
                child: CustomPaint(
                  painter: _FinancialPatternPainter(),
                ),
              ),
              
              // Icon overlay
              Center(
                child: Icon(
                  Icons.person,
                  color: Colors.white.withOpacity(0.9),
                  size: size * 0.5,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FinancialPatternPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withOpacity(0.1)
      ..strokeWidth = 1.0
      ..style = PaintingStyle.stroke;

    // Draw subtle chart lines for fintech aesthetic
    final path = Path();
    
    // Create a simple line chart pattern
    path.moveTo(size.width * 0.2, size.height * 0.7);
    path.lineTo(size.width * 0.4, size.height * 0.5);
    path.lineTo(size.width * 0.6, size.height * 0.6);
    path.lineTo(size.width * 0.8, size.height * 0.3);
    
    canvas.drawPath(path, paint);
    
    // Draw some dots for data points
    final dotPaint = Paint()
      ..color = Colors.white.withOpacity(0.2)
      ..style = PaintingStyle.fill;
    
    canvas.drawCircle(Offset(size.width * 0.4, size.height * 0.5), 1.5, dotPaint);
    canvas.drawCircle(Offset(size.width * 0.6, size.height * 0.6), 1.5, dotPaint);
    canvas.drawCircle(Offset(size.width * 0.8, size.height * 0.3), 1.5, dotPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}