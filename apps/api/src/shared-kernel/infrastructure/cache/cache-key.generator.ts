/**
 * Cache key generator
 *
 * Centralized cache key management to avoid key collisions
 */
export const CacheKeyGenerator = {
  user(id: string): string {
    return `user:${id}`;
  },

  userByEmail(email: string): string {
    return `user:email:${email}`;
  },
};
