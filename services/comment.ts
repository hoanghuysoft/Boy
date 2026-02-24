/**
 * Comment service for posts
 * Endpoints: 
 *   GET/POST   /api/posts/[id]/comments
 *   PUT/DELETE /api/posts/[id]/comments/[commentId]
 */

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from './client';
import { Comment, CommentResponse, CreateCommentInput, UpdateCommentInput } from '@/types/comment';

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
 * Hook for fetching comments on a post (infinite scroll)
 */
export const useComments = (postId: string | undefined) => {
    return useInfiniteQuery({
        queryKey: ['comments', postId],
        queryFn: ({ pageParam }) => getComments({ postId: postId!, pageParam }),
        getNextPageParam: (lastPage) =>
            lastPage.pagination.hasNextPage ? lastPage.pagination.nextCursor ?? undefined : undefined,
        initialPageParam: undefined as string | undefined,
        enabled: !!postId,
    });
};

/**
 * Hook for creating a comment
 */
export const useCreateComment = (postId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateCommentInput) => createComment(postId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', postId] });
            // Also invalidate feed queries to update comment counts
            queryClient.invalidateQueries({ queryKey: ['feed'], exact: false });
            queryClient.invalidateQueries({ queryKey: ['profileFeed'], exact: false });
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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', postId] });
        },
    });
};

/**
 * Hook for deleting a comment
 */
export const useDeleteComment = (postId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (commentId: string) => deleteComment(postId, commentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', postId] });
            queryClient.invalidateQueries({ queryKey: ['feed'], exact: false });
            queryClient.invalidateQueries({ queryKey: ['profileFeed'], exact: false });
        },
    });
};
