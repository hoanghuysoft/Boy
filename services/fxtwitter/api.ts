/**
 * FxTwitter API v2 Core Service Methods
 * All requests are automatically routed through the rate-limiting and MMKV cache layers.
 */

import { FX_CACHE_TTL } from './cache';
import { fxGet } from './client';
import type {
  FxBaseRequestOptions,
  FxConversationParams,
  FxPaginatedResponse,
  FxProfileAboutResponse,
  FxSearchParams,
  FxSocialConversation,
  FxSocialThread,
  FxStatusListParams,
  FxStatusParams,
  FxTrendsParams,
  FxTrendsResponse,
  FxTwitterStatus,
  FxTwitterUser,
  FxTypeaheadParams,
  FxTypeaheadResponse,
  FxUserArticlesParams,
  FxUserFollowParams,
  FxUserMediaParams,
  FxUserProfileParams,
  FxUserResponse,
  FxUserStatusesParams,
} from './types';

function sanitizeHandle(handle: string): string {
  if (!handle) return '';
  const trimmed = handle.trim();
  return trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
}

// ============================================================================
// User & Profile Endpoints
// ============================================================================

/**
 * Get user profile details
 * @endpoint GET /2/profile/{handle}
 */
export async function getFxUserProfile(params: FxUserProfileParams): Promise<FxUserResponse> {
  const handle = sanitizeHandle(params.handle);
  if (!handle) {
    throw new Error('User handle is required');
  }

  return fxGet<FxUserResponse>(`/2/profile/${encodeURIComponent(handle)}`, {
    params: {
      about_account: params.about_account ? '1' : undefined,
    },
    skipCache: params.skipCache,
    ttlMs: FX_CACHE_TTL.PROFILE,
  });
}

/**
 * Get user about account metadata
 * @endpoint GET /2/profile/{handle}/about
 */
export async function getFxUserAbout(
  handle: string,
  options?: FxBaseRequestOptions
): Promise<FxProfileAboutResponse> {
  const cleanHandle = sanitizeHandle(handle);
  if (!cleanHandle) {
    throw new Error('User handle is required');
  }

  return fxGet<FxProfileAboutResponse>(`/2/profile/${encodeURIComponent(cleanHandle)}/about`, {
    skipCache: options?.skipCache,
    ttlMs: FX_CACHE_TTL.ABOUT,
  });
}

// ============================================================================
// Paginated User Timelines
// ============================================================================

/**
 * List user posts with media (Paginated)
 * @endpoint GET /2/profile/{handle}/media
 */
export async function getFxUserMedia(
  params: FxUserMediaParams
): Promise<FxPaginatedResponse<FxTwitterStatus>> {
  const handle = sanitizeHandle(params.handle);
  if (!handle) {
    throw new Error('User handle is required');
  }

  return fxGet<FxPaginatedResponse<FxTwitterStatus>>(
    `/2/profile/${encodeURIComponent(handle)}/media`,
    {
      params: {
        count: params.count,
        cursor: params.cursor,
        lang: params.lang,
      },
      skipCache: params.skipCache,
      ttlMs: FX_CACHE_TTL.MEDIA_TIMELINE,
    }
  );
}

/**
 * List user status timeline (Paginated)
 * @endpoint GET /2/profile/{handle}/statuses
 */
export async function getFxUserStatuses(
  params: FxUserStatusesParams
): Promise<FxPaginatedResponse<FxTwitterStatus>> {
  const handle = sanitizeHandle(params.handle);
  if (!handle) {
    throw new Error('User handle is required');
  }

  return fxGet<FxPaginatedResponse<FxTwitterStatus>>(
    `/2/profile/${encodeURIComponent(handle)}/statuses`,
    {
      params: {
        count: params.count,
        cursor: params.cursor,
        since: params.since,
        with_replies: params.with_replies ? '1' : undefined,
        groupthreads: params.groupthreads ? '1' : undefined,
        lang: params.lang,
      },
      skipCache: params.skipCache,
      ttlMs: FX_CACHE_TTL.STATUS_TIMELINE,
    }
  );
}

/**
 * List user published articles (Paginated)
 * @endpoint GET /2/profile/{handle}/articles
 */
export async function getFxUserArticles(
  params: FxUserArticlesParams
): Promise<FxPaginatedResponse<FxTwitterStatus>> {
  const handle = sanitizeHandle(params.handle);
  if (!handle) {
    throw new Error('User handle is required');
  }

  return fxGet<FxPaginatedResponse<FxTwitterStatus>>(
    `/2/profile/${encodeURIComponent(handle)}/articles`,
    {
      params: {
        count: params.count,
        cursor: params.cursor,
        lang: params.lang,
      },
      skipCache: params.skipCache,
      ttlMs: FX_CACHE_TTL.ARTICLES,
    }
  );
}

/**
 * List user followers (Paginated)
 * @endpoint GET /2/profile/{handle}/followers
 */
export async function getFxUserFollowers(
  params: FxUserFollowParams
): Promise<FxPaginatedResponse<FxTwitterUser>> {
  const handle = sanitizeHandle(params.handle);
  if (!handle) {
    throw new Error('User handle is required');
  }

  return fxGet<FxPaginatedResponse<FxTwitterUser>>(
    `/2/profile/${encodeURIComponent(handle)}/followers`,
    {
      params: {
        count: params.count,
        cursor: params.cursor,
      },
      skipCache: params.skipCache,
      ttlMs: FX_CACHE_TTL.RELATIONSHIPS,
    }
  );
}

/**
 * List user following (Paginated)
 * @endpoint GET /2/profile/{handle}/following
 */
