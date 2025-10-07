# Changelog

All notable changes to Correctify will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2025-01-XX

### Added
- **Menubar App**: Correctify now runs as a menubar/system tray app
  - Click the tray icon to instantly show/hide the app window
  - No dock icon on macOS (runs as an accessory app)
  - Window hides instead of closing when clicking the close button
  - Lightweight, always-accessible design
- **Autostart Option**: Launch Correctify automatically when your system boots
  - Enable/disable from Settings modal
  - Cross-platform support (macOS, Windows, Linux)
  - Setting persists across app restarts
- **About Window**: New Info (ℹ️) icon in header
  - Opens About window programmatically
  - Shows app version and information
  - Replaces previous menu-based About page

### Changed
- **Settings UI**: Renamed "API Key" modal to "Settings"
  - Changed icon from Key (🔑) to Gear (⚙️) icon
  - Added Autostart checkbox option for desktop app
  - Improved modal organization
  - Updated title in all language translations (EN, DE, FR, TR)
- **Window Behavior**: Main window now starts hidden and appears via tray icon
- **Header Icons**: Reorganized header with Info, Help, Theme, and Settings icons
- **Removed Test Files**: Cleaned up Jest test files and configuration

### Technical
- Added `tauri-plugin-autostart` for startup management
- Implemented system tray icon with direct click-to-toggle functionality
- Updated window configuration for menubar behavior
- Enhanced cross-platform desktop experience
- Removed application menu on all platforms (menubar-only app)

## [0.2.0] - 2025-01-10

### Added
- Localization support for multiple languages (English, German, French, Turkish)
  - Automatically detects system language and falls back to English
  - Language-specific UI translations for better user experience

### Changed
- **System Prompt**: Updated and restructured for better clarity with numbered rules
  - Added support for preserving original language (no translation)
  - Improved markdown formatting preservation instructions
  - Better handling of code blocks and inline code
- **UI Icons**: Updated KeyRound icon for API key section in Help modal
- **UI Icons**: Changed emoji to Lightbulb component for "Quick Correction from Anywhere" section
- **Removed Ollama Support**: Simplified codebase by removing Ollama corrector
  - Deleted `lib/ollama.ts` and related test files
  - Updated API routes to only support OpenAI provider
  - Removed `.env.example` file (no longer needed)

### Fixed
- Disabled Inspector Window in production builds for better security

### Documentation
- Removed pricing section from README (OpenAI pricing changes frequently)
- Removed API key storage location details from README (simplified documentation)
- Updated all version references to 0.2.0

## [0.1.1] - 2025-01-06

### Added
- **Global Shortcut**: Correct text from any application using `Cmd+Shift+.` (macOS) or `Ctrl+Shift+.` (Windows/Linux)
  - Automatically reads text from clipboard
  - Processes correction in the background
  - Places corrected text back in clipboard
  - Works even when the app is minimized
- **System Notifications**: 
  - "Processing text correction..." notification when shortcut is triggered
  - "Text corrected and copied to clipboard!" notification when complete
  - Error notifications for missing API key or correction failures
- **Help Modal**: Comprehensive in-app help and documentation
  - API key setup guide with direct link to OpenAI
  - In-app and global shortcut usage instructions
  - Model selection guidance
  - Complete keyboard shortcuts reference
- **Improved Onboarding**:
  - Prominent API key warning on main page (moved from header)
  - Auto-hiding quick tip for global shortcut feature
  - Better error messages with actionable links

### Changed
- Reorganized header icons: Help, Theme, Settings (left to right)
- Improved dark mode support across new components
- Enhanced notification permission handling
- Better cross-platform keyboard shortcut display

### Technical
- Added Tauri plugins: `global-shortcut`, `clipboard-manager`, `notification`, `os`
- Cross-platform support verified for Windows, Linux, and macOS
- All features work in both development and production builds

## [0.1.0] - 2025-01-02

### Added
- Initial release of Correctify
- OpenAI-powered grammar and spelling correction
- Model selection: GPT-4o Mini, GPT-5 Mini, GPT-5
- Markdown formatting support in input and output
- Dark mode with system theme detection
- Keyboard shortcuts: `Cmd+Enter` / `Ctrl+Enter` to submit
- Copy corrected text with one click
- Local API key storage (persists across sessions)
- Cross-platform desktop app (macOS, Windows, Linux)
- Tauri-based architecture for small bundle size and fast performance
- Clean, minimal UI with draggable window header
- About page with version information

### Privacy
- API key stored locally only
- No analytics or telemetry
- No text storage or logging
- Direct communication with OpenAI API only

[0.3.0]: https://github.com/tarikkavaz/Correctify/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/tarikkavaz/Correctify/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/tarikkavaz/Correctify/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/tarikkavaz/Correctify/releases/tag/v0.1.0
