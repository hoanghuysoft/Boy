/**
 * Centralized query key factory
 * Rule: qk-factory-pattern — use factories for consistency, type safety, and safe invalidation.
 *
 * Usage:
 *   queryClient.invalidateQueries({ queryKey: socialLinkKeys.all(profileId) })
 *   queryClient.invalidateQueries({ queryKey: profileKeys.detail('me') })
 */

// ─── Profile ─────────────────────────────────────────────────────────────────
export const profileKeys = {
    all: ['profile'] as const,
    lists: () => [...profileKeys.all, 'list'] as const,
    list: (search: string) => [...profileKeys.lists(), search] as const,
    detail: (id: string) => [...profileKeys.all, id] as const,
    adminCheck: ['admin-check'] as const,
};

// ─── Feed ─────────────────────────────────────────────────────────────────────
export const feedKeys = {
    home: ['feed'] as const,
    feedMode: (mode: string) => ['feed', mode] as const,
    profile: (profileId: string) => ['profileFeed', profileId] as const,
    video: ['videoFeed'] as const,
};

// ─── Like ─────────────────────────────────────────────────────────────────────
export const likeKeys = {
    status: (postId: string) => ['like', postId] as const,
    likers: (postId: string) => ['likers', postId] as const,
};

// ─── Bookmark ─────────────────────────────────────────────────────────────────
export const bookmarkKeys = {
    all: ['bookmarks'] as const,
    status: (postId: string) => ['bookmark', postId] as const,
};

// ─── Post ──────────────────────────────────────────────────────────────────────
export const postKeys = {
    /** Single post detail */
    detail: (profileId: string, postId: string) =>
        ['posts', profileId, postId] as const,

    /** Media associated with a profile */
    media: (profileId: string) => ['media', profileId] as const,
};

// ─── Comment ──────────────────────────────────────────────────────────────────
export const commentKeys = {
    list: (postId: string) => ['comments', postId] as const,
    replies: (postId: string, commentId: string) => ['comments', postId, commentId, 'replies'] as const,
};

// ─── Note ─────────────────────────────────────────────────────────────────────
export const noteKeys = {
    all: ['notes'] as const,
    list: (limit: number) => [...noteKeys.all, limit] as const,
    detail: (id: number) => ['note', id] as const,
};

// ─── Social Link ──────────────────────────────────────────────────────────────
export const socialLinkKeys = {
    all: (profileId: string) => ['social-links', profileId] as const,
};

// ─── Address ──────────────────────────────────────────────────────────────────
export const addressKeys = {
    all: (profileId: string) => ['addresses', profileId] as const,
};

// ─── Music ────────────────────────────────────────────────────────────────────
export const musicKeys = {
    all: (profileId: string) => ['music', profileId] as const,
};

// ─── Workplace ────────────────────────────────────────────────────────────────
export const workplaceKeys = {
    all: (profileId: string) => ['workplaces', profileId] as const,
};

// ─── Shows (external crawler API) ────────────────────────────────────────────
// Server-side cache is 300s — client staleTime matches that.
export const showsKeys = {
    all: ['shows'] as const,
    health: () => [...showsKeys.all, 'health'] as const,
    slider: () => [...showsKeys.all, 'slider'] as const,
    sections: () => [...showsKeys.all, 'sections'] as const,
    categories: () => [...showsKeys.all, 'categories'] as const,
    // category — shared root for both paged and infinite variants
    category: (slug: string) => [...showsKeys.all, 'category', slug] as const,
    categoryPage: (slug: string, page: number) => [...showsKeys.category(slug), page] as const,
    // tag
    tag: (tag: string) => [...showsKeys.all, 'tag', tag] as const,
    tagPage: (tag: string, page: number) => [...showsKeys.tag(tag), page] as const,
    // search
    search: (query: string) => [...showsKeys.all, 'search', query] as const,
    searchPage: (query: string, page: number) => [...showsKeys.search(query), page] as const,
    // video detail
    videoDetail: (slug: string) => [...showsKeys.all, 'video', slug] as const,
    // latest
    latest: () => [...showsKeys.all, 'latest'] as const,
    latestPage: (page: number) => [...showsKeys.latest(), page] as const,
    // popular
    popular: () => [...showsKeys.all, 'popular'] as const,
    popularPage: (page: number) => [...showsKeys.popular(), page] as const,
    // least-viewed
    leastViewed: () => [...showsKeys.all, 'leastViewed'] as const,
    leastViewedPage: (page: number) => [...showsKeys.leastViewed(), page] as const,
    // chat
    chat: (i?: string, c?: string) => [...showsKeys.all, 'chat', i || '', c || ''] as const,
};

