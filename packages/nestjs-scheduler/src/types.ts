export type JobResult = Record<string, unknown>

export interface ScheduledJobConfig {
  id: string
  name: string
  cron: string
  enabled: boolean
  timeoutMs: number
  description: string | null
}

export { type JobExecutionStatus } from '@workspace/database'
