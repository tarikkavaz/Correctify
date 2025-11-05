#!/bin/bash

# Sync docs/ folder contents to gh-pages branch root
# This script safely copies only the contents of docs/ to gh-pages root
# without affecting gitignored files like .env or _tools

set -e

echo "🔄 Syncing docs/ to gh-pages branch..."

# Check if we're on master branch
current_branch=$(git branch --show-current)
if [ "$current_branch" != "master" ]; then
    echo "⚠️  Warning: You're not on master branch (currently on $current_branch)"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  Warning: You have uncommitted changes"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted. Please commit or stash your changes first."
        exit 1
    fi
fi

# Check if docs/ directory exists
if [ ! -d "docs" ]; then
    echo "❌ Error: docs/ directory not found"
    exit 1
fi

# Stash any uncommitted changes to avoid conflicts
git stash push -m "sync-pages-temp-stash" || true

# Checkout gh-pages branch
echo "📦 Checking out gh-pages branch..."
git checkout gh-pages

# Remove old docs folder if it exists
if [ -d "docs" ]; then
    echo "🗑️  Removing old docs/ folder from gh-pages..."
    rm -rf docs
fi

# Copy contents from master's docs/ to current directory (gh-pages root)
echo "📋 Copying docs/ contents to gh-pages root..."
git checkout master -- docs/

# Move contents from docs/ to root
if [ -d "docs" ]; then
    cp -r docs/* .
    rm -rf docs
    echo "✅ Files copied successfully"
else
    echo "❌ Error: Could not checkout docs/ from master"
    git checkout master
    git stash pop || true
    exit 1
fi

# Show what was copied
echo ""
echo "📁 Files in gh-pages root:"
ls -la | grep -v "^d.*\.git$" | grep -v "^total"

# Check if there are changes to commit
if git diff --quiet && git diff --cached --quiet; then
    echo ""
    echo "ℹ️  No changes to commit"
    git checkout master
    git stash pop || true
    exit 0
fi

# Ask if user wants to commit
echo ""
read -p "Commit and push these changes to gh-pages? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git add -A
    git commit -m "Sync landing page from docs/"
    git push origin gh-pages
    echo "✅ Successfully pushed to gh-pages"
else
    echo "ℹ️  Changes staged but not committed. Run 'git commit' manually if needed."
fi

# Switch back to master
echo "🔄 Switching back to master branch..."
git checkout master

# Restore stashed changes if any
git stash pop || true

echo "✅ Done!"
