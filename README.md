# Correctify

A simple, cross-platform grammar correction app powered by OpenAI. Bring your own API key, pay only for what you use, and keep your data private.

![Correctify Screenshot](public/screenshot.png)

## What It Does

Correctify corrects grammar, spelling, and punctuation while preserving your writing style and formatting. It's a minimal, distraction-free tool that works on macOS, Windows, and Linux.

**Features:**
- **Global Shortcut**: Correct text from any app with `Cmd+Shift+.` (macOS) or `Ctrl+Shift+.` (Windows/Linux)
- High-quality corrections using OpenAI models (GPT-4o Mini default, GPT-5 Mini, GPT-5)
- Model selector to choose between different models based on speed, cost, and quality
- Pay-per-use pricing (no subscriptions)
- Your API key stays local and is never logged
- Preserves formatting (bold, italic, lists, line breaks)
- Keyboard shortcuts for faster workflow
- System notifications for background corrections
- Dark mode support with system theme detection
- Copy corrected text with one click
- Comprehensive in-app help and documentation

**What It Doesn't Do:**
- No text storage or database
- No analytics or tracking
- No subscriptions or accounts
- No complicated setup

## Download

### Desktop App

1. Go to the [Releases](../../releases) page
2. Download the installer for your platform:
   - **macOS**: Download `.dmg` file (Apple Silicon or Intel)
   - **Windows**: Download `.msi` or `.exe` file
   - **Linux**: Download `.AppImage`, `.deb`, or `.rpm` file
3. Install and run the app

### First-Time Setup

1. Get an OpenAI API key:
   - Visit the [API keys](https://platform.openai.com/api-keys) page on OpenAI
   - Sign in or create an account (requires credit card)
   - Click "Create new secret key"
   - Copy the key (starts with `sk-...`)

2. Add your API key to Correctify:
   - Click the Settings icon (🔑) in the top-right corner
   - Paste your API key
   - Click Save

That's it! Your API key is stored locally on your device and persists across restarts.

## How to Use

### In-App Correction

1. Type or paste text into the input area
2. Click "Correct" or press **Cmd+Enter** (Mac) / **Ctrl+Enter** (Windows/Linux)
3. See the corrected text appear below
4. Click the Copy button to copy the result

The app supports markdown formatting in both input and output—type `**bold**` to see **bold** text, `*italic*` for *italic*, etc.

### Global Shortcut (Desktop App)

Correct text from any application:

1. Select and copy text in any app (**Cmd+C** / **Ctrl+C**)
2. Press **Cmd+Shift+.** (Mac) or **Ctrl+Shift+.** (Windows/Linux)
3. Wait for the notification ("Processing text correction...")
4. Paste the corrected text (**Cmd+V** / **Ctrl+V**)

The global shortcut works even when Correctify is minimized or in the background!

**Note for macOS users:** The first time you use the app, macOS may ask for notification permissions. Make sure to allow them to see completion notifications.

## Keyboard Shortcuts

| Action | macOS | Windows/Linux |
|--------|-------|---------------|
| Submit for correction | `Cmd+Enter` | `Ctrl+Enter` |
| Global correction | `Cmd+Shift+.` | `Ctrl+Shift+.` |
| Copy result | Click Copy button | Click Copy button |

## Privacy

- Your text is sent to OpenAI's servers for correction
- Your API key is stored locally on your device (never sent to any servers)
- The app doesn't log, store, or track anything
- No analytics, no telemetry, no database

## Requirements

- An OpenAI API key (get one at [OpenAI API](https://platform.openai.com/api-keys))
- Internet connection (to reach OpenAI's API)

## Support

Having issues? Check the [Issues](../../issues) page or open a new issue.

## License

MIT
