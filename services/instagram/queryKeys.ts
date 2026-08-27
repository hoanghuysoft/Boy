/**
 * Centralized Query Keys Factory for Instagram / Social AIO
 * Follows TanStack Query Key Factory Pattern (qk-factory-pattern)
 */

export const instagramKeys = {
  all: ['instagram'] as const,

  // ─── User Namespace ────────────────────────────────────────────────────────
  users: () => [...instagramKeys.all, 'users'] as const,
  user: (usernameOrUrl: string) =>
    [...instagramKeys.users(), usernameOrUrl.toLowerCase().trim()] as const,

  // ─── 1. User Info ──────────────────────────────────────────────────────────
  userInfo: (usernameOrUrl: string, raw?: boolean) =>
    [...instagramKeys.user(usernameOrUrl), 'info', { raw: !!raw }] as const,

  // ─── 2. User Stories ───────────────────────────────────────────────────────
  stories: (usernameOrUrl: string, raw?: boolean) =>
    [...instagramKeys.user(usernameOrUrl), 'stories', { raw: !!raw }] as const,

  // ─── 3. User Posts ─────────────────────────────────────────────────────────
  posts: (usernameOrUrl: string, cursor?: string) =>
    [...instagramKeys.user(usernameOrUrl), 'posts', { cursor: cursor || null }] as const,

  // ─── 4. User Reels ─────────────────────────────────────────────────────────
  reels: (usernameOrUrl: string, cursor?: string, raw?: boolean) =>
    [...instagramKeys.user(usernameOrUrl), 'reels', { cursor: cursor || null, raw: !!raw }] as const,

  // ─── Config / Client ID Status ─────────────────────────────────────────────
  config: () => [...instagramKeys.all, 'config'] as const,
};
