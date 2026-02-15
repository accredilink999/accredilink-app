#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────
# release-android.sh
#
# Simple release trigger:
#   1. Bumps version in src/lib/appVersion.js
#   2. Commits and pushes to GitHub
#   3. GitHub Actions auto-triggers → builds APK → uploads to Supabase
#      → updates system setting → all users see update popup
#
# Usage:
#   ./scripts/release-android.sh 1.2.0 "Fixed login, added dark mode"
#
# Requirements: git, gh CLI (optional, for triggering with release notes)
# ──────────────────────────────────────────────────────────────────────
set -euo pipefail

NEW_VERSION="${1:-}"
RELEASE_NOTES="${2:-Version ${NEW_VERSION}}"

if [ -z "$NEW_VERSION" ]; then
  echo "Usage: $0 <version> [release-notes]"
  echo "  e.g. $0 1.2.0 \"Fixed login bug, added dark mode\""
  exit 1
fi

if ! echo "$NEW_VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$'; then
  echo "Error: Version must be in semver format (e.g. 1.2.0)"
  exit 1
fi

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo " Accredilink Release v${NEW_VERSION}"
echo "═══════════════════════════════════════════════════════════"

# Step 1: Bump version
echo ""
echo "► Bumping version to ${NEW_VERSION}..."
sed -i "s/export const APP_VERSION = '.*'/export const APP_VERSION = '${NEW_VERSION}'/" src/lib/appVersion.js
echo "  ✓ Updated src/lib/appVersion.js"

# Step 2: Commit and push
echo ""
echo "► Committing and pushing..."
git add src/lib/appVersion.js
git commit -m "Release v${NEW_VERSION}

${RELEASE_NOTES}"
git push origin master
echo "  ✓ Pushed to GitHub"

# Step 3: GitHub Actions auto-triggers (appVersion.js changed)
# Also trigger workflow_dispatch with release notes for the popup
echo ""
echo "► Triggering GitHub Actions with release notes..."
if command -v gh &>/dev/null || [ -f "/c/Program Files/GitHub CLI/gh.exe" ]; then
  GH_CMD="${GH_CMD:-gh}"
  if [ -f "/c/Program Files/GitHub CLI/gh.exe" ]; then
    GH_CMD="/c/Program Files/GitHub CLI/gh.exe"
  fi
  "$GH_CMD" workflow run "Build & Release Android APK" \
    -R accredilink999/accredilink-app \
    -f "release_notes=${RELEASE_NOTES}" 2>/dev/null && \
    echo "  ✓ Workflow triggered with notes" || \
    echo "  ⚠ Could not trigger workflow (auto-trigger from push will still run)"
else
  echo "  ⚠ gh CLI not found — workflow will auto-trigger from push"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo " Release v${NEW_VERSION} triggered!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo " GitHub Actions will now:"
echo "   1. Build the APK"
echo "   2. Upload to Supabase storage"
echo "   3. Update the system setting"
echo "   4. All users see the update popup"
echo ""
echo " Track progress: https://github.com/accredilink999/accredilink-app/actions"
echo ""
