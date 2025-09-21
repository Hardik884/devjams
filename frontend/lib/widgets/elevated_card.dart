import 'package:flutter/material.dart';

class ElevatedCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final double? width;
  final double? height;
  final VoidCallback? onTap;

  const ElevatedCard({
    super.key,
    required this.child,
    this.padding,
    this.width,
    this.height,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cardWidget = Container(
      width: width,
      height: height,
      padding: padding,
      decoration: BoxDecoration(
        // Semi-transparent black color for a "crystal black" effect
        color: const Color(0x1F1E1E1E), // A dark gray with ~12% opacity
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          // Very subtle, low-opacity white border for a glassy edge
          color: Colors.white.withOpacity(0.34),
          width: 1,
        ),
        boxShadow: const [
          // Dark, soft shadow to create depth without being harsh
          BoxShadow(
            color: Color(0x40000000), // Semi-transparent black
            blurRadius: 16,
            offset: Offset(0, 8),
            spreadRadius: -4,
          ),
        ],
      ),
      child: child,
    );

    if (onTap != null) {
      return GestureDetector(
        onTap: onTap,
        child: cardWidget,
      );
    }

    return cardWidget;
  }
}