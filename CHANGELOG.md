# Changelog

All notable changes to Correctify will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-10-29

### Added

- **Secure API Key Storage**: File-based encrypted storage for API keys (OS-level protection)
  - Automatic migration from localStorage to secure storage
  - Support for multiple provider keys (OpenAI, Anthropic, Mistral, OpenRouter)
  - Keys stored in app data directory with base64 encoding
  - Individual key management per provider
- **Multi-LLM Provider Support**: Expanded beyond OpenAI to support 4 major providers
  - OpenAI (GPT-4o, GPT-4o Mini)
  - Anthropic (Claude 3.5 Sonnet, Claude 3.5 Haiku)
  - Mistral (Mistral Large, Mistral Small)
  - OpenRouter (4 free models: Llama 3.2 3B, Gemma 2 9B, Phi-3 Mini, Mistral 7B)
  - Total of 10 models (6 paid, 4 free)
- **Vercel AI SDK Integration**: Unified LLM interface for all providers
  - Consistent correction behavior across all models
  - Centralized prompt management system
  - Writing style consistency across providers
- **Usage Tracking & Statistics**:
  - Client-side usage tracking (tokens, latency, cost estimates)
  - New Usage Stats modal with detailed analytics
  - Period selector (7/30/90 days)
  - Provider-level breakdown
  - Success rate and performance metrics
  - Cost estimation based on actual token usage
- **Intelligent Fallback System**: Automatic retry with free models on API failure
  - One-click fallback to OpenRouter free models
  - Graceful error recovery
  - User-friendly error messages with retry options
- **Enhanced UI/UX**:
  - Converted About page to modal (consistent with Settings/Help)
  - Tabbed Settings interface (API Keys / App Settings)
  - Grouped model dropdown (Paid Models / Free Models)
  - Cleaner header with dropdown menu for secondary actions
  - Provider badges in model selection
  - Dynamic model availability based on configured keys

### Changed

- Settings modal reorganized with tabs for better organization
- Header icons consolidated into dropdown menu
- Model selection now shows provider information
- API route updated to support all LLM providers
- Browser/dev mode now uses API route for CORS handling
- Production builds call LLMs directly from Tauri context
- About modal no longer opens in separate window

### Fixed

- CORS issues with Anthropic and other providers in dev mode
- Model availability now properly reflects configured API keys
- Error handling improved with provider-specific messages

### Security

- API keys now stored with OS-level encryption (file-based)
- No keys stored in localStorage or browser context
- All usage statistics remain local (never shared)
- Secure migration from old localStorage keys

## [1.0.1] - 2025-10-24

### Added

- Auto Copy/Paste Feature: Optional setting that automatically copies selected text and pastes corrected text
  - Eliminates manual copy/paste steps when using the global shortcut
  - Simply select text, press the shortcut, and watch it auto-correct in place
  - Enable/disable via checkbox in Settings modal
  - Works with existing global shortcut functionality
  - Setting persists across app restarts
  - macOS requires Accessibility permissions for keyboard simulation
- Cross-platform keyboard simulation using enigo v0.6 library
  - Simulates Cmd+C/Cmd+V on macOS
  - Simulates Ctrl+C/Ctrl+V on Windows/Linux
  - Non-blocking implementation with proper error handling
- Enhanced Help modal with separate instructions for auto copy/paste and manual modes
- Localization support for auto copy/paste feature in all languages (English, German, French, Turkish)
- Documentation for macOS Accessibility permissions requirement

### Changed

- Updated global shortcut workflow to support both auto and manual copy/paste modes
- Improved user experience with seamless text correction process

## [1.0.0] - 2025-10-24

Welcome to the first official release of Correctify! A simple, cross-platform grammar correction app powered by OpenAI.

### Core Features

- **AI-Powered Corrections**: OpenAI-powered grammar, spelling, and punctuation correction
- **Model Selection**: Choose between GPT-4o Mini (default), GPT-5 Mini, and GPT-5 based on speed, cost, and quality needs
- **Markdown Support**: Full markdown formatting support in input and output
  - Preserves bold, italic, lists, line breaks, code blocks, and inline code
- **Copy with One Click**: Instantly copy corrected text to clipboard
- **Local API Key Storage**: Your API key persists across sessions and stays on your device
- **Cross-Platform Desktop App**: Native apps for macOS, Windows, and Linux

### Menubar/System Tray App

- **Always Accessible**: Lives in your system tray/menubar for instant access
  - Single click on tray icon to show/hide the app window
  - No dock icon on macOS (runs as an accessory app)
  - Window hides instead of closing when clicking close button
  - Lightweight, unobtrusive design
