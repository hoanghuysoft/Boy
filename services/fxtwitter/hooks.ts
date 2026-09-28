/**
 * TanStack React Query Hooks for FxTwitter
 *
 * Implements:
 * - Paginated Infinite Queries (useInfiniteQuery) with cursor bottom pagination
 * - Single item Queries (useQuery) with tuned cache & stale times
 * - Quota usage monitor hook
 */

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  getFxConversation,
  getFxSearch,
  getFxStatus,
  getFxStatusQuotes,
  getFxStatusReposts,
  getFxThread,
  getFxTrends,
  getFxTypeahead,
  getFxUserAbout,
  getFxUserArticles,
  getFxUserFollowers,
  getFxUserFollowing,
  getFxUserMedia,
  getFxUserProfile,
  getFxUserStatuses,
} from './api';
import { fxTwitterKeys } from './queryKeys';
import { getFxTwitterDailyUsage } from './rateLimiter';

// ─── Shared Query Options ───────────────────────────────────────────────────

const TIMELINE_STALE_TIME = 10 * 60 * 1000; // 10 minutes
const PROFILE_STALE_TIME = 30 * 60 * 1000; // 30 minutes
const GC_TIME = 60 * 60 * 1000; // 1 hour

// ============================================================================
// Infinite / Paginated Queries
// ============================================================================

/**
 * Paginated hook for fetching user posts with media
 */
