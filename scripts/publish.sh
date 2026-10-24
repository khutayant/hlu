#!/usr/bin/env bash
set -euo pipefail

BUMP="${1:-}"
if [[ "$BUMP" != "patch" && "$BUMP" != "minor" && "$BUMP" != "major" ]]; then
  echo "Usage: publish.sh <patch|minor|major>"
  exit 1
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER_UI="$(cd "$ROOT/../hlu-server" && pwd)/ui"
DIST="$ROOT/dist"

cd "$ROOT"

# Version bump only (no build/copy) is scripts/version.sh — use npm run version:* for that.
bash "$ROOT/scripts/version.sh" "$BUMP"

npm run build

if [[ ! -d "$DIST" ]]; then
  echo "Build output not found at $DIST"
  exit 1
fi

mkdir -p "$SERVER_UI"
rm -rf "${SERVER_UI:?}"/*
cp -R "$DIST"/. "$SERVER_UI"/

NEW_VER="$(node -p "require('./package.json').version")"
echo "Published $NEW_VER → $SERVER_UI"
