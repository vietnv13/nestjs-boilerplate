// React Query config + type helpers
export { queryConfig } from './react-query'
export type { MutationConfig, QueryConfig } from './react-query'

// SSE client (browser-side EventSource wrapper)
export { SseClient, sseClient } from './sse-client'
export type { SseHandler } from './sse-client'

// SSE React context
export { SseProvider, useSse } from './sse-context'