export function useFxUserMedia(
  handle: string,
  options?: {
    count?: number;
    lang?: string;
    enabled?: boolean;
  }
) {
  const isEnabled = (options?.enabled ?? true) && !!handle.trim();

  return useInfiniteQuery({
    queryKey: fxTwitterKeys.userMedia(handle, options?.count, options?.lang),
    queryFn: ({ pageParam }) =>
      getFxUserMedia({
        handle,
        count: options?.count,
        lang: options?.lang,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      const bottom = lastPage.cursor?.bottom;
      if (!bottom || bottom === '-1' || bottom === '0' || (lastPage.results && lastPage.results.length === 0)) {
        return undefined;
      }
      return bottom;
    },
    enabled: isEnabled,
    staleTime: TIMELINE_STALE_TIME,
    gcTime: GC_TIME,
  });
}

/**
 * Paginated hook for fetching user statuses / tweets timeline
 */
export function useFxUserStatuses(
  handle: string,
  options?: {
    count?: number;
    since?: string;
    with_replies?: boolean;
    groupthreads?: boolean;
    lang?: string;
    enabled?: boolean;
  }
) {
  const isEnabled = (options?.enabled ?? true) && !!handle.trim();

  return useInfiniteQuery({
    queryKey: fxTwitterKeys.userStatuses(handle, {
      count: options?.count,
      since: options?.since,
      with_replies: options?.with_replies,
      groupthreads: options?.groupthreads,
      lang: options?.lang,
    }),
    queryFn: ({ pageParam }) =>
      getFxUserStatuses({
        handle,
        count: options?.count,
        since: options?.since,
        with_replies: options?.with_replies,
        groupthreads: options?.groupthreads,
        lang: options?.lang,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      const bottom = lastPage.cursor?.bottom;
      if (!bottom || bottom === '-1' || bottom === '0' || (lastPage.results && lastPage.results.length === 0)) {
        return undefined;
      }
      return bottom;
    },
    enabled: isEnabled,
    staleTime: TIMELINE_STALE_TIME,
    gcTime: GC_TIME,
  });
}

/**
 * Paginated hook for fetching user articles
 */
export function useFxUserArticles(
  handle: string,
  options?: {
    count?: number;
    lang?: string;
    enabled?: boolean;
  }
) {
  const isEnabled = (options?.enabled ?? true) && !!handle.trim();

  return useInfiniteQuery({
    queryKey: fxTwitterKeys.userArticles(handle, options?.count, options?.lang),
    queryFn: ({ pageParam }) =>
      getFxUserArticles({
        handle,
        count: options?.count,
        lang: options?.lang,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor?.bottom || undefined,
    enabled: isEnabled,
    staleTime: TIMELINE_STALE_TIME,
    gcTime: GC_TIME,
  });
}

/**
 * Paginated hook for fetching user followers
 */
export function useFxUserFollowers(
  handle: string,
  options?: {
    count?: number;
    enabled?: boolean;
  }
) {
  const isEnabled = (options?.enabled ?? true) && !!handle.trim();

  return useInfiniteQuery({
    queryKey: fxTwitterKeys.userFollowers(handle, options?.count),
    queryFn: ({ pageParam }) =>
      getFxUserFollowers({
        handle,
        count: options?.count,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      const bottom = lastPage.cursor?.bottom;
      if (!bottom || bottom === '-1' || bottom === '0' || (lastPage.results && lastPage.results.length === 0)) {
        return undefined;
      }
      return bottom;
    },
    enabled: isEnabled,
    staleTime: PROFILE_STALE_TIME,
    gcTime: GC_TIME,
  });
}

/**
 * Paginated hook for fetching user following
 */
export function useFxUserFollowing(
  handle: string,
  options?: {
    count?: number;
    enabled?: boolean;
  }
) {
  const isEnabled = (options?.enabled ?? true) && !!handle.trim();

  return useInfiniteQuery({
    queryKey: fxTwitterKeys.userFollowing(handle, options?.count),
    queryFn: ({ pageParam }) =>
      getFxUserFollowing({
        handle,
        count: options?.count,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      const bottom = lastPage.cursor?.bottom;
      if (!bottom || bottom === '-1' || bottom === '0' || (lastPage.results && lastPage.results.length === 0)) {
        return undefined;
      }
      return bottom;
    },
    enabled: isEnabled,
    staleTime: PROFILE_STALE_TIME,
    gcTime: GC_TIME,
  });
}

/**
 * Paginated hook for status reposts
 */
export function useFxStatusReposts(
  id: string,
  options?: {
    count?: number;
    enabled?: boolean;
  }
) {
  const isEnabled = (options?.enabled ?? true) && !!id;

  return useInfiniteQuery({
    queryKey: fxTwitterKeys.statusReposts(id, options?.count),
    queryFn: ({ pageParam }) =>
      getFxStatusReposts({
        id,
        count: options?.count,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor?.bottom || undefined,
    enabled: isEnabled,
    staleTime: PROFILE_STALE_TIME,
    gcTime: GC_TIME,
  });
}

/**
 * Paginated hook for status quotes
 */
export function useFxStatusQuotes(
  id: string,
  options?: {
    count?: number;
    lang?: string;
    enabled?: boolean;
  }
) {
  const isEnabled = (options?.enabled ?? true) && !!id;

  return useInfiniteQuery({
    queryKey: fxTwitterKeys.statusQuotes(id, options?.count, options?.lang),
    queryFn: ({ pageParam }) =>
      getFxStatusQuotes({
        id,
        count: options?.count,
        lang: options?.lang,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor?.bottom || undefined,
    enabled: isEnabled,
    staleTime: TIMELINE_STALE_TIME,
    gcTime: GC_TIME,
  });
}

/**
 * Paginated hook for conversation / replies
 */
export function useFxConversation(
  id: string,
  options?: {
    ranking_mode?: 'relevance' | 'recency';
    about_account?: boolean;
    lang?: string;
    enabled?: boolean;
  }
) {
  const isEnabled = (options?.enabled ?? true) && !!id;

  return useInfiniteQuery({
    queryKey: fxTwitterKeys.conversation(id, {
      ranking_mode: options?.ranking_mode,
      about_account: options?.about_account,
      lang: options?.lang,
    }),
    queryFn: ({ pageParam }) =>
      getFxConversation({
        id,
        ranking_mode: options?.ranking_mode,
        about_account: options?.about_account,
        lang: options?.lang,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor?.bottom || undefined,
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000,
    gcTime: GC_TIME,
  });
}

/**
 * Paginated search hook
 */
export function useFxSearch(
  query: string,
  options?: {
    feed?: 'top' | 'latest' | 'photos' | 'videos' | 'users';
    count?: number;
    lang?: string;
    enabled?: boolean;
  }
) {
  const trimmed = query.trim();
  const isEnabled = (options?.enabled ?? true) && trimmed.length > 0;

  return useInfiniteQuery({
    queryKey: fxTwitterKeys.search(trimmed, {
      feed: options?.feed,
      count: options?.count,
      lang: options?.lang,
    }),
    queryFn: ({ pageParam }) =>
      getFxSearch({
        q: trimmed,
        feed: options?.feed,
        count: options?.count,
        lang: options?.lang,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor?.bottom || undefined,
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000,
    gcTime: GC_TIME,
  });
}

// ============================================================================
// Single Item Queries (useQuery)
// ============================================================================

/**
 * Hook for fetching user profile
 */
export function useFxUserProfile(
  handle: string,
  options?: {
    about_account?: boolean;
    enabled?: boolean;
  }
) {
  const isEnabled = (options?.enabled ?? true) && !!handle.trim();

  return useQuery({
    queryKey: fxTwitterKeys.userProfile(handle, options?.about_account),
    queryFn: () =>
      getFxUserProfile({
        handle,
        about_account: options?.about_account,
      }),
    enabled: isEnabled,
    staleTime: PROFILE_STALE_TIME,
    gcTime: GC_TIME,
  });
}

/**
 * Hook for fetching user about info
 */
export function useFxUserAbout(
  handle: string,
  options?: {
    enabled?: boolean;
  }
) {
  const isEnabled = (options?.enabled ?? true) && !!handle.trim();

  return useQuery({
    queryKey: fxTwitterKeys.userAbout(handle),
    queryFn: () => getFxUserAbout(handle),
    enabled: isEnabled,
    staleTime: PROFILE_STALE_TIME,
    gcTime: GC_TIME,
  });
}

/**
 * Hook for fetching a single status / post
 */
export function useFxStatus(
  id: string,
  options?: {
    about_account?: boolean;
    lang?: string;
    enabled?: boolean;
  }
) {
  const isEnabled = (options?.enabled ?? true) && !!id;

  return useQuery({
    queryKey: fxTwitterKeys.statusDetail(id, {
      about_account: options?.about_account,
      lang: options?.lang,
    }),
    queryFn: () =>
      getFxStatus({
        id,
        about_account: options?.about_account,
        lang: options?.lang,
      }),
    enabled: isEnabled,
    staleTime: 30 * 60 * 1000,
    gcTime: GC_TIME,
  });
}

/**
 * Hook for fetching a thread
 */
export function useFxThread(
  id: string,
  options?: {
    about_account?: boolean;
    lang?: string;
    enabled?: boolean;
  }
) {
  const isEnabled = (options?.enabled ?? true) && !!id;

  return useQuery({
    queryKey: fxTwitterKeys.thread(id, {
      about_account: options?.about_account,
      lang: options?.lang,
    }),
    queryFn: () =>
      getFxThread({
        id,
        about_account: options?.about_account,
        lang: options?.lang,
      }),
    enabled: isEnabled,
    staleTime: 30 * 60 * 1000,
    gcTime: GC_TIME,
  });
}

/**
 * Hook for search typeahead autocomplete
 */
export function useFxTypeahead(
  query: string,
  options?: {
    result_type?: 'users' | 'topics' | 'events';
    src?: string;
    enabled?: boolean;
  }
) {
  const trimmed = query.trim();
  const isEnabled = (options?.enabled ?? true) && trimmed.length >= 2;

  return useQuery({
    queryKey: fxTwitterKeys.typeahead(trimmed, {
      result_type: options?.result_type,
      src: options?.src,
    }),
    queryFn: () =>
      getFxTypeahead({
        q: trimmed,
        result_type: options?.result_type,
        src: options?.src,
      }),
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000,
    gcTime: GC_TIME,
  });
}

/**
 * Hook for trending topics
 */
export function useFxTrends(options?: {
  type?: string;
  count?: number;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: fxTwitterKeys.trends({
      type: options?.type,
      count: options?.count,
    }),
    queryFn: () =>
      getFxTrends({
        type: options?.type,
        count: options?.count,
      }),
    enabled: options?.enabled ?? true,
    staleTime: 10 * 60 * 1000,
    gcTime: GC_TIME,
  });
}

/**
 * Hook to inspect today's FxTwitter daily quota & usage statistics
 */
export function useFxTwitterQuota() {
  return useQuery({
    queryKey: fxTwitterKeys.quota(),
    queryFn: () => getFxTwitterDailyUsage(),
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Poll every minute if screen is active
  });
}
