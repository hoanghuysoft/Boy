/**
 * TanStack React Query Hooks for Threads / Social AIO
 *
 * Implements:
 * - Single item queries (useQuery) for Threads User Info
 * - Infinite paginated queries (useInfiniteQuery) for Threads Posts (Threads, Replies, Media, Reposts)
 */

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getThreadsPosts, getThreadsUserInfo, sanitizeThreadsTarget } from './api';
import { threadsKeys } from './queryKeys';
import type { ThreadsPostType } from './types';

// ─── Shared Cache / Stale Time Constants ────────────────────────────────────

const USER_INFO_STALE_TIME = 30 * 60 * 1000; // 30 minutes
const POSTS_STALE_TIME = 10 * 60 * 1000; // 10 minutes
const GC_TIME = 60 * 60 * 1000; // 1 hour

// ============================================================================
// 1. Threads User Info Hook
// ============================================================================

/**
 * Hook for fetching Threads user profile info
 */
export function useThreadsUserInfo(
  usernameOrUrl: string,
  options?: {
    raw?: boolean;
    clientId?: string;
    enabled?: boolean;
  }
) {
  const cleanTarget = sanitizeThreadsTarget(usernameOrUrl);
  const isEnabled = (options?.enabled ?? true) && !!cleanTarget;

  return useQuery({
    queryKey: threadsKeys.userInfo(cleanTarget, options?.raw),
    queryFn: () =>
      getThreadsUserInfo({
        url: cleanTarget,
        raw: options?.raw,
        clientId: options?.clientId,
      }),
    enabled: isEnabled,
    staleTime: USER_INFO_STALE_TIME,
    gcTime: GC_TIME,
  });
}

// ============================================================================
// 2. Threads User Posts Hook (Paginated)
// ============================================================================

/**
 * Paginated hook for fetching user Threads posts
 */
export function useThreadsPosts(
  usernameOrUrl: string,
  options?: {
    type?: ThreadsPostType;
    raw?: boolean;
    clientId?: string;
    enabled?: boolean;
  }
) {
  const cleanTarget = sanitizeThreadsTarget(usernameOrUrl);
  const isEnabled = (options?.enabled ?? true) && !!cleanTarget;
  const postType = options?.type || 'Threads';

  return useInfiniteQuery({
    queryKey: threadsKeys.posts(cleanTarget, postType, undefined, options?.raw),
    queryFn: ({ pageParam }) =>
      getThreadsPosts({
        url: cleanTarget,
        type: postType,
        cursor: pageParam as string | undefined,
        raw: options?.raw,
        clientId: options?.clientId,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: any) => {
      if (!lastPage) return undefined;
      if (lastPage.hasMore === false || lastPage.has_more === false || lastPage.has_next_page === false) {
        return undefined;
      }
      const nextCursor =
        lastPage.cursor ||
        lastPage.nextCursor ||
        lastPage.next_cursor ||
        lastPage.next_max_id ||
        lastPage.nextMaxId ||
        lastPage.paging?.cursors?.after ||
        lastPage.page_info?.end_cursor ||
        lastPage.pageInfo?.endCursor ||
        lastPage.data?.cursor ||
        lastPage.data?.next_cursor;

      return typeof nextCursor === 'string' && nextCursor.trim().length > 0
        ? nextCursor.trim()
        : undefined;
    },

    enabled: isEnabled,
    staleTime: POSTS_STALE_TIME,
    gcTime: GC_TIME,
  });
}
