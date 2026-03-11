/**
 * PM2 ecosystem — multi-instance production configuration.
 *
 * Assumptions:
 * - Node >= 22.18.0
 * - `pnpm run build` has been executed before starting.
 * - Environment variables are set in the shell or via `apps/api/.env` / `apps/web/.env`.
 *
 * Scaling:
 * - API runs in PM2 cluster mode: one worker per CPU core (override with API_INSTANCES env var).
 * - Next.js uses its own built-in worker pool; a single PM2 fork is enough on most VPS.
 *   Set WEB_CONCURRENCY to enable multiple Next.js workers (requires --experimental-worker).
 *
 * Zero-downtime deploys:
 *   pm2 startOrReload deploy/ecosystem.config.cjs --env production
 */

const API_INSTANCES = process.env.API_INSTANCES ? Number(process.env.API_INSTANCES) : 'max'
const WEB_CONCURRENCY = process.env.WEB_CONCURRENCY ? Number(process.env.WEB_CONCURRENCY) : 1

module.exports = {
  apps: [
    // ─── NestJS API ──────────────────────────────────────────────────────────
    {
      name: 'api',
      cwd: 'apps/api',
      script: 'dist/main.js',
      interpreter: 'node',

      // Cluster mode: PM2 forks one worker per core, all share port 3000.
      // The OS distributes incoming connections across workers (SO_REUSEPORT).
      exec_mode: 'cluster',
      instances: API_INSTANCES,

      // Graceful shutdown: wait up to 10 s for in-flight requests to finish.
      kill_timeout: 10_000,
      // How long to wait for the app to be ready before PM2 considers it failed.
      wait_ready: true,
      listen_timeout: 15_000,

      // Restart strategy
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 2000,
      autorestart: true,

      // Memory ceiling — restart if a worker leaks past this.
      max_memory_restart: '512M',

      // Health check — PM2 polls this URL; restarts the worker if it fails.
      health_check_interval: 30_000,
      health_check_grace_period: 5000,

      // Source-map support for readable stack traces in production.
      node_args: '--enable-source-maps',

      time: true,
      error_file: 'logs/api.err.log',
      out_file: 'logs/api.out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      env: {
        NODE_ENV: 'production',
      },
    },

    // ─── Next.js Web ─────────────────────────────────────────────────────────
    {
      name: 'web',
      cwd: 'apps/web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      interpreter: 'node',

      // Next.js manages its own worker pool; fork mode is correct here.
      exec_mode: 'fork',
      instances: WEB_CONCURRENCY,

      kill_timeout: 10_000,
      wait_ready: true,
      listen_timeout: 20_000,

      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 2000,
      autorestart: true,
      max_memory_restart: '512M',

      node_args: '--enable-source-maps',

      time: true,
      error_file: 'logs/web.err.log',
      out_file: 'logs/web.out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      env: {
        NODE_ENV: 'production',
        PORT: '8000',
      },
    },
  ],
}
