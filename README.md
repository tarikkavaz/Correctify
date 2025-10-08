# Correctify

A simple, cross-platform grammar correction app powered by OpenAI. Bring your own API key, pay only for what you use, and keep your data private.

![Correctify Screenshot](public/screenshot.png)

## What It Does

Correctify corrects grammar, spelling, and punctuation while preserving your writing style and formatting. It's a minimal, distraction-free menubar app that works on macOS, Windows, and Linux.

**Features:**

* **Menubar App**: Lives in your system tray/menubar for instant access

  * Single click on tray icon to show/hide the app
  * No dock icon on macOS (stays in menubar only)
  * Launch at startup option available in Settings
  * Lightweight and always accessible
* **Customizable Shortcut**: Change the global shortcut to your preference
  * Default: `Cmd+Shift+.` (macOS) or `Ctrl+Shift+.` (Windows/Linux)
  * Customize the last key (e.g., A-Z, 0-9, special keys)
  * Updates instantly without restarting the app
* **Sound Notifications**: Optional audio feedback for all notifications
  * Distinct sounds for different notification types
  * Enable/disable in Settings (enabled by default)
  * Works across all platforms
* **Global Shortcut**: Correct text from any app using your configured shortcut
* High-quality corrections using OpenAI models (GPT-4o Mini default, GPT-5 Mini, GPT-5)
* Model selector to choose between different models based on speed, cost, and quality
* Pay-per-use pricing (no subscriptions)
* Your API key stays local and is never logged
* Preserves formatting (bold, italic, lists, line breaks)
* Keyboard shortcuts for faster workflow
* System notifications for background corrections
* Dark mode support with system theme detection
* Copy corrected text with one click

**What It Doesn't Do:**

* No text storage or database
* No analytics or tracking
* No subscriptions or accounts
* No complicated setup

## Download

### Desktop App

1. Go to the [Releases](../../releases) page
2. Download the installer for your platform:

   * **macOS**: Download `.dmg` file (Apple Silicon or Intel)
   * **Windows**: Download `.msi` or `.exe` file
   * **Linux**: Download `.AppImage`, `.deb`, or `.rpm` file
3. Install and run the app

### First-Time Setup

1. Get an OpenAI API key:

   * Visit the [API keys](https://platform.openai.com/api-keys) page on OpenAI
   * Sign in or create an account (requires credit card)
   * Click "Create new secret key"
   * Copy the key (starts with `sk-...`)

2. Add your API key to Correctify:

   * Click the tray/menubar icon to open Correctify
   * Click the Settings icon (⚙️) in the top-right corner
   * Paste your API key
   * Optional: Enable "Launch at startup" to start Correctify automatically
   * Optional: Toggle "Sound notifications" to enable/disable audio feedback
   * Optional: Customize your keyboard shortcut (default: period key)
   * Click Save

That's it! Your API key is stored locally on your device and persists across restarts.

## How to Use

### Opening the App

* **First time**: The app will appear in your system tray/menubar (look for the Correctify icon)
* **Click the tray icon** to instantly show/hide the main window
* The window starts hidden - click the icon to reveal it

### In-App Correction

1. Type or paste text into the input area
2. Click "Correct" or press **Cmd+Enter** (Mac) / **Ctrl+Enter** (Windows/Linux)
3. See the corrected text appear below
4. Click the Copy button to copy the result

The app supports markdown formatting in both input and output—type `**bold**` to see **bold** text, `*italic*` for *italic*, etc.

### Global Shortcut (Desktop App)

Correct text from any application:

1. Select and copy text in any app (**Cmd+C** / **Ctrl+C**)
2. Press your configured shortcut (default: **Cmd+Shift+.** on Mac or **Ctrl+Shift+.** on Windows/Linux)
3. Wait for the notification ("Processing text correction...")
4. Paste the corrected text (**Cmd+V** / **Ctrl+V**)

The global shortcut works even when Correctify is minimized or hidden! You can customize the shortcut in Settings.

**Note for macOS users:**
> [!IMPORTANT]
> When opening Correctify for the first time, you may see a warning that the app is “damaged” or “cannot be opened because it is from an unidentified developer.” This is a standard macOS security measure for apps not distributed via the App Store. To proceed:
>
>  1. Go to **System Settings → Privacy & Security**
>  2. Scroll down until you see the message about **Correctify** being blocked
>  3. Click **Open Anyway**
>  4. Confirm in the popup
>
>  After this, macOS will remember your choice and you won’t need to repeat the step.

* The first time you use the app, macOS may ask for notification permissions. Make sure to allow them to see completion notifications.
* Correctify runs as a menubar-only app (no dock icon). Single-click the menubar icon to show/hide the window.
* To quit the app, use **Cmd+Q** when the window is focused.

## Keyboard Shortcuts

| Action                | macOS             | Windows/Linux     |
| --------------------- | ----------------- | ----------------- |
| Submit for correction | `Cmd+Enter`       | `Ctrl+Enter`      |
| Global correction     | `Cmd+Shift+.`     | `Ctrl+Shift+.`    |
| Copy result           | Click Copy button | Click Copy button |

## Privacy

* Your text is sent to OpenAI's servers for correction
* Your API key is stored locally on your device (never sent to any servers)
* The app doesn't log, store, or track anything
* No analytics, no telemetry, no database

## Requirements

* An OpenAI API key (get one at [OpenAI API](https://platform.openai.com/api-keys))
* Internet connection (to reach OpenAI's API)

## Support

Having issues? Check the [Issues](../../issues) page or open a new issue.

## License

MIT
