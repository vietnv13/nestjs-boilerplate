import { z } from 'zod'

/**
 * Environment variables schema with Zod validation
 */
export const envSchema = z
  .object({
    // App environment
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    // App port
    PORT: z
      .string()
      .default('3000')
      .transform((value) => Number.parseInt(value, 10))
      .refine((value) => value > 0 && value < 65_536, {
        message: 'PORT must be between 1-65535',
      }),

    // Database connection
    DATABASE_URL: z.url().default('postgres://postgres:postgres@localhost:5432/vsa_m_nest'),

    // Database pool config
    DB_POOL_MAX: z
      .string()
      .default('20')
      .transform((value) => Number.parseInt(value, 10))
      .refine((value) => value > 0 && value <= 100, {
        message: 'DB_POOL_MAX must be between 1-100',
      }),

    DB_POOL_MIN: z
      .string()
      .default('5')
      .transform((value) => Number.parseInt(value, 10))
      .refine((value) => value >= 0 && value <= 50, {
        message: 'DB_POOL_MIN must be between 0-50',
      }),

    DB_POOL_IDLE_TIMEOUT: z
      .string()
      .default('30000')
      .transform((value) => Number.parseInt(value, 10))
      .refine((value) => value >= 1000, {
        message: 'DB_POOL_IDLE_TIMEOUT must be at least 1000ms',
      }),

    DB_POOL_CONNECTION_TIMEOUT: z
      .string()
      .default('10000')
      .transform((value) => Number.parseInt(value, 10))
      .refine((value) => value >= 1000, {
        message: 'DB_POOL_CONNECTION_TIMEOUT must be at least 1000ms',
      }),

    // JWT config
    JWT_SECRET: z
      .string()
      .min(32, { message: 'JWT_SECRET must be at least 32 characters' })
      .default('your-secret-key-change-me-in-production-min-32-chars'),

    JWT_EXPIRES_IN: z
      .string()
      .default('7d')
      .refine((value) => /^\d+[smhd]$/.test(value), {
        message: 'JWT_EXPIRES_IN format invalid (e.g., 60s, 15m, 2h, 7d)',
      }),

    JWT_REFRESH_EXPIRES_IN: z
      .string()
      .default('30d')
      .refine((value) => /^\d+[smhd]$/.test(value), {
        message: 'JWT_REFRESH_EXPIRES_IN format invalid (e.g., 60s, 15m, 2h, 7d)',
      }),

    // Redis config
    REDIS_HOST: z.string().default('localhost'),

    REDIS_PORT: z
      .string()
      .default('6379')
      .transform((value) => Number.parseInt(value, 10))
      .refine((value) => value > 0 && value < 65_536, {
        message: 'REDIS_PORT must be between 1-65535',
      }),

    REDIS_PASSWORD: z.string().optional(),

    REDIS_TTL: z
      .string()
      .default('3600')
      .transform((value) => Number.parseInt(value, 10))
      .refine((value) => value > 0, {
        message: 'REDIS_TTL must be greater than 0',
      }),

    // Queue
    QUEUE_DRIVER: z
      .string()
      .default('sync')
      .transform((v) => v.toLowerCase())
      .pipe(z.enum(['sync', 'redis'])),

    QUEUE_NAME: z.string().default('default'),

    QUEUE_CONCURRENCY: z
      .string()
      .default('5')
      .transform((v) => Number.parseInt(v, 10))
      .refine((v) => v > 0 && v <= 100, {
        message: 'QUEUE_CONCURRENCY must be between 1-100',
      }),

    // Scheduler
    SCHEDULER_ENABLED: z
      .string()
      .default('false')
      .transform((v) => v.toLowerCase() === 'true'),

    // Storage
    STORAGE_DRIVER: z
      .string()
      .default('local')
      .transform((v) => v.toLowerCase())
      .pipe(z.enum(['local', 's3'])),

    STORAGE_LOCAL_DIR: z.string().default('uploads'),

    /** Optional base URL used to build absolute URLs for local storage (e.g. https://api.example.com). */
    STORAGE_PUBLIC_BASE_URL: z.url().optional(),

    STORAGE_S3_BUCKET: z.string().optional(),
    STORAGE_S3_REGION: z.string().optional(),
    STORAGE_S3_ENDPOINT: z.url().optional(),
    STORAGE_S3_ACCESS_KEY_ID: z.string().optional(),
    STORAGE_S3_SECRET_ACCESS_KEY: z.string().optional(),
    STORAGE_S3_FORCE_PATH_STYLE: z
      .string()
      .default('false')
      .transform((v) => v.toLowerCase() === 'true'),

    /** Optional base URL for S3 objects if bucket is public/CDN-backed (otherwise signed URLs are used). */
    STORAGE_S3_PUBLIC_BASE_URL: z.url().optional(),
    STORAGE_S3_SIGNED_URL_EXPIRES_SEC: z
      .string()
      .default('900')
      .transform((value) => Number.parseInt(value, 10))
      .refine((value) => value > 0, {
        message: 'STORAGE_S3_SIGNED_URL_EXPIRES_SEC must be greater than 0',
      }),

    // Swagger auto-login (dev only)
    SWAGGER_TEST_EMAIL: z.email().optional(),
    SWAGGER_TEST_PASSWORD: z.string().optional(),
  })
  .superRefine((env, ctx) => {
    if (env.STORAGE_DRIVER !== 's3') return

    const required: [keyof typeof env, string][] = [
      ['STORAGE_S3_BUCKET', 'STORAGE_S3_BUCKET'],
      ['STORAGE_S3_REGION', 'STORAGE_S3_REGION'],
      ['STORAGE_S3_ACCESS_KEY_ID', 'STORAGE_S3_ACCESS_KEY_ID'],
      ['STORAGE_S3_SECRET_ACCESS_KEY', 'STORAGE_S3_SECRET_ACCESS_KEY'],
    ]

    for (const [key, label] of required) {
      if (!env[key]) {
        ctx.addIssue({
          code: 'custom',
          path: [key],
          message: `${label} is required when STORAGE_DRIVER=s3`,
        })
      }
    }
  })

/**
 * Environment type
 */
export type Env = z.infer<typeof envSchema>

/**
 * Validate environment variables
 * @throws {Error} if validation fails
 */
export function validateEnv(config: Record<string, unknown>): Env {
  try {
    return envSchema.parse(config)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues
        .map((error_: z.core.$ZodIssue) => `${error_.path.join('.')}: ${error_.message}`)
        .join('\n')

      throw new Error(
        `Environment validation failed:\n${errorMessages}\n\nCheck .env file or environment variables`,
      )
    }
    throw error
  }
}
