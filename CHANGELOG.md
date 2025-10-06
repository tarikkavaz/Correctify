# Changelog

All notable changes to Correctify will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.1.1]: https://github.com/tarikkavaz/Correctify/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/tarikkavaz/Correctify/releases/tag/v0.1.0

