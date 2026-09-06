/**
 * Centralized Query Keys Factory for Threads / Social AIO
 * Follows TanStack Query Key Factory Pattern (qk-factory-pattern)
 */

export const threadsKeys = {
  all: ['threads'] as const,

  // ─── User Namespace ────────────────────────────────────────────────────────
  users: () => [...threadsKeys.all, 'users'] as const,
  user: (usernameOrUrl: string) =>
    [...threadsKeys.users(), usernameOrUrl.toLowerCase().trim()] as const,

  // ─── 1. User Info ──────────────────────────────────────────────────────────
  userInfo: (usernameOrUrl: string, raw?: boolean) =>
    [...threadsKeys.user(usernameOrUrl), 'info', { raw: !!raw }] as const,

  // ─── 2. User Posts ─────────────────────────────────────────────────────────
  posts: (usernameOrUrl: string, type?: string, cursor?: string, raw?: boolean) =>
    [
      ...threadsKeys.user(usernameOrUrl),
      'posts',
      { type: type || 'Threads', cursor: cursor || null, raw: !!raw },
    ] as const,
};
