/**
 * FxTwitter API Client
 *
 * Built on top of the centralized `fxTwitterClient` factory from `@/services/client`.
 * Adds:
 * - Persistent MMKV cache with type-specific TTL
 * - Daily quota protection (100k requests/day free tier limitation)
 * - Sliding window burst rate limiter
 * - In-flight concurrent request deduplication
 * - Stale-while-error fallback
 */

import { fxTwitterClient, NitroClientError } from '../client';
import {
  generateCacheKey,
  getFxTwitterCache,
  getFxTwitterCacheWithFallback,
  setFxTwitterCache,
} from './cache';
import {
  acquireBurstSlot,
  checkAndIncrementDailyQuota,
  deduplicateRequest,
  FxTwitterQuotaExceededError,
  FxTwitterRateLimitError,
} from './rateLimiter';

export { FxTwitterQuotaExceededError, FxTwitterRateLimitError };

export interface FxRequestOptions {
  params?: Record<string, any>;
  headers?: Record<string, string>;
  skipCache?: boolean;
  ttlMs?: number;
}

export class FxTwitterApiError extends Error {
  status: number;
  code?: number;
  url: string;
  responseBody?: any;

  constructor(message: string, status: number, url: string, code?: number, responseBody?: any) {
    super(message);
    this.name = 'FxTwitterApiError';
    this.status = status;
    this.code = code;
    this.url = url;
    this.responseBody = responseBody;
  }
}

/**
 * Execute a GET request against FxTwitter API v2 using the centralized client factory
 */
export async function fxGet<T>(
  endpoint: string,
  options: FxRequestOptions = {}
): Promise<T> {
  const { params, headers, skipCache = false, ttlMs = 0 } = options;
  const cacheKey = generateCacheKey(endpoint, params);

  // 1. Check local MMKV cache first (avoids consuming daily quota and network)
  if (!skipCache && ttlMs > 0) {
    const cached = getFxTwitterCache<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }

  // 2. In-flight request deduplication
  return deduplicateRequest<T>(cacheKey, async () => {
    // Double check cache in case a concurrent request just resolved
    if (!skipCache && ttlMs > 0) {
      const cached = getFxTwitterCache<T>(cacheKey);
      if (cached !== null) return cached;
    }

    // 3. Quota Guard: Check and increment daily request counter
    try {
      checkAndIncrementDailyQuota();
    } catch (quotaError) {
      // If daily quota is exhausted, serve stale cached fallback if available
      const { data: staleData } = getFxTwitterCacheWithFallback<T>(cacheKey);
      if (staleData) {
        console.warn(
          '[FxTwitter] Daily quota reached, serving stale cache fallback for:',
          endpoint
        );
        return staleData;
      }
      throw quotaError;
    }

    // 4. Sliding Window Burst Limiter: Throttle if approaching rate limits
    await acquireBurstSlot();

    try {
      // 5. Execute request via the client factory
      const res = await fxTwitterClient.get<T>(endpoint, {
        params,
        headers,
      });

      const data = res.data;

      // Check if API returned an error code inside JSON payload
      const apiCode = (data as any)?.code;
      if (typeof apiCode === 'number' && apiCode >= 400) {
        throw new FxTwitterApiError(
          (data as any)?.message || `FxTwitter API returned error code ${apiCode}`,
          apiCode,
          endpoint,
          apiCode,
          data
        );
      }

      // 6. Cache successful result in MMKV with TTL
      if (ttlMs > 0 && data) {
        setFxTwitterCache(cacheKey, data, ttlMs);
      }

      return data;
    } catch (err: any) {
      // Check for 429 Too Many Requests
      if (err instanceof NitroClientError && err.status === 429) {
        throw new FxTwitterRateLimitError(
          'FxTwitter rate limit reached (429 Too Many Requests). Please retry shortly.'
        );
      }

      // If request failed, check for stale cache fallback
      const { data: staleData } = getFxTwitterCacheWithFallback<T>(cacheKey);
      if (staleData) {
        console.warn(
          '[FxTwitter] Request failed, returning stale cache fallback for:',
          endpoint,
          err?.message
        );
        return staleData;
      }

      if (err instanceof NitroClientError) {
        throw new FxTwitterApiError(
          err.message,
          err.status,
          err.url,
          err.status,
          err.responseBody
        );
      }

      throw err;
    }
  });
}
