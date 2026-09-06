/**
 * Threads API Core Service Methods
 * Powered by Social AIO (FB AIO Relay API)
 *
 * All requests are automatically routed through the MMKV cache layer,
 * request deduplication, sequential queue cooldown, and CLIENT_ID resolver.
 */

import { THREADS_CACHE_TTL } from './cache';
import { threadsSocialAioCall } from './client';
import type {
  ThreadsPostsListResponse,
  ThreadsPostsParams,
  ThreadsUserInfoParams,
  ThreadsUserInfoResponse,
} from './types';

/**
 * Sanitize Threads target (strips `@`, cleans trailing slashes or URL query parameters)
 */
export function sanitizeThreadsTarget(target: string): string {
  if (!target) return '';
  const trimmed = target.trim();

  // If starts with @, remove it
  if (trimmed.startsWith('@')) {
    return trimmed.slice(1);
  }

  // If it's a full Threads URL e.g. https://www.threads.net/@username
  try {
    if (trimmed.includes('threads.net/')) {
      const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
      const segments = parsed.pathname.split('/').filter(Boolean);
      if (segments.length > 0) {
        let segment = segments[0];
        if (segment.startsWith('@')) {
          segment = segment.slice(1);
        }
        if (!['post', 't'].includes(segment.toLowerCase())) {
          return segment;
        }
      }
    }
  } catch {
    // If URL parsing fails, fallback to cleaned target
  }

  return trimmed;
}

// ============================================================================
// 1. Threads User Info API
// ============================================================================

/**
 * Get Threads user profile information
 * @apiname get_threads_user_info
 */
export async function getThreadsUserInfo(
  params: ThreadsUserInfoParams
): Promise<ThreadsUserInfoResponse> {
  const url = sanitizeThreadsTarget(params.url);
  if (!url) {
    throw new Error('Threads username or URL is required');
  }

  return threadsSocialAioCall<ThreadsUserInfoResponse>(
    'get_threads_user_info',
    {
      url,
      raw: params.raw,
    },
    {
      clientId: params.clientId,
      skipCache: params.skipCache,
      ttlMs: params.ttlMs ?? THREADS_CACHE_TTL.USER_INFO,
    }
  );
}

// ============================================================================
// 2. Threads User Posts API (Paginated)
// ============================================================================

/**
 * Get list of Threads posts of a user (supports pagination & types: Threads, Replies, Media, Reposts)
 * @apiname get_list_threads_posts
 */
export async function getThreadsPosts(
  params: ThreadsPostsParams
): Promise<ThreadsPostsListResponse> {
  const url = sanitizeThreadsTarget(params.url);
  if (!url) {
    throw new Error('Threads username or URL is required');
  }

  return threadsSocialAioCall<ThreadsPostsListResponse>(
    'get_list_threads_posts',
    {
      url,
      type: params.type || 'Threads',
      cursor: params.cursor,
      raw: params.raw,
    },
    {
      clientId: params.clientId,
      skipCache: params.skipCache,
      ttlMs: params.ttlMs ?? THREADS_CACHE_TTL.POSTS,
    }
  );
}
