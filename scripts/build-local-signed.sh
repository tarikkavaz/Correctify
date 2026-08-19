#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DEFAULT_KEY_PATH="/Users/tarik/Library/Mobile Documents/com~apple~CloudDocs/Work/Other/Correctify/_tools/Signing & Notarization/correctify-updater.key"

export TAURI_SIGNING_PRIVATE_KEY_PATH="${TAURI_SIGNING_PRIVATE_KEY_PATH:-$DEFAULT_KEY_PATH}"

if [[ ! -r "$TAURI_SIGNING_PRIVATE_KEY_PATH" ]]; then
  echo "Updater private key not found: $TAURI_SIGNING_PRIVATE_KEY_PATH" >&2
  exit 1
fi

if [[ -z "${TAURI_SIGNING_PRIVATE_KEY_PASSWORD:-}" ]]; then
  read -r -s -p "Updater key password: " TAURI_SIGNING_PRIVATE_KEY_PASSWORD
  echo
  export TAURI_SIGNING_PRIVATE_KEY_PASSWORD
fi

# Tauri's updater bundler consumes the encrypted key content, rather than the
# path helper accepted by the signer CLI. The value exists only in this build
# process and is never written into the repository or an artifact.
export TAURI_SIGNING_PRIVATE_KEY="$(<"$TAURI_SIGNING_PRIVATE_KEY_PATH")"

cd "$PROJECT_DIR"
pnpm tauri build --bundles app,dmg

echo
echo "Signed local updater artifacts:"
find src-tauri/target/release/bundle -type f \( -name '*.dmg' -o -name '*.tar.gz' -o -name '*.sig' \) -print
