/**
 * PM2 ecosystem for this monorepo.
 *
 * Assumptions:
 * - Node >= 22.18.0
 * - `pnpm run build` has been executed before starting.
 * - `.env` files live in `apps/api/.env` and `apps/web/.env` (or env vars are set another way).
 */

module.exports = {
  apps: [
    {
      name: 'api',
      cwd: 'apps/api',
      script: 'dist/main.js',
      interpreter: 'node',
      exec_mode: 'fork',
      instances: 1,
      time: true,
      env: {
        NODE_ENV: 'production',
      },
      // PM2 log files (relative to repo root)
      error_file: 'logs/api.err.log',
      out_file: 'logs/api.out.log',
    },
    {
      name: 'web',
      cwd: 'apps/web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 8000',
      interpreter: 'node',
      exec_mode: 'fork',
      instances: 1,
      time: true,
      env: {
        NODE_ENV: 'production',
        PORT: '8000',
      },
      error_file: 'logs/web.err.log',
      out_file: 'logs/web.out.log',
    },
  ],
}

