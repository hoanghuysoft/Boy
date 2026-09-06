/**
 * Threads Service MMKV Response Cache Layer
 *
 * Caches Social AIO Threads API responses locally using MMKV storage
 * with type-specific Time-To-Live (TTL) to avoid redundant relay calls.
 */

import { storage } from '../storage';

const CACHE_PREFIX = 'threads:cache:';

export interface ThreadsCacheEntry<T> {
  timestamp: number;
  ttlMs: number;
  data: T;
}

/**
 * Standard TTL Presets (in milliseconds)
 */
export const THREADS_CACHE_TTL = {
  /** User profile info: 6 hours */
  USER_INFO: 6 * 60 * 60 * 1000,
  /** User threads/posts timeline pages: 20 minutes */
  POSTS: 20 * 60 * 1000,
} as const;

/**
 * Create a deterministic cache key from API name and parameters
 */
export function generateThreadsCacheKey(
  apiname: string,
  params?: Record<string, any>
): string {
  if (!params || Object.keys(params).length === 0) {
    return `${CACHE_PREFIX}${apiname}`;
  }

  const sortedEntries = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${String(v)}`);

  const queryString = sortedEntries.join('&');
  return `${CACHE_PREFIX}${apiname}?${queryString}`;
}

/**
 * Read cached response if not expired
 */
export function getThreadsCache<T>(key: string): T | null {
  const raw = storage.getString(key);
  if (!raw) return null;

  try {
    const entry: ThreadsCacheEntry<T> = JSON.parse(raw);
    const isExpired = Date.now() - entry.timestamp > entry.ttlMs;
    if (isExpired) {
      storage.remove(key);
      return null;
    }
    return entry.data;
  } catch {
    storage.remove(key);
    return null;
  }
}

/**
 * Read cached response with fallback (returns stale data if expired)
 */
export function getThreadsCacheWithFallback<T>(
  key: string
): { data: T | null; isStale: boolean } {
  const raw = storage.getString(key);
  if (!raw) return { data: null, isStale: false };

  try {
    const entry: ThreadsCacheEntry<T> = JSON.parse(raw);
    const isStale = Date.now() - entry.timestamp > entry.ttlMs;
    return { data: entry.data, isStale };
  } catch {
    return { data: null, isStale: false };
  }
}

/**
 * Write response data into MMKV cache with TTL
 */
export function setThreadsCache<T>(key: string, data: T, ttlMs: number): void {
  const entry: ThreadsCacheEntry<T> = {
    timestamp: Date.now(),
    ttlMs,
    data,
  };

  try {
    storage.set(key, JSON.stringify(entry));
  } catch (err) {
    console.warn('[Threads Cache] Failed to write cache to MMKV:', err);
  }
}

/**
 * Invalidate a specific cache entry
 */
export function invalidateThreadsCache(key: string): void {
  storage.remove(key);
}

/**
 * Clear all Threads cached responses in MMKV
 */
export function clearAllThreadsCache(): void {
  const allKeys = storage.getAllKeys();
  for (const key of allKeys) {
    if (key.startsWith(CACHE_PREFIX)) {
      storage.remove(key);
    }
  }
}
