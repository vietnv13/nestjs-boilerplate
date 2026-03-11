#!/usr/bin/env bash
set -euo pipefail

# Zero-downtime deploy script.
#
# Steps:
#   1. Pull latest code (fast-forward only — fails if local changes exist)
#   2. Install deps with frozen lockfile
#   3. Build all packages
#   4. Reload PM2 cluster (rolling restart — keeps old workers alive until new
#      ones are ready, so requests are never dropped)
#   5. Verify the API is healthy before finishing
#
# Usage:
#   ./deploy/deploy.sh                  # deploy current branch
#   ./deploy/deploy.sh --skip-pull      # skip git pull (CI already checked out)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# ── Helpers ───────────────────────────────────────────────────────────────────
log()  { echo "[$(date '+%H:%M:%S')] $*"; }
die()  { echo "[$(date '+%H:%M:%S')] ERROR: $*" >&2; exit 1; }

SKIP_PULL=false
for arg in "$@"; do
  [[ $arg == "--skip-pull" ]] && SKIP_PULL=true
done

# ── Guards ────────────────────────────────────────────────────────────────────
command -v pm2  >/dev/null 2>&1 || die "pm2 not found — run: sudo npm i -g pm2"
command -v pnpm >/dev/null 2>&1 || die "pnpm not found — run setup-ubuntu.sh first"

mkdir -p logs

# ── 1. Pull ───────────────────────────────────────────────────────────────────
if [[ $SKIP_PULL == false ]]; then
  log "git fetch/pull"
  git fetch --all --prune
  git pull --ff-only || die "git pull failed — resolve conflicts or use --skip-pull"
fi

COMMIT=$(git rev-parse --short HEAD)
log "deploying commit $COMMIT"

# ── 2. Install ────────────────────────────────────────────────────────────────
log "pnpm install (frozen)"
pnpm install --frozen-lockfile

# ── 3. Build ──────────────────────────────────────────────────────────────────
log "building"
pnpm run build

# ── 4. Reload PM2 (zero-downtime rolling restart) ────────────────────────────
# `pm2 startOrReload` performs a rolling reload in cluster mode:
# it brings up new workers, waits for them to be ready (wait_ready=true),
# then gracefully shuts down old workers — no dropped requests.
log "pm2 reload (rolling)"
pm2 startOrReload deploy/ecosystem.config.cjs --env production --update-env

pm2 save --force

# ── 5. Health check ───────────────────────────────────────────────────────────
API_PORT="${PORT:-3000}"
HEALTH_URL="http://127.0.0.1:${API_PORT}/health"
MAX_ATTEMPTS=15
WAIT_SECONDS=2

log "waiting for API to be healthy at $HEALTH_URL"
for i in $(seq 1 $MAX_ATTEMPTS); do
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")
  if [[ $HTTP_STATUS == "200" ]]; then
    log "API is healthy (attempt $i)"
    break
  fi
  if [[ $i -eq $MAX_ATTEMPTS ]]; then
    die "API did not become healthy after $((MAX_ATTEMPTS * WAIT_SECONDS))s (last status: $HTTP_STATUS)"
  fi
  log "  attempt $i/$MAX_ATTEMPTS — status $HTTP_STATUS, retrying in ${WAIT_SECONDS}s…"
  sleep "$WAIT_SECONDS"
done

# ── Done ──────────────────────────────────────────────────────────────────────
log "deploy complete — commit $COMMIT"
pm2 ls
