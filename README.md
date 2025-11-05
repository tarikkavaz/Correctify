# GitHub Pages - Correctify Landing Page

This directory contains the static files for the Correctify landing page, deployed to GitHub Pages.

## Files

- `index.html` - Main landing page
- `logo.png` - App logo
- `screenshot.png` - App screenshot

## Deployment

**Automated Deployment**: The landing page is automatically deployed via GitHub Actions when you push changes to the `docs/` folder in the `master` branch. No manual steps required!

### How to Update the Landing Page

1. **Edit files in `docs/` folder** on `master` branch:
   - Edit `docs/index.html`
   - Update images in `docs/media/`
   - Modify any other files in `docs/`

2. **Commit and push to `master`**:
   ```bash
   git add docs/
   git commit -m "Update landing page"
   git push origin master
   ```

3. **GitHub Actions automatically deploys**:
   - Workflow detects changes to `docs/**`
   - Automatically copies contents to `gh-pages` root
   - Commits and pushes to `gh-pages` branch
   - GitHub Pages serves the updated content

**No manual `gh-pages` branch operations needed!** Just edit `docs/` and push to `master`.

### Manual Sync (Optional)

If you need to manually sync the landing page, you can use the helper script:

```bash
./scripts/sync-pages.sh
```

This script safely copies `docs/` contents to `gh-pages` root without affecting gitignored files like `.env` or `_tools`.

## Important: Verify Download Links

Before deploying, verify that the download link filenames in `index.html` match your actual GitHub release assets:

1. Visit https://github.com/tarikkavaz/Correctify/releases/latest
2. Check the actual filenames
3. Update the download links in `index.html` if they don't match

Current links point to:
- macOS: `Correctify_1.0.0_aarch64.dmg`
- Windows: `Correctify_1.0.0_x64-setup.exe`
- Linux: `correctify_1.0.0_amd64.AppImage`

## Local Preview

To preview the page locally, simply open `index.html` in your browser. All styles are loaded from CDN, so no build process is needed.
