#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Local: .env is optional if vars are already exported (e.g. Vercel dashboard).
if [[ ! -f "$ROOT/.env" && -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required — add .env (from .env-mock) or set env vars in the host (Vercel → Settings → Environment Variables)."
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

# Vercel builds a serverless function from src/main.ts — do not start a long-running process.
if [[ "${VERCEL:-}" == "1" ]]; then
  echo "==> Vercel build complete (skipping start:prod)"
  exit 0
fi

echo "==> Starting production server"
exec npm run start:prod
