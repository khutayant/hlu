#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -f "$ROOT/.env" ]]; then
  echo "Missing .env — copy .env-mock and set production values first."
  exit 1
fi

echo "==> Building server"
npm run build

if [[ ! -f "$ROOT/dist/src/main.js" ]]; then
  echo "Build output missing: dist/src/main.js"
  exit 1
fi

echo "==> Running migrations"
npm run migration:run

echo "==> Starting production server"
exec npm run start:prod
