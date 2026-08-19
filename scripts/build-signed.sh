#!/bin/bash

set -euo pipefail

DEFAULT_UPDATER_KEY_PATH="/Users/tarik/Library/Mobile Documents/com~apple~CloudDocs/Work/Other/Correctify/_tools/Signing & Notarization/correctify-updater.key"

# Load environment variables from .env file
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo "✓ Loaded environment variables from .env"
else
  echo "✗ .env file not found"
  exit 1
fi

# Verify required variables are set
if [ -z "$APPLE_ID" ] || [ -z "$APPLE_PASSWORD" ] || [ -z "$APPLE_TEAM_ID" ]; then
  echo "✗ Missing required environment variables"
  echo "  Please ensure APPLE_ID, APPLE_PASSWORD, and APPLE_TEAM_ID are set in .env"
  exit 1
fi

export TAURI_SIGNING_PRIVATE_KEY_PATH="${TAURI_SIGNING_PRIVATE_KEY_PATH:-$DEFAULT_UPDATER_KEY_PATH}"

if [[ ! -r "$TAURI_SIGNING_PRIVATE_KEY_PATH" ]]; then
  echo "✗ Updater private key not found: $TAURI_SIGNING_PRIVATE_KEY_PATH" >&2
  exit 1
fi

if [[ -z "${TAURI_SIGNING_PRIVATE_KEY_PASSWORD:-}" ]]; then
  read -r -s -p "Updater key password: " TAURI_SIGNING_PRIVATE_KEY_PASSWORD
  echo
  export TAURI_SIGNING_PRIVATE_KEY_PASSWORD
fi

# The updater bundler needs the encrypted key contents. The key remains outside
# the repository and is only exposed to this build process.
export TAURI_SIGNING_PRIVATE_KEY="$(<"$TAURI_SIGNING_PRIVATE_KEY_PATH")"

echo "✓ Building with notarization..."
echo "  APPLE_ID: $APPLE_ID"
echo "  APPLE_TEAM_ID: $APPLE_TEAM_ID"

# Run Tauri build with environment variables
pnpm tauri:build
