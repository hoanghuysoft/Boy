/**
 * Instagram API Core Service Methods
 * Powered by Social AIO (FB AIO Relay API)
 *
 * All requests are automatically routed through the MMKV cache layer,
 * request deduplication, and CLIENT_ID resolver.
 */

import { INSTAGRAM_CACHE_TTL } from './cache';
import { socialAioCall } from './client';
import type {
  InstagramPostListResponse,
  InstagramPostParams,
  InstagramReelParams,
  InstagramReelsResponse,
  InstagramStoryParams,
  InstagramStoryResponse,
  InstagramUserInfoParams,
  InstagramUserInfoResponse,
} from './types';

/**
 * Sanitize Instagram target (strips `@`, cleans trailing slashes or URL query parameters)
 */
export function sanitizeInstagramTarget(target: string): string {
  if (!target) return '';
  const trimmed = target.trim();

  // If starts with @, remove it
  if (trimmed.startsWith('@')) {
    return trimmed.slice(1);
  }

  // If it's a full Instagram URL e.g. https://www.instagram.com/username/
  try {
    if (trimmed.includes('instagram.com/')) {
      const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
      const segments = parsed.pathname.split('/').filter(Boolean);
      if (segments.length > 0) {
        // If not a system route like 'p', 'reel', 'stories'
        const first = segments[0];
        if (!['p', 'reel', 'reels', 'stories', 'explore', 'direct'].includes(first.toLowerCase())) {
          return first;
        }
      }
    }
  } catch {
    // If URL parsing fails, fallback to cleaned target
  }

  return trimmed;
}

// ============================================================================
// 1. Instagram User Info API
// ============================================================================

/**
 * Get Instagram user profile information
 * @apiname get_ig_user_info
 */
export async function getInstagramUserInfo(
  params: InstagramUserInfoParams
): Promise<InstagramUserInfoResponse> {
  const url = sanitizeInstagramTarget(params.url);
  if (!url) {
    throw new Error('Instagram username or URL is required');
  }

  return socialAioCall<InstagramUserInfoResponse>(
    'get_ig_user_info',
    {
      url,
      raw: params.raw,
    },
    {
      clientId: params.clientId,
      skipCache: params.skipCache,
      ttlMs: params.ttlMs ?? INSTAGRAM_CACHE_TTL.USER_INFO,
    }
  );
}

// ============================================================================
// 2. Instagram User Stories API
// ============================================================================

/**
 * Get Instagram user stories
 * @apiname get_list_ig_user_stories
 */
export async function getInstagramUserStories(
  params: InstagramStoryParams
): Promise<InstagramStoryResponse> {
  const url = sanitizeInstagramTarget(params.url);
  if (!url) {
    throw new Error('Instagram username or URL is required');
  }

  return socialAioCall<InstagramStoryResponse>(
    'get_list_ig_user_stories',
    {
      url,
      raw: params.raw,
    },
    {
      clientId: params.clientId,
      skipCache: params.skipCache,
      ttlMs: params.ttlMs ?? INSTAGRAM_CACHE_TTL.STORIES,
    }
  );
}

// ============================================================================
// 3. Instagram User Posts API (Paginated)
// ============================================================================

/**
 * Get Instagram user posts list (supports cursor pagination)
 * @apiname get_list_ig_post
 */
export async function getInstagramPosts(
  params: InstagramPostParams
): Promise<InstagramPostListResponse> {
  const url = sanitizeInstagramTarget(params.url);
  if (!url) {
    throw new Error('Instagram username or URL is required');
  }

  return socialAioCall<InstagramPostListResponse>(
    'get_list_ig_post',
    {
      url,
      cursor: params.cursor,
    },
    {
      clientId: params.clientId,
      skipCache: params.skipCache,
      ttlMs: params.ttlMs ?? INSTAGRAM_CACHE_TTL.POSTS,
    }
  );
}

// ============================================================================
// 4. Instagram User Reels API (Paginated)
// ============================================================================

/**
 * Get Instagram user reels list (supports cursor pagination)
 * @apiname get_list_ig_user_reels
 */
export async function getInstagramUserReels(
  params: InstagramReelParams
): Promise<InstagramReelsResponse> {
  const url = sanitizeInstagramTarget(params.url);
  if (!url) {
    throw new Error('Instagram username or URL is required');
  }

  return socialAioCall<InstagramReelsResponse>(
    'get_list_ig_user_reels',
    {
      url,
      cursor: params.cursor,
      raw: params.raw,
    },
    {
      clientId: params.clientId,
      skipCache: params.skipCache,
      ttlMs: params.ttlMs ?? INSTAGRAM_CACHE_TTL.REELS,
    }
  );
}
