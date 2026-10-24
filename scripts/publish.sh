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

npm version "$BUMP" --no-git-tag-version
npm run build

if [[ ! -d "$DIST" ]]; then
  echo "Build output not found at $DIST"
  exit 1
fi

mkdir -p "$SERVER_UI"
rm -rf "${SERVER_UI:?}"/*
cp -R "$DIST"/. "$SERVER_UI"/

echo "Published $(node -p "require('./package.json').version") → $SERVER_UI"
