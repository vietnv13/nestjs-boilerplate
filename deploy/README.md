# PM2 Deployment (Ubuntu VPS)

This repo is a `pnpm` monorepo with two production processes:

- `api` (NestJS): `apps/api/dist/main.js` (expects `apps/api/.env`)
- `web` (Next.js): `apps/web` via `next start` on port `8000` (expects `apps/web/.env`)

## One-Time Setup (on VPS)

1. Clone the repo on the VPS.
2. Install prerequisites:

```bash
./deploy/setup-ubuntu.sh
```

3. Create env files:

- `apps/api/.env`
- `apps/web/.env`

## Deploy (every release)

From the repo root on the VPS:

```bash
./deploy/deploy.sh
```

## PM2 Commands

```bash
pm2 status
pm2 logs api
pm2 logs web
pm2 restart api
pm2 restart web
pm2 save
```

## Nginx (Optional)

Typical reverse proxy layout:

- `https://your-domain/api/*` -> `http://127.0.0.1:3000/api/*`
- `https://your-domain/*` -> `http://127.0.0.1:8000/*`

Ready-to-use config is in `deploy/nginx/`:

```bash
cat deploy/nginx/README.md
```
