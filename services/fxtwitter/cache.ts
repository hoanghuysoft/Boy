/**
 * FxTwitter High-Performance MMKV Response Cache
 *
 * Reduces external network requests dramatically by caching API responses locally
 * with type-specific Time-To-Live (TTL).
 */

import { storage } from '../storage';

const CACHE_PREFIX = 'fxtwitter:cache:';

export interface CacheEntry<T> {
  timestamp: number;
  ttlMs: number;
  data: T;
}

/**
 * Standard TTL Presets (in milliseconds)
 */
export const FX_CACHE_TTL = {
  /** User profile data changes infrequently: 6 hours */
  PROFILE: 6 * 60 * 60 * 1000,
  /** User about info: 12 hours */
  ABOUT: 12 * 60 * 60 * 1000,
  /** Historical status / thread details: 2 hours */
  STATUS_DETAIL: 2 * 60 * 60 * 1000,
  /** Media timeline pages: 20 minutes */
  MEDIA_TIMELINE: 20 * 60 * 1000,
  /** Status timeline pages: 20 minutes */
  STATUS_TIMELINE: 20 * 60 * 1000,
  /** Articles timeline pages: 1 hour */
  ARTICLES: 60 * 60 * 1000,
  /** Conversation replies: 15 minutes */
  CONVERSATION: 15 * 60 * 1000,
  /** Follower & Following lists: 6 hours */
  RELATIONSHIPS: 6 * 60 * 60 * 1000,
  /** Search results: 10 minutes */
  SEARCH: 10 * 60 * 1000,
  /** Trends: 15 minutes */
  TRENDS: 15 * 60 * 1000,
  /** Typeahead / autocomplete: 10 minutes */
  TYPEAHEAD: 10 * 60 * 1000,
} as const;

/**
 * Create a deterministic cache key from an endpoint and parameters
 */
export function generateCacheKey(endpoint: string, params?: Record<string, any>): string {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (!params || Object.keys(params).length === 0) {
    return `${CACHE_PREFIX}${normalizedEndpoint}`;
  }

  // Sort keys deterministically
  const sortedEntries = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${String(v)}`);

  const queryString = sortedEntries.join('&');
  return `${CACHE_PREFIX}${normalizedEndpoint}?${queryString}`;
}

/**
 * Read cached response if not expired
 */
export function getFxTwitterCache<T>(key: string): T | null {
  const raw = storage.getString(key);
  if (!raw) return null;

  try {
    const entry: CacheEntry<T> = JSON.parse(raw);
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
 * Crucial when daily quota is exceeded or device is offline.
 */
export function getFxTwitterCacheWithFallback<T>(
  key: string
): { data: T | null; isStale: boolean } {
  const raw = storage.getString(key);
  if (!raw) return { data: null, isStale: false };

  try {
    const entry: CacheEntry<T> = JSON.parse(raw);
    const isStale = Date.now() - entry.timestamp > entry.ttlMs;
    return { data: entry.data, isStale };
  } catch {
    return { data: null, isStale: false };
  }
}

/**
 * Write response data into MMKV cache with TTL
 */
export function setFxTwitterCache<T>(key: string, data: T, ttlMs: number): void {
  const entry: CacheEntry<T> = {
    timestamp: Date.now(),
    ttlMs,
    data,
  };

  try {
    storage.set(key, JSON.stringify(entry));
  } catch (err) {
    console.warn('[FxTwitter Cache] Failed to write cache to MMKV:', err);
  }
}

/**
 * Invalidate a specific cache entry
 */
export function invalidateFxTwitterCache(key: string): void {
  storage.remove(key);
}

/**
 * Clear all FxTwitter cached responses in MMKV
 */
export function clearAllFxTwitterCache(): void {
  const allKeys = storage.getAllKeys();
  for (const key of allKeys) {
    if (key.startsWith(CACHE_PREFIX)) {
      storage.remove(key);
    }
  }
}
