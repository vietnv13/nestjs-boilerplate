import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Injectable, Inject } from '@nestjs/common'

import type { Cache } from 'cache-manager'

/**
 * Cache service
 *
 * Wraps the cache-manager instance to provide a consistent caching API
 */
@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    return this.cache.get<T>(key)
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cache.set(key, value, ttl)
  }

  async del(key: string): Promise<void> {
    await this.cache.del(key)
  }

  /**
   * Get value from cache or populate it using the factory function
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = await this.cache.get<T>(key)
    if (cached !== undefined) {
      return cached
    }

    const value = await factory()
    if (value !== null && value !== undefined) {
      await this.cache.set(key, value, ttl)
    }

    return value
  }
}
