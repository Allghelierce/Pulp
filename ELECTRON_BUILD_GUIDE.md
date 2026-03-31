# Pulp Desktop App - Build Guide

This guide explains how to build and distribute the Pulp desktop application for macOS, Windows, and Linux.

## Prerequisites

- Node.js 16+ and npm
- For macOS builds: macOS 10.13+
- For Windows builds: Windows 7+ (or build on Windows)
- For Linux builds: Linux with glibc 2.17+

## Initial Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create/Replace the icon:**
   - Replace `public/icon.svg` with your Pulp logo
   - The SVG will be automatically converted to PNG/ICNS formats during build

## Development

**Run Pulp in development mode with Electron:**
```bash
npm run electron-dev
```

This starts:
- Next.js dev server on `http://localhost:3000`
- Electron app in dev mode with DevTools open

## Building

### Build for All Platforms (macOS, Windows, Linux)

```bash
npm run dist
```

This creates:
- **macOS:** `Pulp-1.0.0.dmg` (installer) and `.zip` (portable)
- **Windows:** `Pulp-Setup-1.0.0.exe` (installer) and `.exe` (portable)
- **Linux:** `pulp-1.0.0.AppImage` (portable) and `.deb` (package)

Output files are in: `./dist/`

### Build for Specific Platform

```bash
# macOS only
npm run electron-builder -- -m

# Windows only
npm run electron-builder -- -w

# Linux only
npm run electron-builder -- -l
```

## Publishing Releases

Once you have your `.dmg`, `.exe`, and `.AppImage` files built:

### 1. Create a GitHub Release

```bash
# First, commit your changes
git add -A
git commit -m "Prepare Pulp v1.0.0 for release"

# Create a git tag
git tag -a v1.0.0 -m "Release Pulp v1.0.0"

# Push to GitHub
git push origin main
git push origin v1.0.0
```

### 2. Upload to GitHub Releases

1. Go to: https://github.com/Allghelierce/Pulp/releases
2. Click "Create a new release"
3. Select tag `v1.0.0`
4. Add release notes
5. Drag and drop your built files:
   - `Pulp-1.0.0.dmg` (from `dist/`)
   - `Pulp-Setup-1.0.0.exe` (from `dist/`)
   - `pulp-1.0.0.AppImage` (from `dist/`)
   - `pulp-1.0.0.deb` (from `dist/`) [optional]

6. Click "Publish release"

## File Structure

```
project/
├── public/
│   ├── electron.js          # Electron main process
│   ├── preload.js           # Electron security preload
│   └── icon.svg             # App icon (replace with your logo)
├── app/
│   ├── page.tsx             # Main app
│   └── pulp/                # Pulp landing page
├── dist/                    # Build output (auto-generated)
├── package.json             # Build config included
└── ELECTRON_BUILD_GUIDE.md  # This file
```

## Signing Your App (Optional but Recommended)

### macOS Code Signing

For distribution, you'll need to sign your app:

```bash
# Set your Apple Developer certificate
export APPLE_ID="your-email@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="your-app-password"

npm run dist
```

### Windows Code Signing

Windows Defender SmartScreen requires code signing. You can get a certificate from:
- DigiCert
- Sectigo
- Comodo

## Troubleshooting

**"Cannot find module" errors:**
```bash
npm install
rm -rf node_modules/.build-cache
npm run dist
```

**macOS build on Windows/Linux:**
Unfortunately, you must build on macOS to create a valid `.dmg` file. Consider using GitHub Actions CI/CD.

**Icon not showing:**
- Ensure `icon.svg` exists in `public/`
- For best results, provide PNG files directly:
  - `public/icon.png` (256x256)
  - `public/icon.icns` (macOS)
  - `public/icon.ico` (Windows)

## Automated Builds with GitHub Actions (Optional)

Create `.github/workflows/build.yml` to automatically build on release:

```yaml
name: Build Electron App
on:
  push:
    tags:
      - 'v*'
jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run dist
      - uses: softprops/action-gh-release@v1
        with:
          files: dist/**/*
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Next Steps

1. Update `icon.svg` with your actual Pulp logo
2. Run `npm run dist` to build all platforms
3. Test the built apps on each platform
4. Upload to GitHub Releases
5. Your landing page download button will work! 🎉

---

For more info, see:
- [Electron Documentation](https://www.electronjs.org/docs)
- [Electron Builder](https://www.electron.build/)
