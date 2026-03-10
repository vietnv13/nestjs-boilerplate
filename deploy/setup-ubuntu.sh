#!/usr/bin/env bash
set -euo pipefail

# One-time Ubuntu VPS setup for Node + pm2 + pnpm via corepack.
# This script is intentionally minimal and avoids touching nginx/firewalls.

echo "[setup] install OS packages"
sudo apt-get update
sudo apt-get install -y ca-certificates curl git build-essential

if ! command -v node >/dev/null 2>&1; then
  echo "[setup] install Node.js 22 (NodeSource)"
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

echo "[setup] enable corepack + pnpm"
sudo corepack enable || true
corepack prepare pnpm@10.25.0 --activate

echo "[setup] install pm2"
sudo npm i -g pm2

echo "[setup] pm2 startup (systemd)"
pm2 startup systemd -u "$USER" --hp "$HOME"

echo "[setup] done"

