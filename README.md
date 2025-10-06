# Correctify

A simple, cross-platform grammar correction app powered by OpenAI. Bring your own API key, pay only for what you use, and keep your data private.

![Correctify Screenshot](public/screenshot.png)

## What It Does

Correctify corrects grammar, spelling, and punctuation while preserving your writing style and formatting. It's a minimal, distraction-free tool that works on macOS, Windows, and Linux.

**Features:**
- High-quality corrections using OpenAI models (GPT-4o Mini default, GPT-5 Mini, GPT-5)
- Model selector to choose between different models based on speed, cost, and quality
- Pay-per-use pricing (no subscriptions)
- Your API key stays local and is never logged
- Preserves formatting (bold, italic, lists, line breaks)
- Keyboard shortcuts (Cmd/Ctrl+Enter)
- Dark mode support
- Copy corrected text with one click

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
   - Visit [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - Sign in or create an account (requires credit card)
   - Click "Create new secret key"
   - Copy the key (starts with `sk-...`)

2. Add your API key to Correctify:
   - Click the Settings icon (🔑) in the top-right corner
   - Paste your API key
   - Click Save

That's it! Your API key is stored locally on your device and persists across restarts.

## How to Use

1. Type or paste text into the input area
2. Click "Correct" or press **Cmd+Enter** (Mac) / **Ctrl+Enter** (Windows/Linux)
3. See the corrected text appear below
4. Click the Copy button to copy the result

The app supports markdown formatting in both input and output—type `**bold**` to see **bold** text, `*italic*` for *italic*, etc.

## Pricing

You only pay for what you use through your OpenAI account:
- **~$0.00015** per 1,000 input tokens
- **~$0.0006** per 1,000 output tokens

For reference, 1,000 tokens ≈ 750 words. Most corrections cost less than a penny.

## Privacy

- Your text is sent to OpenAI's servers for correction
- Your API key is stored locally on your device (never sent to any servers)
- The app doesn't log, store, or track anything
- No analytics, no telemetry, no database

**Where your API key is stored:**
- **macOS**: `~/Library/Application Support/com.correctify/`
- **Windows**: `%APPDATA%\com.correctify\`
- **Linux**: `~/.local/share/com.correctify/`

## Requirements

- An OpenAI API key (get one at [OpenAI API](https://platform.openai.com/api-keys))
- Internet connection (to reach OpenAI's API)

## Support

Having issues? Check the [Issues](../../issues) page or open a new issue.

## License

MIT
