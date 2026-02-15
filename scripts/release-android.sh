#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────
# release-android.sh
#
# Automated Android APK release pipeline:
#   1. Bumps version in src/lib/appVersion.js
#   2. Builds web assets
#   3. Syncs Capacitor
#   4. Builds Android APK
#   5. Uploads APK to Supabase storage
#   6. Updates the app_download_android system setting
#   → All users see the update popup with direct download
#
# Usage:
#   ./scripts/release-android.sh 1.2.0
#   ./scripts/release-android.sh 1.2.0 "Bug fixes and new features"
#
# Requirements:
#   - Node.js, npm, Java 17+, Android SDK
#   - curl, jq
#   - SUPABASE_URL and SUPABASE_SERVICE_KEY env vars (or uses defaults)
# ──────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────
SUPABASE_URL="${SUPABASE_URL:-https://edaifkkkqwgavxkgozwi.supabase.co}"
SUPABASE_KEY="${SUPABASE_SERVICE_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkYWlma2trcXdnYXZ4a2dvendpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc2MjY5MCwiZXhwIjoyMDg2MzM4NjkwfQ.CQBzbO_gfga1Bx_gScOiJOF3p0q466ck7cL4FN3B-TY}"
STORAGE_BUCKET="uploads"
APK_FOLDER="apk"
SETTING_ID="57e5c39f-0b0e-46fb-814f-35776642aeb5"

# ── Args ──────────────────────────────────────────────────────────────
NEW_VERSION="${1:-}"
RELEASE_NOTES="${2:-}"

if [ -z "$NEW_VERSION" ]; then
  echo "Usage: $0 <version> [release-notes]"
  echo "  e.g. $0 1.2.0 \"Bug fixes and improvements\""
  exit 1
fi

# Validate semver format
if ! echo "$NEW_VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$'; then
  echo "Error: Version must be in semver format (e.g. 1.2.0)"
  exit 1
fi

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

echo "═══════════════════════════════════════════════════════════"
echo " Accredilink Android Release v${NEW_VERSION}"
echo "═══════════════════════════════════════════════════════════"

# ── Step 1: Bump version ─────────────────────────────────────────────
echo ""
echo "► Step 1/6: Bumping version to ${NEW_VERSION}..."

VERSION_FILE="src/lib/appVersion.js"
sed -i "s/export const APP_VERSION = '.*'/export const APP_VERSION = '${NEW_VERSION}'/" "$VERSION_FILE"
echo "  ✓ Updated ${VERSION_FILE}"

# Also bump android/app/build.gradle versionName
GRADLE_FILE="android/app/build.gradle"
if [ -f "$GRADLE_FILE" ]; then
  sed -i "s/versionName \".*\"/versionName \"${NEW_VERSION}\"/" "$GRADLE_FILE"
  # Bump versionCode (increment by 1)
  CURRENT_CODE=$(grep -oP 'versionCode \K[0-9]+' "$GRADLE_FILE")
  NEW_CODE=$((CURRENT_CODE + 1))
  sed -i "s/versionCode ${CURRENT_CODE}/versionCode ${NEW_CODE}/" "$GRADLE_FILE"
  echo "  ✓ Updated ${GRADLE_FILE} (versionCode ${NEW_CODE})"
fi

# ── Step 2: Build web assets ─────────────────────────────────────────
echo ""
echo "► Step 2/6: Building web assets..."
npm run build
echo "  ✓ Web build complete"

# ── Step 3: Sync Capacitor ───────────────────────────────────────────
echo ""
echo "► Step 3/6: Syncing Capacitor..."
npx cap sync android
echo "  ✓ Capacitor synced"

# ── Step 4: Build APK ────────────────────────────────────────────────
echo ""
echo "► Step 4/6: Building Android APK..."
cd android
./gradlew assembleDebug
cd ..

APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"
if [ ! -f "$APK_PATH" ]; then
  echo "Error: APK not found at ${APK_PATH}"
  exit 1
fi

APK_SIZE=$(wc -c < "$APK_PATH")
echo "  ✓ APK built ($(( APK_SIZE / 1024 / 1024 ))MB)"

# ── Step 5: Upload to Supabase storage ───────────────────────────────
echo ""
echo "► Step 5/6: Uploading APK to Supabase storage..."

STORAGE_PATH="${APK_FOLDER}/accredilink-v${NEW_VERSION}.apk"
PUBLIC_URL="${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${STORAGE_PATH}"

# Try to upload (upsert with x-upsert header)
UPLOAD_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/vnd.android.package-archive" \
  -H "x-upsert: true" \
  --data-binary @"$APK_PATH" \
  "${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${STORAGE_PATH}")

HTTP_CODE=$(echo "$UPLOAD_RESPONSE" | tail -1)
UPLOAD_BODY=$(echo "$UPLOAD_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
  echo "  ✓ Uploaded to ${PUBLIC_URL}"
else
  echo "  ✗ Upload failed (HTTP ${HTTP_CODE}): ${UPLOAD_BODY}"
  exit 1
fi

# ── Step 6: Update system setting ────────────────────────────────────
echo ""
echo "► Step 6/6: Updating app_download_android setting..."

NOW=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
SETTING_JSON=$(cat <<ENDJSON
{
  "version": "${NEW_VERSION}",
  "file_url": "${PUBLIC_URL}",
  "filename": "Accredilink-v${NEW_VERSION}.apk",
  "filesize": ${APK_SIZE},
  "updated_at": "${NOW}",
  "notes": "${RELEASE_NOTES:-Version ${NEW_VERSION}}"
}
ENDJSON
)

# Escape for JSON string value
ESCAPED_JSON=$(echo "$SETTING_JSON" | jq -c '.' | jq -Rs '.')

UPDATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  "${SUPABASE_URL}/rest/v1/system_settings?id=eq.${SETTING_ID}" \
  -d "{\"setting_value\": ${ESCAPED_JSON}}")

HTTP_CODE=$(echo "$UPDATE_RESPONSE" | tail -1)

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
  echo "  ✓ System setting updated — all users will see update popup"
else
  echo "  ✗ Setting update failed (HTTP ${HTTP_CODE})"
  echo "  Response: $(echo "$UPDATE_RESPONSE" | sed '$d')"
  exit 1
fi

# ── Done ─────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════"
echo " Release v${NEW_VERSION} complete!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo " APK:     ${PUBLIC_URL}"
echo " Version: ${NEW_VERSION}"
echo " Notes:   ${RELEASE_NOTES:-Version ${NEW_VERSION}}"
echo ""
echo " All users will now see the update popup on their next"
echo " page load (or within 30 minutes of cached check)."
echo ""
echo " Don't forget to commit & push the version bump:"
echo "   git add -A && git commit -m 'Release v${NEW_VERSION}' && git push"
echo ""
