# Portfolio Rebalancer - Flutter App

A sophisticated fintech portfolio rebalancing application built with Flutter, featuring RL-driven optimization, dark theme UI, and interactive charts.

## Features

- 📱 **4 Main Screens**: Portfolio Overview, Backtesting, Rebalancing Suggestions, Analytics
- 🎨 **Dark Theme**: Professional fintech styling with deep navy/black backgrounds
- 📊 **Interactive Charts**: Using fl_chart for beautiful data visualization
- 🔄 **State Management**: Provider pattern for reactive UI updates
- ⚡ **Modern Flutter**: Material 3 design with custom theming
- 🎯 **Optimized UI**: Mobile-first design with smooth animations

## Project Structure

```
lib/
├── main.dart                    # App entry point
├── models/
│   └── portfolio_data.dart      # Data models
├── providers/
│   ├── app_state_provider.dart  # App state management
│   └── theme_provider.dart      # Theme management
├── screens/                     # Main application screens
├── theme/
│   └── app_theme.dart          # App theming
├── utils/
│   └── app_colors.dart         # Color definitions
└── widgets/                     # Reusable widgets
```

## Getting Started

### Prerequisites
- Flutter SDK 3.10.0 or higher
- Dart SDK 3.0.0 or higher

### Installation

1. **Install dependencies:**
   ```bash
   flutter pub get
   ```

2. **Run the app:**
   ```bash
   flutter run
   ```

3. **Build for release:**
   ```bash
   flutter build apk  # For Android
   flutter build ios  # For iOS
   ```

## Design System

### Colors
- **Primary**: Electric Blue (#4A90FF)
- **Background**: Dark Navy (#0A0E27)
- **Cards**: Dark Blue (#1E2139)
- **Success**: Bright Green (#00D4AA)
- **Error**: Bright Red (#FF4757)

### Typography
- **Font Family**: Google Fonts Inter
- **Weights**: Regular (400), Medium (500), SemiBold (600), Bold (700)

## Dependencies

- `provider`: State management
- `google_fonts`: Typography
- `fl_chart`: Charts and data visualization
- `shared_preferences`: Local storage
- `http`: HTTP requests
- `animations`: Custom animations

## Development

### Code Style
This project follows Flutter/Dart coding conventions with:
- Proper null safety
- Const constructors where possible
- Modern Material 3 theming
- Responsive design patterns

### State Management
The app uses the Provider pattern for state management with:
- `AppStateProvider`: Navigation and UI state
- `ThemeProvider`: Theme and appearance settings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `flutter analyze` to check for issues
5. Submit a pull request

## License

This project is licensed under the MIT License.