#!/usr/bin/env bash
set -euo pipefail

# One-time Ubuntu 22.04 / 24.04 VPS setup.
#
# Installs: Node.js 22, pnpm (via corepack), PM2, Nginx, Certbot.
# Also applies OS-level tuning recommended for Node.js multi-instance workloads.
#
# Usage:
#   bash deploy/setup-ubuntu.sh

log() { echo "[$(date '+%H:%M:%S')] $*"; }

# ── 1. OS packages ────────────────────────────────────────────────────────────
log "install OS packages"
sudo apt-get update -qq
sudo apt-get install -y \
  ca-certificates curl git build-essential \
  nginx certbot python3-certbot-nginx \
  logrotate htop

# ── 2. Node.js 22 ─────────────────────────────────────────────────────────────
if ! node --version 2>/dev/null | grep -q 'v22'; then
  log "install Node.js 22 (NodeSource)"
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
log "Node.js $(node --version)"

# ── 3. pnpm (via corepack) ────────────────────────────────────────────────────
log "enable corepack + pnpm"
sudo corepack enable
corepack prepare pnpm@10.25.0 --activate
log "pnpm $(pnpm --version)"

# ── 4. PM2 ────────────────────────────────────────────────────────────────────
log "install pm2"
sudo npm install -g pm2@latest
log "PM2 $(pm2 --version)"

log "configure PM2 systemd startup"
# `pm2 startup` prints a sudo command; we capture and run it.
PM2_STARTUP=$(pm2 startup systemd -u "$USER" --hp "$HOME" | grep "sudo env")
eval "$PM2_STARTUP" || true

# ── 5. OS tuning for Node.js multi-instance ───────────────────────────────────
log "apply OS kernel / file-descriptor tuning"

# Increase open file descriptor limit (each connection = 1 fd).
sudo tee /etc/security/limits.d/99-nodejs.conf > /dev/null <<'LIMITS'
* soft nofile 65536
* hard nofile 65536
root soft nofile 65536
root hard nofile 65536
LIMITS

# Tune the network stack for high-throughput APIs.
sudo tee /etc/sysctl.d/99-nodejs.conf > /dev/null <<'SYSCTL'
# Increase the number of incoming connection backlog.
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 65535

# TCP keep-alive — detect dead connections faster.
net.ipv4.tcp_keepalive_time   = 120
net.ipv4.tcp_keepalive_intvl  = 30
net.ipv4.tcp_keepalive_probes = 3

# Reuse TIME_WAIT sockets — frees ports faster under load.
net.ipv4.tcp_tw_reuse = 1

# Increase local port range for outbound connections (e.g. DB calls).
net.ipv4.ip_local_port_range = 1024 65535

# File descriptor limits.
fs.file-max = 2097152
SYSCTL
sudo sysctl -p /etc/sysctl.d/99-nodejs.conf >/dev/null

# ── 6. Log rotation ───────────────────────────────────────────────────────────
log "configure logrotate for app logs"
sudo tee /etc/logrotate.d/nestjs-boilerplate > /dev/null <<'LOGROTATE'
/path/to/repo/logs/*.log {
  daily
  rotate 14
  compress
  delaycompress
  missingok
  notifempty
  sharedscripts
  postrotate
    pm2 reloadLogs 2>/dev/null || true
  endscript
}
LOGROTATE

# ── 7. Nginx ─────────────────────────────────────────────────────────────────
log "configure Nginx"

# Worker count = number of CPU cores; connections per worker = max fds / 2.
CPU_CORES=$(nproc)
sudo sed -i "s/^worker_processes.*/worker_processes ${CPU_CORES};/" /etc/nginx/nginx.conf

# Increase Nginx's worker_connections to handle more concurrent requests.
sudo sed -i 's/worker_connections [0-9]*/worker_connections 4096/' /etc/nginx/nginx.conf

# Ensure the Nginx server block directory exists.
sudo mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled

# Deploy the site config (fill in your domain before running Certbot).
sudo cp deploy/nginx/nestjs-boilerplate.conf /etc/nginx/sites-available/nestjs-boilerplate
sudo ln -sf /etc/nginx/sites-available/nestjs-boilerplate /etc/nginx/sites-enabled/nestjs-boilerplate
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t && sudo systemctl reload nginx

log "Nginx configured — update 'example.com' in /etc/nginx/sites-available/nestjs-boilerplate"
log "Then run: sudo certbot --nginx -d example.com -d www.example.com"

# ── Done ──────────────────────────────────────────────────────────────────────
log "setup complete"
log ""
log "Next steps:"
log "  1. Clone your repo and cd into it"
log "  2. Create apps/api/.env and apps/web/.env"
log "  3. Edit /etc/nginx/sites-available/nestjs-boilerplate — replace 'example.com'"
log "  4. Run: sudo certbot --nginx -d example.com -d www.example.com"
log "  5. Run: ./deploy/deploy.sh"
