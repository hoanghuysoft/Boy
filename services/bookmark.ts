/**
 * Bookmark service
 * Endpoints:
 *   GET/POST     /api/bookmarks          - List bookmarks / Create bookmark
 *   GET/DELETE   /api/bookmarks/[id]     - Check status / Remove bookmark
 */

import { BookmarksResponse, BookmarkStatusResponse, CreateBookmarkResponse } from '@/types/bookmarkedpost';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from './client';

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get bookmarked posts (paginated)
 */
export const getBookmarks = async ({
    pageParam,
}: {
    pageParam?: string;
}): Promise<BookmarksResponse> => {
    const params: Record<string, any> = {};
    if (pageParam) params.cursor = pageParam;

    const response = await client.get<BookmarksResponse>('/api/bookmarks', { params });
    return response.data;
};

/**
 * Check if a post is bookmarked
 */
export const getBookmarkStatus = async (postId: string): Promise<BookmarkStatusResponse> => {
    const response = await client.get<BookmarkStatusResponse>(`/api/bookmarks/${postId}`);
    return response.data;
};

/**
 * Bookmark a post
 */
export const bookmarkPost = async (postId: string): Promise<CreateBookmarkResponse> => {
    const response = await client.post<CreateBookmarkResponse>('/api/bookmarks', {
        post_id: postId,
    });
    return response.data;
};

/**
 * Remove a bookmark
 */
export const removeBookmark = async (postId: string): Promise<{ success: boolean }> => {
    const response = await client.delete<{ success: boolean }>(`/api/bookmarks/${postId}`);
    return response.data;
};

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook for fetching bookmarked posts (infinite scroll)
 */
export const useBookmarks = () => {
    return useInfiniteQuery({
        queryKey: ['bookmarks'],
        queryFn: ({ pageParam }) => getBookmarks({ pageParam }),
        getNextPageParam: (lastPage) =>
            lastPage.pagination.hasNextPage ? lastPage.pagination.nextCursor ?? undefined : undefined,
        initialPageParam: undefined as string | undefined,
    });
};

/**
 * Hook to check if a post is bookmarked
 */
export const useBookmarkStatus = (postId: string | undefined) => {
    return useQuery({
        queryKey: ['bookmark', postId],
        queryFn: () => getBookmarkStatus(postId!),
        enabled: !!postId,
    });
};

/**
 * Hook to bookmark a post
 */
export const useBookmarkPost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (postId: string) => bookmarkPost(postId),
        onSuccess: (_, postId) => {
            queryClient.setQueryData(['bookmark', postId], { bookmarked: true });
            queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
        },
    });
};

/**
 * Hook to remove a bookmark
 */
export const useRemoveBookmark = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (postId: string) => removeBookmark(postId),
        onSuccess: (_, postId) => {
            queryClient.setQueryData(['bookmark', postId], { bookmarked: false, bookmark_id: null });
            queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
        },
    });
};

/**
 * Hook to toggle bookmark (convenience hook)
 */
export const useToggleBookmark = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ postId, isBookmarked }: { postId: string; isBookmarked: boolean }) => {
            if (isBookmarked) {
                return removeBookmark(postId);
            } else {
                return bookmarkPost(postId);
            }
        },
        onMutate: async ({ postId, isBookmarked }) => {
            // Optimistic update
            await queryClient.cancelQueries({ queryKey: ['bookmark', postId] });
            const previous = queryClient.getQueryData(['bookmark', postId]);
            queryClient.setQueryData(['bookmark', postId], { bookmarked: !isBookmarked, bookmark_id: null });
            return { previous, postId };
        },
        onError: (_, __, context) => {
            // Rollback on error
            if (context) {
                queryClient.setQueryData(['bookmark', context.postId], context.previous);
            }
        },
        onSettled: (_, __, { postId }) => {
            queryClient.invalidateQueries({ queryKey: ['bookmark', postId] });
            queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
        },
    });
};
