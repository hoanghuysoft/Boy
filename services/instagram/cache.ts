/**
 * Instagram Service MMKV Response Cache Layer
 *
 * Caches Social AIO Instagram API responses locally using MMKV storage
 * with type-specific Time-To-Live (TTL) to avoid redundant relay calls.
 */

import { storage } from '../storage';

const CACHE_PREFIX = 'instagram:cache:';

export interface InstagramCacheEntry<T> {
  timestamp: number;
  ttlMs: number;
  data: T;
}

/**
 * Standard TTL Presets (in milliseconds)
 */
export const INSTAGRAM_CACHE_TTL = {
  /** User profile info: 6 hours */
  USER_INFO: 6 * 60 * 60 * 1000,
  /** Stories expire in 24h, keep cache fresh: 15 minutes */
  STORIES: 15 * 60 * 1000,
  /** User posts timeline pages: 30 minutes */
  POSTS: 30 * 60 * 1000,
  /** User reels: 30 minutes */
  REELS: 30 * 60 * 1000,
} as const;

/**
 * Create a deterministic cache key from API name and parameters
 */
export function generateInstagramCacheKey(
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
export function getInstagramCache<T>(key: string): T | null {
  const raw = storage.getString(key);
  if (!raw) return null;

  try {
    const entry: InstagramCacheEntry<T> = JSON.parse(raw);
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
 * Useful when relay server or extension is unreachable.
 */
export function getInstagramCacheWithFallback<T>(
  key: string
): { data: T | null; isStale: boolean } {
  const raw = storage.getString(key);
  if (!raw) return { data: null, isStale: false };

  try {
    const entry: InstagramCacheEntry<T> = JSON.parse(raw);
    const isStale = Date.now() - entry.timestamp > entry.ttlMs;
    return { data: entry.data, isStale };
  } catch {
    return { data: null, isStale: false };
  }
}

/**
 * Write response data into MMKV cache with TTL
 */
export function setInstagramCache<T>(key: string, data: T, ttlMs: number): void {
  const entry: InstagramCacheEntry<T> = {
    timestamp: Date.now(),
    ttlMs,
    data,
  };

  try {
    storage.set(key, JSON.stringify(entry));
  } catch (err) {
    console.warn('[Instagram Cache] Failed to write cache to MMKV:', err);
  }
}

/**
 * Invalidate a specific cache entry
 */
export function invalidateInstagramCache(key: string): void {
  storage.remove(key);
}

/**
 * Clear all Instagram cached responses in MMKV
 */
export function clearAllInstagramCache(): void {
  const allKeys = storage.getAllKeys();
  for (const key of allKeys) {
    if (key.startsWith(CACHE_PREFIX)) {
      storage.remove(key);
    }
  }
}
