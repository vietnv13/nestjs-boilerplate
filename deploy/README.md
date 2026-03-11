# Deployment — Ubuntu VPS with PM2

This monorepo runs two production processes:

| Process | Runtime                                                 | Port |
| ------- | ------------------------------------------------------- | ---- |
| `api`   | NestJS (PM2 **cluster** mode — one worker per CPU core) | 3000 |
| `web`   | Next.js (PM2 fork mode)                                 | 8000 |

Nginx sits in front of both, terminates TLS, applies rate-limiting, and forwards traffic.

---

## One-time server setup

```bash
git clone https://github.com/you/nestjs-boilerplate.git /srv/app
cd /srv/app
bash deploy/setup-ubuntu.sh
```

The script installs Node 22, pnpm, PM2, Nginx, Certbot, and applies OS-level
kernel tuning (open file descriptors, TCP settings) needed for high-concurrency.

### Create environment files

```bash
cp apps/api/.env.example apps/api/.env   # fill in secrets
cp apps/web/.env.example apps/web/.env
```

Minimum required variables in `apps/api/.env`:

```dotenv
DATABASE_URL=postgres://user:pass@127.0.0.1:5432/dbname
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
JWT_SECRET=<at-least-32-random-characters>
NODE_ENV=production
```

### Configure Nginx and HTTPS

```bash
# Replace example.com with your actual domain
sudo sed -i 's/example.com/yourdomain.com/g' /etc/nginx/sites-available/nestjs-boilerplate
sudo nginx -t && sudo systemctl reload nginx

# Issue TLS certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Deploy (every release)

```bash
./deploy/deploy.sh
```

Steps performed:

1. `git pull --ff-only` — aborts on conflict
2. `pnpm install --frozen-lockfile`
3. `pnpm run build`
4. `pm2 startOrReload` — **rolling reload** (no dropped requests in cluster mode)
5. Health check poll at `http://127.0.0.1:3000/health` — fails the deploy if the API does not become healthy

Skip pull when CI has already checked out:

```bash
./deploy/deploy.sh --skip-pull
```

---

## Scaling

### Single server — more CPU cores

Set `API_INSTANCES` before starting PM2 (or in the shell environment):

```bash
API_INSTANCES=4 pm2 startOrReload deploy/ecosystem.config.cjs --env production
```

Default is `max` (one worker per logical CPU core).

### Multi-server — horizontal scale-out

1. Run the same stack on each server (same steps as above).
2. Point a load balancer (or add extra `server` lines to Nginx `api_upstream`) at each machine's IP:

```nginx
upstream api_upstream {
  least_conn;
  server 10.0.0.1:3000;   # server 1
  server 10.0.0.2:3000;   # server 2
  server 10.0.0.3:3000;   # server 3
  keepalive 64;
}
```

#### Requirements for multi-server

| Concern           | Solution                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------- |
| **Session / JWT** | Stateless JWTs — already handled ✅                                                                           |
| **Rate limiting** | Uses in-memory store by default — must switch to Redis-backed `ThrottlerStorageRedisService` (see note below) |
| **Cache**         | Already configured for Redis via `REDIS_HOST` ✅                                                              |
| **File uploads**  | Store in S3 / object storage, not local disk                                                                  |
| **Logs**          | Centralise with Loki, Datadog, or ship logs from each node                                                    |

> **Rate-limiter Redis storage**: Install `nestjs-throttler-storage-redis` and update
> `ThrottlerModule` in `app.module.ts` to use `ThrottlerStorageRedisService`.
> Without this, each server instance has independent counters and a user can bypass
> rate limits by distributing requests across instances.

---

## PM2 commands

```bash
pm2 status               # process list with CPU / memory
pm2 logs api --lines 100 # tail API logs
pm2 logs web --lines 100
pm2 reload api           # zero-downtime rolling reload
pm2 restart api          # hard restart (briefly drops connections)
pm2 scale api 4          # change number of API workers at runtime
pm2 monit                # live dashboard
pm2 save                 # persist process list across reboots
```

---

## Database migrations

Run migrations **before** reloading PM2 to avoid running old code against a new schema:

```bash
pnpm --filter @workspace/database db:migrate
./deploy/deploy.sh --skip-pull
```
