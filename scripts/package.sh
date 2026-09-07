#!/usr/bin/env bash
#
# Package Doodle Clash into a single submission-ready zip.
#
# Usage:
#   ./scripts/package.sh [output-name]
#
# Produces dist/<output-name>.zip (default name: doodle-clash) containing
# only the files needed to run the game, with index.html sitting at the
# zip's top level (not nested inside a folder). Validates the submission
# rules after packaging:
#   - single .zip file, no larger than 35MB
#   - index.html at the top level of the zip
#
# Re-run this after any change to the shipped game files (index.html,
# src/, public/) to refresh the submission zip.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

OUTPUT_NAME="${1:-doodle-clash}"
DIST_DIR="$REPO_ROOT/dist"
ZIP_PATH="$DIST_DIR/${OUTPUT_NAME}.zip"
MAX_BYTES=$((35 * 1024 * 1024))

# Files/folders that make up the playable game. Zipped relative to the repo
# root so index.html lands at the zip's top level, not inside a folder.
INCLUDE_PATHS=(
  index.html
  src
  public
)

for p in "${INCLUDE_PATHS[@]}"; do
  if [ ! -e "$p" ]; then
    echo "FAIL: expected file/folder '$p' not found at repo root ($REPO_ROOT)."
    exit 1
  fi
done

mkdir -p "$DIST_DIR"
rm -f "$ZIP_PATH"

echo "Packaging into $ZIP_PATH ..."
zip -r -X -q "$ZIP_PATH" "${INCLUDE_PATHS[@]}" \
  -x "**/.DS_Store" \
  -x "**/*.map"

ZIP_SIZE=$(stat -f%z "$ZIP_PATH" 2>/dev/null || stat -c%s "$ZIP_PATH")
ZIP_SIZE_MB=$(awk -v b="$ZIP_SIZE" 'BEGIN { printf "%.2f", b / 1048576 }')

echo
echo "Created: $ZIP_PATH ($ZIP_SIZE_MB MB)"
echo

FAIL=0

# 1. Size must be under 35MB
if [ "$ZIP_SIZE" -gt "$MAX_BYTES" ]; then
  echo "FAIL: zip is ${ZIP_SIZE_MB}MB, exceeds the 35MB limit."
  FAIL=1
else
  echo "OK:   size is ${ZIP_SIZE_MB}MB, under the 35MB limit."
fi

# 2. index.html must be at the top level (not inside a folder)
if unzip -Z1 "$ZIP_PATH" | grep -qx "index.html"; then
  echo "OK:   index.html is at the top level of the zip."
else
  echo "FAIL: index.html is not at the top level of the zip."
  FAIL=1
fi

echo
if [ "$FAIL" -ne 0 ]; then
  echo "Packaging finished with errors -- see FAIL lines above."
  exit 1
fi

echo "Packaging succeeded: $ZIP_PATH"
