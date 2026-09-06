/**
 * Threads & Social AIO API Client
 *
 * Built on top of the centralized `socialAioClient` factory from `@/services/client`.
 * Communicates with the FB AIO / Social AIO Relay Server (`https://api.fbaio.org/call`).
 */

import { NitroClientError, socialAioClient } from '../client';
import {
  getSocialAioClientId,
  SocialAioApiError,
  SocialAioConfigError,
} from '../instagram/client';
import {
  generateThreadsCacheKey,
  getThreadsCache,
  getThreadsCacheWithFallback,
  setThreadsCache,
} from './cache';
import type { ThreadsBaseRequestOptions } from './types';

// ============================================================================
// In-Flight Request Deduplication
// ============================================================================

const inFlightRequests = new Map<string, Promise<any>>();

export function deduplicateThreadsRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
  const existingPromise = inFlightRequests.get(key);
  if (existingPromise) {
    return existingPromise;
  }

  const promise = requestFn().finally(() => {
    inFlightRequests.delete(key);
  });

  inFlightRequests.set(key, promise);
  return promise;
}

// ============================================================================
// Global Sequential Request Queue (Prevents rate limit & account flags)
// ============================================================================

let sequentialQueuePromise: Promise<any> = Promise.resolve();
const REQUEST_COOLDOWN_MS = 600; // 600ms gap between consecutive network requests

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function enqueueSequentialCall<T>(task: () => Promise<T>): Promise<T> {
  const resultPromise = sequentialQueuePromise.then(async () => {
    try {
      const res = await task();
      return res;
    } finally {
      await sleep(REQUEST_COOLDOWN_MS);
    }
  });

  // Keep the queue chain active even if a previous request failed
  sequentialQueuePromise = resultPromise.catch(() => {});

  return resultPromise;
}

// ============================================================================
// Core Relay Call Executor for Threads
// ============================================================================

/**
 * Execute a call to Social AIO (FB AIO) Relay Server for Threads APIs
 * Endpoint: POST https://api.fbaio.org/call
 */
export async function threadsSocialAioCall<T = any>(
  apiname: string,
  apiparams: Record<string, any>,
  options: ThreadsBaseRequestOptions = {}
): Promise<T> {
  const { clientId: customClientId, skipCache = false, ttlMs = 0 } = options;
  const cacheKey = generateThreadsCacheKey(apiname, apiparams);

  // 1. Check local MMKV cache first (instant response, no network/queue needed)
  if (!skipCache && ttlMs > 0) {
    const cached = getThreadsCache<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }

  // 2. In-flight request deduplication & Sequential Execution
  return deduplicateThreadsRequest<T>(cacheKey, async () => {
    // Double check cache in case a concurrent request just resolved
    if (!skipCache && ttlMs > 0) {
      const cached = getThreadsCache<T>(cacheKey);
      if (cached !== null) return cached;
    }

    return enqueueSequentialCall(async () => {
      // 3. Resolve CLIENT_ID
      const clientId = customClientId || getSocialAioClientId();
      if (!clientId) {
        // Check for stale cache fallback before throwing config error
        const { data: staleData } = getThreadsCacheWithFallback<T>(cacheKey);
        if (staleData) {
          console.warn(
            `[SocialAio:Threads] No CLIENT_ID configured, serving stale cache for: ${apiname}`
          );
          return staleData;
        }
        throw new SocialAioConfigError();
      }

      const payload = {
        id: clientId,
        apiname,
        apiparams,
      };

      try {
        // 4. Send request via centralized socialAioClient
        const res = await socialAioClient.post<{
          error?: number;
          message?: string;
          data?: T;
          [key: string]: any;
        }>('/call', payload);
        const data = res.data;

        if (!data) {
          throw new SocialAioApiError(
            `Empty response received from Social AIO relay for API: ${apiname}`,
            apiname
          );
        }

        // Check relay error indicators
        if (data.error && data.error !== 0) {
          throw new SocialAioApiError(
            data.message || `Social AIO API '${apiname}' returned error code ${data.error}`,
            apiname,
            data.error,
            data
          );
        }

        const resultData: T = (data.data !== undefined ? data.data : data) as T;

        // 5. Cache successful result in MMKV with TTL
        if (ttlMs > 0 && resultData) {
          setThreadsCache(cacheKey, resultData, ttlMs);
        }

        return resultData;
      } catch (err: any) {
        // If request failed, check for stale cache fallback
        const { data: staleData } = getThreadsCacheWithFallback<T>(cacheKey);
        if (staleData) {
          console.warn(
            `[SocialAio:Threads] Request for '${apiname}' failed, returning stale cache fallback:`,
            err?.message
          );
          return staleData;
        }

        if (err instanceof NitroClientError) {
          throw new SocialAioApiError(
            `HTTP Error ${err.status}: ${err.message}`,
            apiname,
            err.status,
            err.responseBody
          );
        }

        if (err instanceof SocialAioApiError || err instanceof SocialAioConfigError) {
          throw err;
        }

        throw new SocialAioApiError(
          err?.message || `Unknown error occurred while calling ${apiname}`,
          apiname,
          undefined,
          err
        );
      }
    });
  });
}
