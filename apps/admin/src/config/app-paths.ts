export const appPaths = {
  home: {
    getHref: () => '/dashboard',
  },
  dashboard: {
    getHref: () => '/dashboard',
  },
  auth: {
    register: {
      getHref: (redirectTo?: string | null) =>
        `/register${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`,
    },
    login: {
      getHref: (redirectTo?: string | null) =>
        `/login${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`,
    },
  },
} as const
