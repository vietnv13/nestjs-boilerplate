#!/usr/bin/env bash
set -euo pipefail

# Deploy script for Ubuntu VPS.
# - Pull latest code
# - Install deps (pnpm)
# - Build
# - Restart via PM2

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

mkdir -p logs

echo "[deploy] git fetch/pull"
git fetch --all --prune
git pull --ff-only

echo "[deploy] enable corepack + pnpm"
corepack enable >/dev/null 2>&1 || true
corepack prepare pnpm@10.25.0 --activate

echo "[deploy] install deps"
pnpm install --frozen-lockfile

echo "[deploy] build"
pnpm run build

if ! command -v pm2 >/dev/null 2>&1; then
  echo "[deploy] pm2 not found; install it first: npm i -g pm2"
  exit 1
fi

echo "[deploy] pm2 startOrReload"
pm2 startOrReload deploy/ecosystem.config.cjs --env production
pm2 save

echo "[deploy] done"

