# Tauri Icons

Tauri requires icons in specific formats for different platforms:

- `32x32.png` - Small icon for Windows taskbar
- `128x128.png` - Medium icon
- `128x128@2x.png` - Retina display icon
- `icon.icns` - macOS icon file (multi-resolution bundle)
- `icon.ico` - Windows icon file (multi-resolution)

## Generating Icons

You can use the Tauri icon generator:

```bash
pnpm tauri icon path/to/your/icon.png
```

This will generate all required icon formats from a single 1024×1024 PNG source image.

For now, placeholder icons are needed. You can:
1. Create a simple icon with your favorite design tool
2. Use an online icon generator
3. Generate from the Tauri CLI as shown above

The icon should be:
- Square (1:1 aspect ratio)
- At least 1024×1024 pixels
- Simple, recognizable design
- Works well at small sizes
