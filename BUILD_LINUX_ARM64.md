# Building for Linux ARM64

This guide explains how to build Correctify for Linux ARM64 (aarch64-unknown-linux-gnu) architecture, including both local builds and GitHub Actions automated builds.

## Overview

Linux ARM64 builds are useful for:
- Raspberry Pi 4+ devices
- ARM-based servers (AWS Graviton, etc.)
- Apple Silicon Macs running Linux (via Docker/VMs)
- Other ARM64 Linux distributions

## Prerequisites

### Local Build Requirements (Linux)

- **Linux distribution** (Ubuntu 22.04+ recommended, or Debian-based)
- **Rust** (latest stable version) - [Install Rust](https://rustup.rs/)
- **Node.js** (v18 or later) and **pnpm**
- **Cross-compilation toolchain** for ARM64
- **ARM64 system libraries** (via multiarch)

### GitHub Actions

The GitHub Actions workflow automatically handles cross-compilation using QEMU emulation. No local setup required - builds happen automatically on release.

## Quick Start

### Using the Build Script (Recommended)

The easiest way to build locally:

```bash
pnpm tauri:build:linux-arm64
```

This script will:
1. Check and install Rust target `aarch64-unknown-linux-gnu`
2. Install cross-compilation toolchain (if missing)
3. Install ARM64 system dependencies (if missing)
4. Build the application with proper linker configuration

### Manual Build

If you prefer to build manually:

```bash
# 1. Install Rust target
rustup target add aarch64-unknown-linux-gnu

# 2. Install cross-compilation tools
sudo apt-get update
sudo apt-get install -y gcc-aarch64-linux-gnu g++-aarch64-linux-gnu

# 3. Enable multiarch and install ARM64 dependencies
sudo dpkg --add-architecture arm64
sudo apt-get update
sudo apt-get install -y \
  libwebkit2gtk-4.1-dev:arm64 \
  libappindicator3-dev:arm64 \
  librsvg2-dev:arm64 \
  patchelf:arm64 \
  libasound2-dev:arm64

# 4. Set linker environment variable
export CARGO_TARGET_AARCH64_UNKNOWN_LINUX_GNU_LINKER=aarch64-linux-gnu-gcc

# 5. Build
pnpm tauri build --target aarch64-unknown-linux-gnu
```

## Build Artifacts

After a successful build, you'll find the installers in:

```
src-tauri/target/aarch64-unknown-linux-gnu/release/bundle/
├── deb/           # Debian/Ubuntu packages (.deb)
├── rpm/           # Red Hat/Fedora packages (.rpm)
└── appimage/      # AppImage (universal Linux format)
```

## GitHub Actions Automated Builds

The GitHub Actions workflow (`.github/workflows/release.yml`) automatically builds Linux ARM64 when you create a release commit.

### How It Works

1. **QEMU Emulation**: Uses `docker/setup-qemu-action@v3` to enable ARM64 emulation on x86_64 runners
2. **Cross-Compilation**: Installs `gcc-aarch64-linux-gnu` toolchain
3. **Multiarch Support**: Enables ARM64 architecture and installs ARM64 system libraries
4. **Automatic Upload**: Build artifacts are uploaded to GitHub Releases

### Triggering a Build

Create a release commit with the format:

```bash
git commit -m "release: v1.2.3"
git push origin master
```

The workflow will:
- Build for all platforms including Linux ARM64
- Upload artifacts to GitHub Releases
- Update the updater JSON with Linux ARM64 URLs

## Troubleshooting

### Build Fails with Linker Errors

**Problem**: `error: linker 'aarch64-linux-gnu-gcc' not found`

**Solution**: Install the cross-compilation toolchain:
```bash
sudo apt-get install -y gcc-aarch64-linux-gnu g++-aarch64-linux-gnu
```

Then set the linker:
```bash
export CARGO_TARGET_AARCH64_UNKNOWN_LINUX_GNU_LINKER=aarch64-linux-gnu-gcc
```

### Missing System Libraries

**Problem**: Build fails with missing library errors (e.g., `libwebkit2gtk-4.1-dev`)

**Solution**: Enable multiarch and install ARM64 versions:
```bash
sudo dpkg --add-architecture arm64
sudo apt-get update
sudo apt-get install -y libwebkit2gtk-4.1-dev:arm64 libappindicator3-dev:arm64 librsvg2-dev:arm64 patchelf:arm64 libasound2-dev:arm64
```

### QEMU Issues (GitHub Actions)

**Problem**: GitHub Actions build fails with QEMU-related errors

**Solution**: The workflow uses `docker/setup-qemu-action@v3` which should handle QEMU setup automatically. If issues persist:
- Check that the QEMU setup step runs before Rust installation
- Verify that `binfmt-support` is installed (handled by the workflow)

### Build Takes Too Long

**Problem**: Cross-compilation builds are slower than native builds

**Solution**: This is expected. Cross-compilation with QEMU emulation is inherently slower. Consider:
- Using GitHub Actions for automated builds (runs in parallel with other platforms)
- Building on native ARM64 hardware if available
- Using Docker with ARM64 base images for faster builds

## Building on macOS

Cross-compiling from macOS to Linux ARM64 is complex. Recommended approaches:

1. **Use GitHub Actions** (recommended) - Let CI/CD handle it
2. **Use Docker** - Run a Linux container with cross-compilation tools
3. **Use a Linux VM** - Native Linux environment for building

Example Docker approach:
```bash
docker run --platform linux/arm64 -v $(pwd):/workspace -w /workspace ubuntu:22.04 bash -c "apt-get update && apt-get install -y ... && pnpm tauri build --target aarch64-unknown-linux-gnu"
```

## Testing ARM64 Builds

### On Native ARM64 Hardware

If you have ARM64 hardware (Raspberry Pi, ARM server, etc.):
1. Copy the build artifacts to the device
2. Install the appropriate package (`.deb`, `.rpm`, or AppImage)
3. Run the application

### On x86_64 Hardware

Use QEMU to run ARM64 binaries:
```bash
# Install QEMU user emulation
sudo apt-get install -y qemu-user-static binfmt-support

# Register ARM64 support
sudo update-binfmts --enable qemu-aarch64

# Run the AppImage (example)
./correctify_1.0.0_arm64.AppImage
```

## Release Artifacts

When released via GitHub Actions, Linux ARM64 artifacts are named:
- **AppImage**: `correctify_<version>_arm64.AppImage`
- **DEB**: `correctify_<version>_arm64.deb`
- **RPM**: `correctify_<version>_arm64.rpm`

These are automatically included in GitHub Releases and the updater JSON endpoint.

## Additional Resources

- [Rust Cross-Compilation Guide](https://rust-lang.github.io/rustup/cross-compilation.html)
- [Tauri Building Documentation](https://tauri.app/guides/building/)
- [QEMU User Emulation](https://wiki.debian.org/QemuUserEmulation)
