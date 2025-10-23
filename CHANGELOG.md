# Changelog

All notable changes to Correctify will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-21

### Added
- **Auto-Update System**: Automatic and manual update checking with GitHub releases integration
  - Toggle to enable/disable automatic update checks
  - Manual "Check for updates" button in Settings
  - Update notifications with release notes
  - Secure update verification with code signing
- **Writing Style Selector**: Choose from 5 different writing styles to customize corrections
  - Grammar Only: Fixes grammar and typos only (default)
  - Formal: Polished and professional tone with no contractions
  - Informal: Natural and conversational tone with friendly phrasing
  - Collaborative: Friendly, inclusive team tone with cooperative language
  - Concise: Clear and to the point, removing redundancy
- **Menubar App**: Correctify runs as a menubar/system tray app
  - Click the tray icon to instantly show/hide the app window
  - No dock icon on macOS (runs as an accessory app)
  - Window hides instead of closing when clicking the close button
  - Lightweight, always-accessible design
- **Autostart Option**: Launch Correctify automatically when your system boots
  - Enable/disable from Settings modal
  - Cross-platform support (macOS, Windows, Linux)
  - Setting persists across app restarts
- **Sound Notifications**: Optional audio feedback for all notifications
  - Play sound effects when notifications appear
  - Three distinct sounds: empty clipboard warning, processing, and completion
  - Enable/disable from Settings modal
  - Cross-platform support (WAV format via rodio)
  - Default: enabled
- **Customizable Keyboard Shortcut**: Configure your preferred global shortcut key
  - Change the last key while keeping Cmd+Shift (or Ctrl+Shift)
  - Default remains period (.) key
  - Supports A-Z, 0-9, and special keys
  - Dynamically updates without app restart
  - Setting persists across app restarts
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
- **About Window**: New Info icon in header
  - Opens About window programmatically
  - Shows app version and information
  - Dynamic version reading from package.json
- **Reload Button**: Added reload button to header for refreshing the webview
  - Uses RefreshCcw icon from lucide-react
  - Positioned next to Settings button
  - Calls Tauri's window reload API
- **In-App Correction Sounds**: Sound notifications now play during in-app corrections
  - Processing sound plays when correction starts
  - Completed sound plays when correction finishes
  - Respects the sound enabled setting
- **Enhanced Notifications**: Global shortcut notifications now include additional details
  - Model name displayed in notification body
  - Duration displayed in notification body (e.g., "Duration: 15.99s")
  - Applied to global shortcut corrections only
- **Localization Support**: Multiple languages (English, German, French, Turkish)
  - Automatically detects system language and falls back to English
  - Language-specific UI translations for better user experience
- **Improved Onboarding**:
  - Prominent API key warning on main page (moved from header)
  - Auto-hiding quick tip for global shortcut feature
  - Better error messages with actionable links

### Changed
- **Theme Colors**: Updated color scheme from gray/blue to Stone and Lime
  - Base colors now use Tailwind's Stone palette for a warmer, more sophisticated look
  - Primary accent color changed to Lime for better visibility and modern aesthetic
  - All colors are now customizable via CSS variables in `globals.css`
  - Improved dark mode contrast with adjusted button text colors
  - Updated site manifest with new theme colors
- **Settings Modal UI Improvements**:
  - Changed "Keyboard shortcut" label to "Global Shortcut" for clarity
  - Moved Clear button to be right-aligned with "OpenAI API Key" title
  - Replaced all hardcoded text with locale strings
- **Help Modal**: Made keyboard shortcuts dynamic
  - Shortcut key now updates based on user's customized setting
  - Shows current configured shortcut instead of hardcoded period
- **Result Text Area**: Added bottom padding (pb-8) to prevent text from being too close to window bottom
- **Header Subtitle**: Changed from hardcoded "AI-powered grammar correction" to use locale string
- **Settings UI**: Renamed "API Key" modal to "Settings"
  - Changed icon from Key to Gear icon
  - Added Autostart checkbox option for desktop app
  - Improved modal organization
  - Updated title in all language translations (EN, DE, FR, TR)
- **Window Behavior**: Main window now starts hidden and appears via tray icon
- **Header Icons**: Reorganized header with Info, Help, Theme, and Settings icons
- **System Prompt**: Updated and restructured for better clarity with numbered rules
  - Added support for preserving original language (no translation)
  - Improved markdown formatting preservation instructions
  - Better handling of code blocks and inline code
- **UI Icons**: Updated KeyRound icon for API key section in Help modal
- **UI Icons**: Changed emoji to Lightbulb component for "Quick Correction from Anywhere" section

### Fixed
- **Draggable Header**: Fixed text selection issue in header area
  - Added `select-none` class to prevent accidental text selection while dragging
  - Added `data-tauri-drag-region` to all child elements for proper drag functionality
  - Users can now drag the window from the title/logo area without selecting text
- Disabled Inspector Window in production builds for better security

### Technical
- Added `tauri-plugin-updater` for automatic update functionality
- Added `rodio` audio playback library
- Implemented non-blocking sound playback in separate threads
- Added Tauri commands for sound, shortcut, and update management
- Dynamic global shortcut registration/unregistration
- Enhanced state management with Arc and Mutex for thread-safe settings
- Added `tauri-plugin-autostart` for startup management
- Implemented system tray icon with direct click-to-toggle functionality
- Updated window configuration for menubar behavior
- Enhanced cross-platform desktop experience
- Removed application menu on all platforms (menubar-only app)
- Added Tauri plugins: `global-shortcut`, `clipboard-manager`, `notification`, `os`
- Cross-platform support verified for Windows, Linux, and macOS
- All features work in both development and production builds
- Added play_sound_in_app Tauri command for in-app sound playback
- Updated handle_corrected_text command to accept optional model and duration parameters
- Enhanced notification body building with model and duration information
- Improved global shortcut event handler with duration tracking
- Removed Ollama Support: Simplified codebase by removing Ollama corrector
  - Deleted `lib/ollama.ts` and related test files
  - Updated API routes to only support OpenAI provider
  - Removed `.env.example` file (no longer needed)

### Privacy
- API key stored locally only
- No analytics or telemetry
- No text storage or logging
- Direct communication with OpenAI API only

### Documentation
- Removed pricing section from README (OpenAI pricing changes frequently)
- Removed API key storage location details from README (simplified documentation)
- Updated all version references to 1.0.0
- Removed test files: Cleaned up Jest test files and configuration

[1.0.0]: https://github.com/tarikkavaz/Correctify/releases/tag/v1.0.0