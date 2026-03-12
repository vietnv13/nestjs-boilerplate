import type { DefaultOptions, UseMutationOptions } from '@tanstack/react-query'

/**
 * Default React Query configuration.
 *
 * - `refetchOnWindowFocus: false` — don't re-fetch when tab regains focus
 * - `retry: false` — don't retry failed requests automatically
 * - `staleTime: 60_000` — data is fresh for 1 minute
 *
 * @example
 * ```tsx
 * const queryClient = new QueryClient({ defaultOptions: queryConfig })
 * ```
 */
export const queryConfig = {
  queries: {
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: 1000 * 60, // 1 minute
  },
} satisfies DefaultOptions

type ApiFunctionReturnType<T extends (...args: unknown[]) => Promise<unknown>> = Awaited<
  ReturnType<T>
>

/**
 * Type helper for `useQuery` options — omit `queryKey` and `queryFn`
 * since those are provided by the query factory.
 *
 * @example
 * ```ts
 * type UserQueryOptions = QueryConfig<typeof getUserQuery>
 * ```
 */
export type QueryConfig<T extends (...args: unknown[]) => unknown> = Omit<
  ReturnType<T>,
  'queryKey' | 'queryFn'
>

/**
 * Type helper for `useMutation` options.
 * Infers the data, error, and variables types from the mutation function.
 *
 * @example
 * ```ts
 * type CreateUserMutation = MutationConfig<typeof createUser>
 * ```
 */
export type MutationConfig<T extends (...args: unknown[]) => Promise<unknown>> = UseMutationOptions<
  ApiFunctionReturnType<T>,
  Error,
  Parameters<T>[0]
>
