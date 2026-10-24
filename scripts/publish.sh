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

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Not a git repository."
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is dirty. Commit all changes first, then re-run."
  echo "Agent flow: version patch|minor|main → git add + commit, then publish."
  git status -sb
  exit 1
fi

npm version "$BUMP" --no-git-tag-version
NEW_VER="$(node -p "require('./package.json').version")"

git add package.json package-lock.json
git commit -m "$NEW_VER"

npm run build

if [[ ! -d "$DIST" ]]; then
  echo "Build output not found at $DIST"
  exit 1
fi

mkdir -p "$SERVER_UI"
rm -rf "${SERVER_UI:?}"/*
cp -R "$DIST"/. "$SERVER_UI"/

echo "Published $NEW_VER → $SERVER_UI"
echo "Version commit: $NEW_VER (push separately with git push)"