export async function getFxUserFollowing(
  params: FxUserFollowParams
): Promise<FxPaginatedResponse<FxTwitterUser>> {
  const handle = sanitizeHandle(params.handle);
  if (!handle) {
    throw new Error('User handle is required');
  }

  return fxGet<FxPaginatedResponse<FxTwitterUser>>(
    `/2/profile/${encodeURIComponent(handle)}/following`,
    {
      params: {
        count: params.count,
        cursor: params.cursor,
      },
      skipCache: params.skipCache,
      ttlMs: FX_CACHE_TTL.RELATIONSHIPS,
    }
  );
}

// ============================================================================
// Single Status / Thread / Conversation Endpoints
// ============================================================================

/**
 * Get single post details
 * @endpoint GET /2/status/{id}
 */
export async function getFxStatus(params: FxStatusParams): Promise<FxSocialThread> {
  if (!params.id) {
    throw new Error('Status ID is required');
  }

  return fxGet<FxSocialThread>(`/2/status/${encodeURIComponent(params.id)}`, {
    params: {
      about_account: params.about_account ? '1' : undefined,
      lang: params.lang,
    },
    skipCache: params.skipCache,
    ttlMs: FX_CACHE_TTL.STATUS_DETAIL,
  });
}

/**
 * List status reposts (Paginated)
 * @endpoint GET /2/status/{id}/reposts
 */
export async function getFxStatusReposts(
  params: FxStatusListParams
): Promise<FxPaginatedResponse<FxTwitterUser>> {
  if (!params.id) {
    throw new Error('Status ID is required');
  }

  return fxGet<FxPaginatedResponse<FxTwitterUser>>(
    `/2/status/${encodeURIComponent(params.id)}/reposts`,
    {
      params: {
        count: params.count,
        cursor: params.cursor,
      },
      skipCache: params.skipCache,
      ttlMs: FX_CACHE_TTL.RELATIONSHIPS,
    }
  );
}

/**
 * List status quotes (Paginated)
 * @endpoint GET /2/status/{id}/quotes
 */
export async function getFxStatusQuotes(
  params: FxStatusListParams
): Promise<FxPaginatedResponse<FxTwitterStatus>> {
  if (!params.id) {
    throw new Error('Status ID is required');
  }

  return fxGet<FxPaginatedResponse<FxTwitterStatus>>(
    `/2/status/${encodeURIComponent(params.id)}/quotes`,
    {
      params: {
        count: params.count,
        cursor: params.cursor,
        lang: params.lang,
      },
      skipCache: params.skipCache,
      ttlMs: FX_CACHE_TTL.STATUS_TIMELINE,
    }
  );
}

/**
 * Get status thread
 * @endpoint GET /2/thread/{id}
 */
export async function getFxThread(params: FxStatusParams): Promise<FxSocialThread> {
  if (!params.id) {
    throw new Error('Thread status ID is required');
  }

  return fxGet<FxSocialThread>(`/2/thread/${encodeURIComponent(params.id)}`, {
    params: {
      about_account: params.about_account ? '1' : undefined,
      lang: params.lang,
    },
    skipCache: params.skipCache,
    ttlMs: FX_CACHE_TTL.STATUS_DETAIL,
  });
}

/**
 * Get full conversation with replies (Paginated)
 * @endpoint GET /2/conversation/{id}
 */
export async function getFxConversation(
  params: FxConversationParams
): Promise<FxSocialConversation> {
  if (!params.id) {
    throw new Error('Conversation root status ID is required');
  }

  return fxGet<FxSocialConversation>(`/2/conversation/${encodeURIComponent(params.id)}`, {
    params: {
      ranking_mode: params.ranking_mode,
      cursor: params.cursor,
      about_account: params.about_account ? '1' : undefined,
      lang: params.lang,
    },
    skipCache: params.skipCache,
    ttlMs: FX_CACHE_TTL.CONVERSATION,
  });
}

// ============================================================================
// Search, Trends & Typeahead
// ============================================================================

/**
 * Search posts / users (Paginated)
 * @endpoint GET /2/search
 */
export async function getFxSearch(
  params: FxSearchParams
): Promise<FxPaginatedResponse<FxTwitterStatus>> {
  if (!params.q || !params.q.trim()) {
    return { code: 200, results: [], cursor: { top: null, bottom: null } };
  }

  return fxGet<FxPaginatedResponse<FxTwitterStatus>>('/2/search', {
    params: {
      q: params.q.trim(),
      feed: params.feed,
      count: params.count,
      cursor: params.cursor,
      lang: params.lang,
    },
    skipCache: params.skipCache,
    ttlMs: FX_CACHE_TTL.SEARCH,
  });
}

/**
 * Search typeahead autocomplete
 * @endpoint GET /2/typeahead
 */
export async function getFxTypeahead(params: FxTypeaheadParams): Promise<FxTypeaheadResponse> {
  if (!params.q || !params.q.trim()) {
    return { code: 200, query: '', num_results: 0, users: [], topics: [], events: [] };
  }

  return fxGet<FxTypeaheadResponse>('/2/typeahead', {
    params: {
      q: params.q.trim(),
      result_type: params.result_type,
      src: params.src,
    },
    skipCache: params.skipCache,
    ttlMs: FX_CACHE_TTL.TYPEAHEAD,
  });
}

/**
 * Get trending topics
 * @endpoint GET /2/trends
 */
export async function getFxTrends(params?: FxTrendsParams): Promise<FxTrendsResponse> {
  return fxGet<FxTrendsResponse>('/2/trends', {
    params: {
      type: params?.type,
      count: params?.count,
    },
    skipCache: params?.skipCache,
    ttlMs: FX_CACHE_TTL.TRENDS,
  });
}
