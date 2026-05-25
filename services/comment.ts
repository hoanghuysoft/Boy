/**
 * Comment service for posts
 * Endpoints: 
 *   GET/POST   /api/posts/[id]/comments
 *   PUT/DELETE /api/posts/[id]/comments/[commentId]
 */

import { Comment, CommentResponse, CreateCommentInput, UpdateCommentInput } from '@/types/comment';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from './client';
import { commentKeys } from './queryKeys';

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get comments for a post (paginated)
 */
export const getComments = async ({
    postId,
    pageParam,
}: {
    postId: string;
    pageParam?: string;
}): Promise<CommentResponse> => {
    const params: Record<string, any> = {};
    if (pageParam) params.cursor = pageParam;

    const response = await client.get<CommentResponse>(`/api/posts/${postId}/comments`, {
        params,
    });
    return response.data;
};

/**
 * Create a comment on a post
 */
export const createComment = async (
    postId: string,
    data: CreateCommentInput
): Promise<{ data: Comment }> => {
    const response = await client.post<{ data: Comment }>(
        `/api/posts/${postId}/comments`,
        data
    );
    return response.data;
};

/**
 * Update a comment
 */
export const updateComment = async (
    postId: string,
    commentId: string,
    data: UpdateCommentInput
): Promise<{ data: Comment }> => {
    const response = await client.put<{ data: Comment }>(
        `/api/posts/${postId}/comments/${commentId}`,
        data
    );
    return response.data;
};

/**
 * Delete a comment
 */
export const deleteComment = async (
    postId: string,
    commentId: string
): Promise<{ success: boolean }> => {
    const response = await client.delete<{ success: boolean }>(
        `/api/posts/${postId}/comments/${commentId}`
    );
    return response.data;
};

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Patches a single post's comment_count across all feed caches.
 * Same pattern as patchPostInFeedCaches in like.ts — instant UI update.
 */
const patchCommentCountInFeedCaches = (
    queryClient: ReturnType<typeof useQueryClient>,
    postId: string,
    delta: number
) => {
    const updater = (oldData: any) => {
        if (!oldData?.pages) return oldData;
        return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
                ...page,
                data: page.data.map((post: any) =>
                    post.id === postId
                        ? {
                            ...post,
                            comment_count: Math.max(0, (post.comment_count ?? 0) + delta),
                        }
                        : post
                ),
            })),
        };
    };

    queryClient.setQueriesData({ queryKey: ['feed'], exact: false }, updater);
    queryClient.setQueriesData({ queryKey: ['profileFeed'], exact: false }, updater);

    // Also patch the video (Shots) feed — videos link to posts via post_id
    const videoUpdater = (oldData: any) => {
        if (!oldData?.pages) return oldData;
        return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
                ...page,
                data: page.data.map((video: any) =>
                    video.post_id === postId
                        ? { ...video, comment_count: Math.max(0, (video.comment_count ?? 0) + delta) }
                        : video
                ),
            })),
        };
    };
    queryClient.setQueriesData({ queryKey: ['videoFeed'], exact: false }, videoUpdater);
};

/**
 * Hook for fetching comments on a post (infinite scroll)
 */
export const useComments = (postId: string | undefined) => {
    return useInfiniteQuery({
        queryKey: commentKeys.list(postId!),
        queryFn: ({ pageParam }) => getComments({ postId: postId!, pageParam }),
        getNextPageParam: (lastPage) =>
            lastPage.pagination.hasNextPage ? lastPage.pagination.nextCursor ?? undefined : undefined,
        initialPageParam: undefined as string | undefined,
        enabled: !!postId,
        staleTime: 30 * 1000, // 30s — comments change frequently
    });
};

/**
 * Hook for creating a comment — optimistically increments comment_count
 */
export const useCreateComment = (postId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateCommentInput) => createComment(postId, data),
        onMutate: async () => {
            // Cancel in-flight refetches so they don't overwrite the optimistic update
            await queryClient.cancelQueries({ queryKey: commentKeys.list(postId) });
            // Optimistically increment comment count in feed caches
            patchCommentCountInFeedCaches(queryClient, postId, +1);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: commentKeys.list(postId) });
        },
        onError: () => {
            // Roll back the optimistic increment
            patchCommentCountInFeedCaches(queryClient, postId, -1);
        },
    });
};

/**
 * Hook for updating a comment
 */
export const useUpdateComment = (postId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ commentId, data }: { commentId: string; data: UpdateCommentInput }) =>
            updateComment(postId, commentId, data),
        onMutate: async ({ commentId, data }) => {
            await queryClient.cancelQueries({ queryKey: commentKeys.list(postId) });
            const previous = queryClient.getQueryData(commentKeys.list(postId));
            // Optimistically patch the comment text in the list cache
            queryClient.setQueryData(commentKeys.list(postId), (old: any) => {
                if (!old?.pages) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: any) => ({
                        ...page,
                        data: page.data.map((c: Comment) =>
                            c.id === commentId ? { ...c, ...data } : c
                        ),
                    })),
                };
            });
            return { previous };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous) queryClient.setQueryData(commentKeys.list(postId), context.previous);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: commentKeys.list(postId) });
        },
    });
};

/**
 * Hook for deleting a comment — optimistically decrements comment_count
 */
export const useDeleteComment = (postId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (commentId: string) => deleteComment(postId, commentId),
        onMutate: async (commentId: string) => {
            await queryClient.cancelQueries({ queryKey: commentKeys.list(postId) });
            const previousList = queryClient.getQueryData(commentKeys.list(postId));
            // Optimistically remove from list
            queryClient.setQueryData(commentKeys.list(postId), (old: any) => {
                if (!old?.pages) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: any) => ({
                        ...page,
                        data: page.data.filter((c: Comment) => c.id !== commentId),
                    })),
                };
            });
            // Optimistically decrement comment count in feed caches
            patchCommentCountInFeedCaches(queryClient, postId, -1);
            return { previousList };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: commentKeys.list(postId) });
        },
        onError: (_err, _commentId, context) => {
            if (context?.previousList) queryClient.setQueryData(commentKeys.list(postId), context.previousList);
            // Roll back the optimistic decrement
            patchCommentCountInFeedCaches(queryClient, postId, +1);
        },
    });
};

