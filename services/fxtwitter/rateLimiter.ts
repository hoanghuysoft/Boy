/**
 * FxTwitter API Rate Limiter & Daily Quota Guard
 *
 * Requirements:
 * - Free tier limit: Up to 100,000 requests per day.
 * - API v2 rate limit: 1000 requests per minute (~16.7 req/sec).
 *
 * Features:
 * 1. Persistent Daily Quota Management (MMKV) - prevents exceeding 100k daily requests.
 * 2. Sliding Window Burst Limiter - throttles bursts to prevent 429 Too Many Requests.
 * 3. In-flight Request Deduplication - collapses identical concurrent requests into 1 network call.
 */

import { storage } from '../storage';

// ─── Constants & Configuration ───────────────────────────────────────────────

/** Default daily safety limit (buffer below 100,000 to prevent hard API lockouts) */
const DEFAULT_DAILY_LIMIT = 95_000;

/** Burst limiter: Max allowed requests per 1-second window */
const MAX_REQUESTS_PER_SECOND = 15;

/** Burst limiter: Max allowed requests per 60-second window */
const MAX_REQUESTS_PER_MINUTE = 800;

const STORAGE_PREFIX = 'fxtwitter:daily_reqs:';
const LIMIT_KEY = 'fxtwitter:daily_limit_cap';

// ─── Error Classes ──────────────────────────────────────────────────────────

export class FxTwitterQuotaExceededError extends Error {
  date: string;
  count: number;
  limit: number;

  constructor(date: string, count: number, limit: number) {
    super(
      `FxTwitter API daily quota exceeded (${count}/${limit} requests used on ${date}). Request blocked to prevent over-limit charges.`
    );
    this.name = 'FxTwitterQuotaExceededError';
    this.date = date;
    this.count = count;
    this.limit = limit;
  }
}

export class FxTwitterRateLimitError extends Error {
  retryAfterMs: number;

  constructor(message: string, retryAfterMs: number = 1000) {
    super(message);
    this.name = 'FxTwitterRateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

// ─── Daily Quota Management ──────────────────────────────────────────────────

function getTodayUtcString(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

/**
 * Get configured daily request limit
 */
export function getFxTwitterDailyLimit(): number {
  const customLimit = storage.getNumber(LIMIT_KEY);
  return customLimit && customLimit > 0 ? customLimit : DEFAULT_DAILY_LIMIT;
}

/**
 * Set custom daily request limit
 */
export function setFxTwitterDailyLimit(limit: number): void {
  if (limit > 0) {
    storage.set(LIMIT_KEY, limit);
  }
}

/**
 * Get current day's request usage statistics
 */
export function getFxTwitterDailyUsage(): {
  date: string;
  count: number;
  limit: number;
  remaining: number;
  isQuotaExceeded: boolean;
} {
  const today = getTodayUtcString();
  const count = storage.getNumber(`${STORAGE_PREFIX}${today}`) || 0;
  const limit = getFxTwitterDailyLimit();
  const remaining = Math.max(0, limit - count);

  return {
    date: today,
    count,
    limit,
    remaining,
    isQuotaExceeded: count >= limit,
  };
}

/**
 * Check if the daily quota is available and increment usage counter.
 * Throws FxTwitterQuotaExceededError if limit is reached.
 */
export function checkAndIncrementDailyQuota(): number {
  const today = getTodayUtcString();
  const key = `${STORAGE_PREFIX}${today}`;
  const currentCount = storage.getNumber(key) || 0;
  const limit = getFxTwitterDailyLimit();

  if (currentCount >= limit) {
    throw new FxTwitterQuotaExceededError(today, currentCount, limit);
  }

  const nextCount = currentCount + 1;
  storage.set(key, nextCount);
  return nextCount;
}

/**
 * Reset daily request count (useful for testing or manual reset)
 */
export function resetFxTwitterDailyUsage(date: string = getTodayUtcString()): void {
  storage.remove(`${STORAGE_PREFIX}${date}`);
}

// ─── In-Memory Burst Rate Limiter (Sliding Window) ──────────────────────────

const requestTimestamps: number[] = [];

/**
 * Ensure requests stay safely below 1,000 req/min and 15 req/sec
 * Waits if burst rate is approaching limit.
 */
export async function acquireBurstSlot(): Promise<void> {
  const now = Date.now();

  // 1. Clean up timestamps older than 60 seconds
  const oneMinuteAgo = now - 60_000;
  while (requestTimestamps.length > 0 && requestTimestamps[0] < oneMinuteAgo) {
    requestTimestamps.shift();
  }

  // 2. Check 1-second window
  const oneSecondAgo = now - 1_000;
  const lastSecondCount = requestTimestamps.filter((t) => t >= oneSecondAgo).length;

  if (lastSecondCount >= MAX_REQUESTS_PER_SECOND) {
    const oldestInLastSecond = requestTimestamps.find((t) => t >= oneSecondAgo) || now;
    const waitMs = Math.max(50, 1000 - (now - oldestInLastSecond) + 10);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    return acquireBurstSlot();
  }

  // 3. Check 60-second window
  if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    const oldest = requestTimestamps[0];
    const waitMs = Math.max(100, 60_000 - (now - oldest) + 50);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    return acquireBurstSlot();
  }

  // Record this request
  requestTimestamps.push(Date.now());
}

// ─── In-Flight Request Deduplication ────────────────────────────────────────

const inFlightRequests = new Map<string, Promise<any>>();

/**
 * Deduplicate simultaneous in-flight requests for the exact same URL + params
 */
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