- **Launch at Startup**: Optional autostart when your system boots
  - Enable/disable from Settings modal
  - Cross-platform support (macOS, Windows, Linux)
  - Setting persists across app restarts

### Writing Style Selector

Choose from 5 different writing styles to customize your corrections:
- **Grammar Only**: Fixes grammar and typos only (default)
- **Formal**: Polished and professional tone with no contractions
- **Informal**: Natural and conversational tone with friendly phrasing
- **Collaborative**: Friendly, inclusive team tone with cooperative language
- **Concise**: Clear and to the point, removing redundancy
- Style dropdown with descriptions below each option name
- Writing style preference persists across sessions

### Global Shortcut

- **Correct from Anywhere**: Use global shortcut to correct text from any application
  - Default: `Cmd+Shift+]` (macOS) or `Ctrl+Shift+]` (Windows/Linux)
  - Automatically reads text from clipboard
  - Processes correction in the background
  - Places corrected text back in clipboard
  - Works even when the app is minimized or hidden
- **Customizable Shortcut**: Configure your preferred keyboard shortcut
  - Change the last key while keeping Cmd+Shift (or Ctrl+Shift)
  - Supports A-Z, 0-9, and special keys
  - Dynamically updates without app restart
  - Setting persists across app restarts

### Notifications & Feedback

- **System Notifications**: Real-time status updates
  - "Processing text correction..." when shortcut is triggered
  - "Text corrected and copied to clipboard!" when complete with model name and duration
  - Error notifications for missing API key or correction failures
- **Sound Notifications**: Optional audio feedback
  - Play sound effects when notifications appear
  - Three distinct sounds: empty clipboard warning, processing, and completion
  - Enable/disable from Settings modal
  - Cross-platform support (WAV format)
  - Default: enabled
  - Works for both in-app and global shortcut corrections

### User Interface

- **Clean, Minimal Design**: Distraction-free interface focused on the task
- **Dark Mode Support**: Automatic system theme detection
  - Stone and Lime color scheme for modern aesthetic
  - All colors customizable via CSS variables
  - Improved dark mode contrast
- **Draggable Window Header**: Custom title bar with drag functionality
  - Prevents accidental text selection while dragging
- **Localization**: Multi-language support
  - English, German, French, Turkish
  - Automatically detects system language with English fallback
- **Result Text Area**: Bottom padding for comfortable reading
- **Reload Button**: Refresh the webview from the header

### Settings & Customization

- **Settings Modal**: Comprehensive configuration options
  - OpenAI API Key management with secure local storage
  - Model selection (GPT-4o Mini, GPT-5 Mini, GPT-5)
  - Writing style selector with 5 options
  - Launch at startup toggle
  - Sound notifications toggle
  - Keyboard shortcut customization
  - Clear API key button
  - All settings persist across sessions

### Help & Documentation

- **Help Modal**: Complete in-app documentation
  - API key setup guide with direct link to OpenAI
  - In-app and global shortcut usage instructions
  - Model selection guidance
  - Keyboard shortcuts reference with dynamic shortcut display
- **About Window**: App version and information
  - Opens programmatically via Info icon in header
  - Shows current version number

### Keyboard Shortcuts

- **In-App Correction**: `Cmd+Enter` (macOS) / `Ctrl+Enter` (Windows/Linux) to submit
- **Global Correction**: Customizable shortcut (default: `Cmd+Shift+]` / `Ctrl+Shift+]`)

### Privacy & Security

- **No Data Collection**: Zero analytics, telemetry, or tracking
- **No Text Storage**: No database, logging, or text retention
- **Local API Key**: API key stored locally only, never transmitted to any server except OpenAI
- **Direct Communication**: Only communicates directly with OpenAI API
- **Inspector Disabled**: Inspector window disabled in production builds

### Technical Highlights

- **Tauri-Based Architecture**: Small bundle size and fast performance
- **Modern Tech Stack**: Next.js 15, React 19, TypeScript, Tailwind CSS 4
- **Efficient Plugins**: 
  - global-shortcut for system-wide keyboard shortcuts
  - clipboard-manager for clipboard operations
  - notification for system notifications
  - autostart for launch at startup
  - os for platform detection
- **Audio Playback**: rodio library for non-blocking sound playback
- **Thread-Safe Settings**: Arc and Mutex for concurrent state management
- **Dynamic Shortcut Registration**: Real-time shortcut updates without restart
- **Cross-Platform Compatibility**: Verified on macOS, Windows, and Linux

[1.1.0]: https://github.com/tarikkavaz/Correctify/releases/tag/v1.1.0
[1.0.1]: https://github.com/tarikkavaz/Correctify/releases/tag/v1.0.1
[1.0.0]: https://github.com/tarikkavaz/Correctify/releases/tag/v1.0.0
