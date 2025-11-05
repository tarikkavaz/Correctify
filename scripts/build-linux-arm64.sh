#!/bin/bash

set -e

echo "Building Correctify for Linux ARM64 (aarch64-unknown-linux-gnu)"
echo ""

# Check if we're on Linux
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
  echo "Warning: This script is designed for Linux systems."
  echo "   For macOS/Windows, consider using Docker or GitHub Actions for cross-compilation."
  echo ""
fi

# Check if Rust is installed
if ! command -v rustc &> /dev/null; then
  echo "Rust is not installed. Please install Rust first: https://rustup.rs/"
  exit 1
fi

# Check if Rust target is installed
if ! rustup target list --installed | grep -q "aarch64-unknown-linux-gnu"; then
  echo "Installing Rust target: aarch64-unknown-linux-gnu"
  rustup target add aarch64-unknown-linux-gnu
else
  echo "Rust target aarch64-unknown-linux-gnu is already installed"
fi

# Check if cross-compilation tools are installed (on Linux)
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
  if ! command -v aarch64-linux-gnu-gcc &> /dev/null; then
    echo "Installing cross-compilation toolchain..."
    echo "   This requires sudo privileges to install: gcc-aarch64-linux-gnu, g++-aarch64-linux-gnu"
    sudo apt-get update
    sudo apt-get install -y gcc-aarch64-linux-gnu g++-aarch64-linux-gnu
  else
    echo "Cross-compilation toolchain is already installed"
  fi

  # Check if ARM64 system dependencies are installed
  echo "Checking ARM64 system dependencies..."
  MISSING_DEPS=()

  if ! dpkg -l | grep -q "libwebkit2gtk-4.1-dev:arm64"; then
    MISSING_DEPS+=("libwebkit2gtk-4.1-dev:arm64")
  fi
  if ! dpkg -l | grep -q "libappindicator3-dev:arm64"; then
    MISSING_DEPS+=("libappindicator3-dev:arm64")
  fi
  if ! dpkg -l | grep -q "librsvg2-dev:arm64"; then
    MISSING_DEPS+=("librsvg2-dev:arm64")
  fi
  if ! dpkg -l | grep -q "patchelf:arm64"; then
    MISSING_DEPS+=("patchelf:arm64")
  fi
  if ! dpkg -l | grep -q "libasound2-dev:arm64"; then
    MISSING_DEPS+=("libasound2-dev:arm64")
  fi

  if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
    echo "Installing ARM64 system dependencies..."
    echo "   This requires sudo privileges and may enable multiarch support"
    sudo dpkg --add-architecture arm64
    sudo apt-get update
    sudo apt-get install -y "${MISSING_DEPS[@]}"
  else
    echo "ARM64 system dependencies are already installed"
  fi
fi

# Set linker environment variable
export CARGO_TARGET_AARCH64_UNKNOWN_LINUX_GNU_LINKER=aarch64-linux-gnu-gcc

echo ""
echo "Building the application..."
echo "   Target: aarch64-unknown-linux-gnu"
echo ""

# Build the application
pnpm tauri build --target aarch64-unknown-linux-gnu

echo ""
echo "Build completed successfully!"
echo ""
echo "Build artifacts are located in:"
echo "  - DEB:   src-tauri/target/aarch64-unknown-linux-gnu/release/bundle/deb/"
echo "  - RPM:   src-tauri/target/aarch64-unknown-linux-gnu/release/bundle/rpm/"
echo "  - AppImage: src-tauri/target/aarch64-unknown-linux-gnu/release/bundle/appimage/"
