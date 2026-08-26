/**
 * Centralized Query Keys Factory for FxTwitter
 * Follows TanStack Query Key Factory Pattern (qk-factory-pattern)
 */

export const fxTwitterKeys = {
  all: ['fxtwitter'] as const,

  // ─── User / Profile ────────────────────────────────────────────────────────
  users: () => [...fxTwitterKeys.all, 'users'] as const,
  user: (handle: string) => [...fxTwitterKeys.users(), handle.toLowerCase()] as const,
  userProfile: (handle: string, aboutAccount?: boolean) =>
    [...fxTwitterKeys.user(handle), 'profile', { aboutAccount: !!aboutAccount }] as const,
  userAbout: (handle: string) => [...fxTwitterKeys.user(handle), 'about'] as const,

  // ─── User Timelines (Paginated) ────────────────────────────────────────────
  userMedia: (handle: string, count?: number, lang?: string) =>
    [...fxTwitterKeys.user(handle), 'media', { count, lang }] as const,
  userStatuses: (
    handle: string,
    options?: { count?: number; since?: string; with_replies?: boolean; groupthreads?: boolean; lang?: string }
  ) => [...fxTwitterKeys.user(handle), 'statuses', options || {}] as const,
  userArticles: (handle: string, count?: number, lang?: string) =>
    [...fxTwitterKeys.user(handle), 'articles', { count, lang }] as const,
  userFollowers: (handle: string, count?: number) =>
    [...fxTwitterKeys.user(handle), 'followers', { count }] as const,
  userFollowing: (handle: string, count?: number) =>
    [...fxTwitterKeys.user(handle), 'following', { count }] as const,

  // ─── Tweets / Statuses ─────────────────────────────────────────────────────
  statuses: () => [...fxTwitterKeys.all, 'status'] as const,
  statusDetail: (id: string, options?: { about_account?: boolean; lang?: string }) =>
    [...fxTwitterKeys.statuses(), id, 'detail', options || {}] as const,
  thread: (id: string, options?: { about_account?: boolean; lang?: string }) =>
    [...fxTwitterKeys.statuses(), id, 'thread', options || {}] as const,
  conversation: (
    id: string,
    options?: { ranking_mode?: string; about_account?: boolean; lang?: string }
  ) => [...fxTwitterKeys.statuses(), id, 'conversation', options || {}] as const,
  statusReposts: (id: string, count?: number) =>
    [...fxTwitterKeys.statuses(), id, 'reposts', { count }] as const,
  statusQuotes: (id: string, count?: number, lang?: string) =>
    [...fxTwitterKeys.statuses(), id, 'quotes', { count, lang }] as const,

  // ─── Search, Trends, Typeahead ─────────────────────────────────────────────
  search: (query: string, options?: { feed?: string; count?: number; lang?: string }) =>
    [...fxTwitterKeys.all, 'search', query, options || {}] as const,
  typeahead: (query: string, options?: { result_type?: string; src?: string }) =>
    [...fxTwitterKeys.all, 'typeahead', query, options || {}] as const,
  trends: (options?: { type?: string; count?: number }) =>
    [...fxTwitterKeys.all, 'trends', options || {}] as const,

  // ─── Quota ─────────────────────────────────────────────────────────────────
  quota: () => [...fxTwitterKeys.all, 'quota'] as const,
};
