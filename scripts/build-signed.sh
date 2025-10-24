#!/bin/bash

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

echo "✓ Building with notarization..."
echo "  APPLE_ID: $APPLE_ID"
echo "  APPLE_TEAM_ID: $APPLE_TEAM_ID"

# Run Tauri build with environment variables
pnpm tauri:build
