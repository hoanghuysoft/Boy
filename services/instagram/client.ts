/**
 * Instagram & Social AIO API Client
 *
 * Built on top of the centralized `socialAioClient` factory from `@/services/client`.
 * Communicates with the FB AIO / Social AIO Relay Server (`https://api.fbaio.org/call`).
 *
 * Features:
 * - Dynamic CLIENT_ID resolution (options -> MMKV storage -> environment variable)
 * - Persistent MMKV cache with type-specific TTL
 * - In-flight concurrent request deduplication
 * - Stale-while-error fallback
 * - Comprehensive error handling and parsing
 */

import { useSettingsStore } from '../../stores/settings';
import { NitroClientError, socialAioClient } from '../client';
import { storage } from '../storage';
import {
  generateInstagramCacheKey,
  getInstagramCache,
  getInstagramCacheWithFallback,
  setInstagramCache,
} from './cache';
import type { InstagramBaseRequestOptions, SocialAioCallPayload, SocialAioRelayResponse } from './types';

const CLIENT_ID_STORAGE_KEY = 'social_aio:client_id';

// ============================================================================
// Client ID Management
// ============================================================================

/**
 * Get current configured Social AIO / FB AIO CLIENT_ID
 * Priority: Zustand Settings Store > MMKV storage > EXPO_PUBLIC_SOCIAL_AIO_CLIENT_ID > EXPO_PUBLIC_FBAIO_CLIENT_ID
 */
export function getSocialAioClientId(): string | undefined {
  const fromSettings = useSettingsStore.getState().socialAioClientId;
  if (fromSettings && fromSettings.trim()) {
    return fromSettings.trim();
  }

  const fromStorage = storage.getString(CLIENT_ID_STORAGE_KEY);
  if (fromStorage && fromStorage.trim()) {
    return fromStorage.trim();
  }

  const fromEnv =
    process.env.EXPO_PUBLIC_SOCIAL_AIO_CLIENT_ID ||
    process.env.EXPO_PUBLIC_FBAIO_CLIENT_ID;

  return fromEnv ? fromEnv.trim() : undefined;
}

/**
 * Set and persist Social AIO / FB AIO CLIENT_ID in MMKV storage & Zustand store
 */
export function setSocialAioClientId(clientId: string): void {
  const cleanId = (clientId || '').trim();
  useSettingsStore.getState().setSocialAioClientId(cleanId);
  if (!cleanId) {
    storage.remove(CLIENT_ID_STORAGE_KEY);
  } else {
    storage.set(CLIENT_ID_STORAGE_KEY, cleanId);
  }
}

/**
 * Clear stored Social AIO CLIENT_ID
 */
export function clearSocialAioClientId(): void {
  useSettingsStore.getState().setSocialAioClientId('');
  storage.remove(CLIENT_ID_STORAGE_KEY);
}

// ============================================================================
// Error Classes
// ============================================================================

export class SocialAioConfigError extends Error {
  constructor(message?: string) {
    super(
      message ||
        'Chưa cấu hình Social AIO CLIENT_ID. Vui lòng mở tiện ích Social AIO (FB AIO) trên trình duyệt, vào tab APIs, bấm "Kết nối" để lấy CLIENT_ID và cấu hình vào ứng dụng.'
    );
    this.name = 'SocialAioConfigError';
  }
}

export class SocialAioApiError extends Error {
  apiname: string;
  errorCode?: number;
  responseBody?: any;

  constructor(message: string, apiname: string, errorCode?: number, responseBody?: any) {
    super(message);
    this.name = 'SocialAioApiError';
    this.apiname = apiname;
    this.errorCode = errorCode;
    this.responseBody = responseBody;
  }
}

// ============================================================================
// In-Flight Request Deduplication
// ============================================================================

const inFlightRequests = new Map<string, Promise<any>>();

export function deduplicateRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
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
// Global Sequential Request Queue (Prevents Meta rate limit & account flags)
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
// Core Relay Call Executor
// ============================================================================

/**
 * Execute a call to Social AIO (FB AIO) Relay Server
 * Endpoint: POST https://api.fbaio.org/call
 */
export async function socialAioCall<T = any>(
  apiname: string,
  apiparams: Record<string, any>,
  options: InstagramBaseRequestOptions = {}
): Promise<T> {
  const { clientId: customClientId, skipCache = false, ttlMs = 0 } = options;
  const cacheKey = generateInstagramCacheKey(apiname, apiparams);

  // 1. Check local MMKV cache first (instant response, no network/queue needed)
  if (!skipCache && ttlMs > 0) {
    const cached = getInstagramCache<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }

  // 2. In-flight request deduplication & Sequential Execution
  return deduplicateRequest<T>(cacheKey, async () => {
    // Double check cache in case a concurrent request just resolved
    if (!skipCache && ttlMs > 0) {
      const cached = getInstagramCache<T>(cacheKey);
      if (cached !== null) return cached;
    }

    return enqueueSequentialCall(async () => {

    // 3. Resolve CLIENT_ID
    const clientId = customClientId || getSocialAioClientId();
    if (!clientId) {
      // Check for stale cache fallback before throwing config error
      const { data: staleData } = getInstagramCacheWithFallback<T>(cacheKey);
      if (staleData) {
        console.warn(
          `[SocialAio] No CLIENT_ID configured, serving stale cache for: ${apiname}`
        );
        return staleData;
      }
      throw new SocialAioConfigError();
    }

    const payload: SocialAioCallPayload = {
      id: clientId,
      apiname,
      apiparams,
    };

    try {
      // 4. Send request via centralized socialAioClient
      const res = await socialAioClient.post<SocialAioRelayResponse<T>>('/call', payload);
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

      // Unpack response: some endpoints return { info: ... }, { stories: ... }, { posts: ... } directly,
      // while others may wrap under `data.data`.
      const resultData: T = (data.data !== undefined ? data.data : data) as T;

      // 5. Cache successful result in MMKV with TTL
      if (ttlMs > 0 && resultData) {
        setInstagramCache(cacheKey, resultData, ttlMs);
      }

      return resultData;
    } catch (err: any) {
      // If request failed, check for stale cache fallback
      const { data: staleData } = getInstagramCacheWithFallback<T>(cacheKey);
      if (staleData) {
        console.warn(
          `[SocialAio] Request for '${apiname}' failed, returning stale cache fallback:`,
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
