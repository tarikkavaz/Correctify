# GitHub Pages - Correctify Landing Page

This directory contains the static files for the Correctify landing page, deployed to GitHub Pages.

## Files

- `index.html` - Main landing page
- `logo.png` - App logo
- `screenshot.png` - App screenshot

## Deployment

See the main [DEPLOYMENT.md](../DEPLOYMENT.md) file in the project root for complete deployment instructions.

## Important: Verify Download Links

Before deploying, verify that the download link filenames in `index.html` match your actual GitHub release assets:

1. Visit https://github.com/tarikkavaz/Correctify/releases/latest
2. Check the actual filenames
3. Update the download links in `index.html` if they don't match

Current links point to:
- macOS: `Correctify_universal.dmg`
- Windows: `Correctify_x64_en-US.msi`
- Linux: `correctify_amd64.AppImage`

## Local Preview

To preview the page locally, simply open `index.html` in your browser. All styles are loaded from CDN, so no build process is needed.

## Updates

To update the landing page:
1. Edit the files in this `docs/` directory
2. Copy the updated files to the `gh-pages` branch
3. Push to GitHub

See [DEPLOYMENT.md](../DEPLOYMENT.md) for detailed update instructions.
