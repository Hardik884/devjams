import 'dart:io';
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/app_state_provider.dart';
import '../utils/app_colors.dart';
import '../widgets/gradient_background.dart';

class UpdatePortfolioScreen extends StatefulWidget {
  const UpdatePortfolioScreen({super.key});

  @override
  State<UpdatePortfolioScreen> createState() => _UpdatePortfolioScreenState();
}

class _UpdatePortfolioScreenState extends State<UpdatePortfolioScreen> {
  final _portfolioNameController = TextEditingController();
  final _descriptionController = TextEditingController();
  File? _excelFile;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _portfolioNameController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _pickExcelFile() async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['xlsx', 'xls', 'csv'],
    );

    if (result != null) {
      setState(() {
        _excelFile = File(result.files.single.path!);
      });
    }
  }

  Future<void> _updatePortfolio() async {
    if (_excelFile == null) {
      setState(() {
        _errorMessage = 'Please select a new Excel file to update your portfolio.';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final appState = Provider.of<AppStateProvider>(context, listen: false);

      // ✅ Placeholder for the actual portfolio update logic
      // This will call a method in your service layer to handle the update.
      await appState.updateExistingPortfolio(
        _portfolioNameController.text,
        _descriptionController.text,
        _excelFile!,
      );

      if (mounted) {
        // Show a success message
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Portfolio updated successfully!')),
        );
        Navigator.pop(context); // Go back to the previous screen
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.darkBackground,
      body: Stack(
        children: [
          const GradientBackground(),
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.white),
                    onPressed: () => Navigator.pop(context),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Update Portfolio',
                    style: GoogleFonts.inter(
                      fontSize: 28,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Upload a new Excel file to update your existing portfolio holdings.',
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      color: AppColors.mutedText,
                    ),
                  ),
                  const SizedBox(height: 48),
                  Text(
                    'Upload New Excel File',
                    style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(height: 8),
                  OutlinedButton.icon(
                    onPressed: _pickExcelFile,
                    icon: const Icon(Icons.upload_file, color: AppColors.primary),
                    label: Text(
                      _excelFile != null ? _excelFile!.path.split('/').last : 'Choose New File',
                      style: GoogleFonts.inter(color: AppColors.primary),
                    ),
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size(double.infinity, 50),
                      side: const BorderSide(color: AppColors.primary),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: InkWell(
                      onTap: _isLoading ? null : _updatePortfolio,
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 18),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [AppColors.primary, AppColors.primaryDark],
                            begin: Alignment.centerLeft,
                            end: Alignment.centerRight,
                          ),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Center(
                          child: _isLoading
                              ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2)
                              : Text(
                                  'Update Portfolio',
                                  style: GoogleFonts.inter(
                                      fontSize: 18, color: Colors.white, fontWeight: FontWeight.w600),
                                ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  if (_errorMessage != null)
                    Text(
                      _errorMessage!,
                      style: GoogleFonts.inter(color: AppColors.error, fontSize: 14),
                      textAlign: TextAlign.center,
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}