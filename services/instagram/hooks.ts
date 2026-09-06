/**
 * TanStack React Query Hooks for Instagram / Social AIO
 *
 * Implements:
 * - Single item queries (useQuery) for User Info and Stories
 * - Infinite paginated queries (useInfiniteQuery) for Posts and Reels
 * - Config hook for managing Social AIO CLIENT_ID
 */

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getInstagramPosts,
  getInstagramUserInfo,
  getInstagramUserReels,
  getInstagramUserStories,
  sanitizeInstagramTarget,
} from './api';
import { getSocialAioClientId, setSocialAioClientId } from './client';
import { instagramKeys } from './queryKeys';

// ─── Shared Cache / Stale Time Constants ────────────────────────────────────

const USER_INFO_STALE_TIME = 30 * 60 * 1000; // 30 minutes
const STORIES_STALE_TIME = 5 * 60 * 1000; // 5 minutes
const POSTS_STALE_TIME = 10 * 60 * 1000; // 10 minutes
const GC_TIME = 60 * 60 * 1000; // 1 hour

// ============================================================================
// 1. Instagram User Info Hook
// ============================================================================

/**
 * Hook for fetching Instagram user profile info
 */
export function useInstagramUserInfo(
  usernameOrUrl: string,
  options?: {
    raw?: boolean;
    clientId?: string;
    enabled?: boolean;
  }
) {
  const cleanTarget = sanitizeInstagramTarget(usernameOrUrl);
  const isEnabled = (options?.enabled ?? true) && !!cleanTarget;

  return useQuery({
    queryKey: instagramKeys.userInfo(cleanTarget, options?.raw),
    queryFn: () =>
      getInstagramUserInfo({
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
// 2. Instagram User Stories Hook
// ============================================================================

/**
 * Hook for fetching Instagram user stories
 */
export function useInstagramUserStories(
  usernameOrUrl: string,
  options?: {
    raw?: boolean;
    clientId?: string;
    enabled?: boolean;
  }
) {
  const cleanTarget = sanitizeInstagramTarget(usernameOrUrl);
  const isEnabled = (options?.enabled ?? true) && !!cleanTarget;

  return useQuery({
    queryKey: instagramKeys.stories(cleanTarget, options?.raw),
    queryFn: () =>
      getInstagramUserStories({
        url: cleanTarget,
        raw: options?.raw,
        clientId: options?.clientId,
      }),
    enabled: isEnabled,
    staleTime: STORIES_STALE_TIME,
    gcTime: GC_TIME,
  });
}

// ============================================================================
// 3. Instagram User Posts Hook (Paginated)
// ============================================================================

/**
 * Paginated hook for fetching Instagram user posts
 */
export function useInstagramPosts(
  usernameOrUrl: string,
  options?: {
    clientId?: string;
    enabled?: boolean;
  }
) {
  const cleanTarget = sanitizeInstagramTarget(usernameOrUrl);
  const isEnabled = (options?.enabled ?? true) && !!cleanTarget;

  return useInfiniteQuery({
    queryKey: instagramKeys.posts(cleanTarget),
    queryFn: ({ pageParam }) =>
      getInstagramPosts({
        url: cleanTarget,
        cursor: pageParam as string | undefined,
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

// ============================================================================
// 4. Instagram User Reels Hook (Paginated)
// ============================================================================

/**
 * Paginated hook for fetching Instagram user reels
 */
export function useInstagramUserReels(
  usernameOrUrl: string,
  options?: {
    raw?: boolean;
    clientId?: string;
    enabled?: boolean;
  }
) {
  const cleanTarget = sanitizeInstagramTarget(usernameOrUrl);
  const isEnabled = (options?.enabled ?? true) && !!cleanTarget;

  return useInfiniteQuery({
    queryKey: instagramKeys.reels(cleanTarget, undefined, options?.raw),
    queryFn: ({ pageParam }) =>
      getInstagramUserReels({
        url: cleanTarget,
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

// ============================================================================
// 5. Social AIO Client ID Hook
// ============================================================================

/**
 * Hook to read and update Social AIO CLIENT_ID
 */
export function useSocialAioConfig() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: instagramKeys.config(),
    queryFn: () => ({
      clientId: getSocialAioClientId(),
      isConfigured: !!getSocialAioClientId(),
    }),
    staleTime: Infinity,
  });

  const mutation = useMutation({
    mutationFn: async (newClientId: string) => {
      setSocialAioClientId(newClientId);
      return newClientId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: instagramKeys.all });
    },
  });

  return {
    clientId: query.data?.clientId,
    isConfigured: query.data?.isConfigured ?? false,
    isLoading: query.isLoading,
    setClientId: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}
