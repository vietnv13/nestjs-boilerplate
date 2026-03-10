/**
 * Cache key generator
 *
 * Centralized cache key management to avoid key collisions
 */
export class CacheKeyGenerator {
  static user(id: string): string {
    return `user:${id}`;
  }

  static userByEmail(email: string): string {
    return `user:email:${email}`;
  }
}
