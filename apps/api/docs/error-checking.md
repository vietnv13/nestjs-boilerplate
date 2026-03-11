# Production Error Checking Guide

This document is a practical runbook for quickly identifying and diagnosing production errors
in the NestJS Boilerplate API deployment (PM2 + Nginx).

Assumptions:

- API is behind Nginx.
- API listens on `127.0.0.1:3000` (PM2).
- Web listens on `127.0.0.1:8000` (PM2).
- Health endpoint is exposed at `/health` (proxied to the API by Nginx).

## 0. What To Capture First

Before you start SSHing into servers, capture:

- Exact time window (include timezone).
- URL + method (e.g. `POST /api/v2/auth/login`).
- Status code and response body (Problem Details JSON if available).
- Response headers:
  - `X-Correlation-Id` (always set by the API if present in CLS).
  - `X-Request-Id` (useful if your client sets it; the server will also generate one).
  - `traceparent` (if you use distributed tracing).

Those IDs are what you grep for in logs.

## 1. Quick Triage (5 minutes)

From the server:

```bash
# Is Nginx up?
sudo systemctl status nginx --no-pager

# Is the API responding locally?
curl -i http://127.0.0.1:3000/health

# Is the public endpoint responding through Nginx?
curl -i https://YOUR_DOMAIN/health

# Are PM2 processes up / restarting?
pm2 status
```

Interpretation:

- `curl .../health` returns `200` => the API process is up and can reach dependencies used by the health checks.
- Nginx returning `502/504` usually means the upstream (`api_upstream` or `web_upstream`) is down, slow, or misconfigured.
- A PM2 restart loop usually means a startup crash (invalid env, DB connection failure, missing migrations, etc).

## 2. Check API Logs (PM2)

The API logs to stdout (JSON in production). Start with:

```bash
pm2 logs api --lines 200
```

Filter for errors:

```bash
pm2 logs api --lines 2000 | rg '\"level\":(50|60)|\"level\":\"(error|fatal)\"|ERROR'
```

Search by correlation ID (recommended):

```bash
CORR_ID='YOUR_X_CORRELATION_ID'
pm2 logs api --lines 5000 | rg -F "$CORR_ID"
```

Notes:

- The API sets `X-Correlation-Id` in responses and also logs `correlationId` when the client sends `x-correlation-id`.
- If you are not seeing request logs, check the request-log whitelist in `apps/api/src/app/logger/logger.config.ts`.

## 3. Check Nginx Logs

On Ubuntu defaults:

```bash
sudo tail -n 200 /var/log/nginx/error.log
sudo tail -n 200 /var/log/nginx/access.log
```

Helpful patterns:

- `upstream prematurely closed connection` => API/web process crashed or closed the socket.
- `connect() failed (111: Connection refused) while connecting to upstream` => upstream process not listening on the configured port.
- A spike in `499` => clients aborted (often due to slow upstream).
- `limit_req` / `429` => rate limiting is working; check if thresholds are too aggressive.

## 4. Check Health Endpoints

Public (recommended):

- `GET /health` (proxied by Nginx to the API, logging disabled in Nginx config)

Direct (local on server):

- `GET http://127.0.0.1:3000/health`

If health is failing:

- Check DB connectivity first (most common).
- Check Redis connectivity (if you enabled Redis-backed cache features).
- Check disk/memory indicators (if enabled in your health controller).

## 5. Common Production Failure Modes

### 5.1 Bad Environment / Missing Secrets

Symptoms:

- PM2 restarts continuously.
- Errors on startup mention missing env vars or validation failures.

Checks:

- `pm2 logs api --lines 200`
- Confirm `apps/api/.env` on the server matches `.env.example` requirements.

### 5.2 Database Down / Wrong `DATABASE_URL`

Symptoms:

- `/health` returns `503`.
- Errors like connection refused / timeout.

Checks:

- API logs (look for Postgres connection errors).
- If you manage Postgres locally on the VPS:

```bash
sudo systemctl status postgresql --no-pager
```

### 5.3 Missing Migrations / Schema Drift

Symptoms:

- Errors like `relation "..." does not exist`.

Checks:

- API logs for query errors.
- Run migrations (before reloading PM2):

```bash
pnpm --filter @workspace/database db:migrate
pm2 reload api
```

### 5.4 Redis Down (Cache / Rate-limiter Storage)

Symptoms:

- Cache errors, timeouts, degraded performance.

Checks:

- API logs for Redis connection errors.
- If Redis is on the VPS:

```bash
sudo systemctl status redis-server --no-pager
```

### 5.5 Nginx 502/504

Symptoms:

- Users see `502 Bad Gateway` or `504 Gateway Timeout`.

Checks:

- `sudo tail -n 200 /var/log/nginx/error.log`
- Verify upstream ports:
  - API: `127.0.0.1:3000`
  - Web: `127.0.0.1:8000`

## 6. When You Need More Detail

### 6.1 Turn a Single Request Into a Trace

From a client or curl, set IDs explicitly:

```bash
curl -i \\
  -H 'x-request-id: debug-req-001' \\
  -H 'x-correlation-id: debug-corr-001' \\
  https://YOUR_DOMAIN/api/v2/auth/session
```

Then grep logs for `debug-corr-001`.

## 7. Inspect Error Responses (Client Side)

- All errors return `application/problem+json` per RFC 9457.
- Check HTTP responses for error details, including `type`, `title`, `status`, and `detail` fields.

## 8. Use Interactive API Docs (If Enabled)

- Visit `https://YOUR_DOMAIN/docs` (Scalar) or `https://YOUR_DOMAIN/swagger`.
- Test endpoints and review error responses.

## 9. Automated Alerts (Optional)

- Integrate log shipping (e.g., Loki, ELK, Datadog) for alerting.
- Set up health check monitoring (e.g., UptimeRobot, Pingdom).

---

For more details, see the [Error Codes Reference](./error-codes.md).
