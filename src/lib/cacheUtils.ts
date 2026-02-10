/**
 * Simple in-memory cache for Supabase queries
 * Reduces API calls and improves performance for frequently accessed data
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class QueryCache {
  private cache: Map<string, CacheEntry<any>>;
  private defaultTTL: number; // Time to live in milliseconds

  constructor(defaultTTL: number = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  /**
   * Generate cache key from query parameters
   */
  private generateKey(table: string, query: any): string {
    return `${table}:${JSON.stringify(query)}`;
  }

  /**
   * Get cached data if available and not expired
   */
  get<T>(table: string, query: any = {}): T | null {
    const key = this.generateKey(table, query);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cache entry with optional custom TTL
   */
  set<T>(table: string, query: any = {}, data: T, ttl?: number): void {
    const key = this.generateKey(table, query);
    const timestamp = Date.now();
    const expiresAt = timestamp + (ttl || this.defaultTTL);

    this.cache.set(key, {
      data,
      timestamp,
      expiresAt,
    });
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(table: string, query: any = {}): void {
    const key = this.generateKey(table, query);
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries for a table
   */
  invalidateTable(table: string): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (key.startsWith(`${table}:`)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Remove expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    this.cache.forEach(entry => {
      if (now > entry.expiresAt) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    });

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
    };
  }
}

// Global cache instance
export const queryCache = new QueryCache();

// Run cleanup every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    queryCache.cleanup();
  }, 10 * 60 * 1000);
}

/**
 * Wrapper for cached Supabase queries
 * 
 * @example
 * const data = await cachedQuery(
 *   supabase.from('profiles').select('*').eq('user_id', userId),
 *   'profiles',
 *   { user_id: userId },
 *   5 * 60 * 1000 // 5 min cache
 * );
 */
export async function cachedQuery<T>(
  query: any,
  table: string,
  queryParams: any = {},
  ttl?: number
): Promise<T | null> {
  // Try to get from cache first
  const cached = queryCache.get<T>(table, queryParams);
  if (cached !== null) {
    console.log(`[Cache HIT] ${table}`, queryParams);
    return cached;
  }

  console.log(`[Cache MISS] ${table}`, queryParams);

  // Execute query
  const { data, error } = await query;

  if (error) {
    console.error(`[Cache] Query error for ${table}:`, error);
    throw error;
  }

  // Store in cache
  queryCache.set(table, queryParams, data, ttl);

  return data as T;
}

/**
 * Invalidate cache after mutations
 * Call this after INSERT, UPDATE, or DELETE operations
 */
export function invalidateCache(table: string, query?: any): void {
  if (query) {
    queryCache.invalidate(table, query);
  } else {
    queryCache.invalidateTable(table);
  }
}
