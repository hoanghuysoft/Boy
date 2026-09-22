/**
 * Comment service for posts
 * Endpoints: 
 *   GET/POST   /api/posts/[id]/comments
 *   PUT/DELETE /api/posts/[id]/comments/[commentId]
 *   POST/DELETE /api/posts/[id]/comments/[commentId]/like
 */

import {
    Comment,
    CommentResponse,
    CommentSortFilter,
    CreateCommentInput,
    ReplyDirection,
    ToggleCommentLikeResponse,
    UpdateCommentInput,
} from '@/types/comment';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from './client';
import { commentKeys, feedKeys } from './queryKeys';

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get comments/replies for a post (paginated)
 */
export const getComments = async ({
    postId,
    pageParam,
    parentId,
    sort = 'recent',
    direction = 'forward',
}: {
    postId: string;
    pageParam?: string;
    parentId?: string;
    sort?: CommentSortFilter;
    direction?: ReplyDirection;
}): Promise<CommentResponse> => {
    const params: Record<string, any> = {};
    if (pageParam) params.cursor = pageParam;
    if (parentId) params.parent_id = parentId;
    if (sort) params.sort = sort;
    if (direction && direction !== 'forward') params.direction = direction;

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

/**
 * Toggle like on a comment
 */
export const toggleCommentLike = async (
    postId: string,
    commentId: string
): Promise<ToggleCommentLikeResponse> => {
    const response = await client.post<ToggleCommentLikeResponse>(
        `/api/posts/${postId}/comments/${commentId}/like`
    );
    return response.data;
};

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Patches a single post's comment_count across all feed caches.
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

    queryClient.setQueriesData({ queryKey: feedKeys.home, exact: false }, updater);
    queryClient.setQueriesData({ queryKey: ['profileFeed'], exact: false }, updater);

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
    queryClient.setQueriesData({ queryKey: feedKeys.video, exact: false }, videoUpdater);
};

/**
 * Hook for fetching comments on a post (infinite scroll) with sorting filter
 */
export const useComments = (postId: string | undefined, sort: CommentSortFilter = 'recent') => {
    return useInfiniteQuery({
        queryKey: commentKeys.list(postId!, sort),
        queryFn: ({ pageParam }) => getComments({ postId: postId!, sort, pageParam }),
        getNextPageParam: (lastPage) =>
            lastPage.pagination.hasNextPage ? lastPage.pagination.nextCursor ?? undefined : undefined,
        initialPageParam: undefined as string | undefined,
        enabled: !!postId,
        staleTime: 30 * 1000,
    });
};

/**
 * Hook for fetching replies on a comment (infinite scroll)
 */
export const useReplies = (
    postId: string | undefined,
    parentId: string | undefined,
    direction: ReplyDirection = 'forward'
) => {
    return useInfiniteQuery({
        queryKey: commentKeys.replies(postId!, parentId!),
        queryFn: ({ pageParam }) => getComments({ postId: postId!, parentId: parentId!, direction, pageParam }),
        getNextPageParam: (lastPage) =>
            lastPage.pagination.hasNextPage ? lastPage.pagination.nextCursor ?? undefined : undefined,
        initialPageParam: undefined as string | undefined,
        enabled: !!postId && !!parentId,
        staleTime: 30 * 1000,
    });
};

/**
 * Hook for toggling like on a comment with optimistic update
 */
export const useToggleCommentLike = (postId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (commentId: string) => toggleCommentLike(postId, commentId),
        onMutate: async (commentId: string) => {
            await queryClient.cancelQueries({ queryKey: commentKeys.post(postId) });

            const previousQueries = queryClient.getQueriesData({ queryKey: commentKeys.post(postId) });

            const patchComment = (c: Comment): Comment => {
                let updated = c;
                if (String(c.id) === String(commentId)) {
                    const willLike = !c.is_liked;
                    updated = {
                        ...c,
                        is_liked: willLike,
                        like_count: Math.max(0, (c.like_count || 0) + (willLike ? 1 : -1)),
                    };
                }
                if (updated.author_reply && String(updated.author_reply.id) === String(commentId)) {
                    const willLike = !updated.author_reply.is_liked;
                    updated = {
                        ...updated,
                        author_reply: {
                            ...updated.author_reply,
                            is_liked: willLike,
                            like_count: Math.max(0, (updated.author_reply.like_count || 0) + (willLike ? 1 : -1)),
                        },
                    };
                }
                return updated;
            };

            const updater = (oldData: any) => {
                if (!oldData?.pages) return oldData;
                return {
                    ...oldData,
                    pages: oldData.pages.map((page: any) => ({
                        ...page,
                        data: page.data.map(patchComment),
                    })),
                };
            };

            queryClient.setQueriesData({ queryKey: commentKeys.post(postId) }, updater);

            return { previousQueries };
        },
        onError: (_err, _commentId, context) => {
            if (context?.previousQueries) {
                for (const [key, data] of context.previousQueries) {
                    queryClient.setQueryData(key, data);
                }
            }
        },
    });
};

/**
 * Hook for creating a comment/reply — optimistically inserts into list or replies cache
 */
export const useCreateComment = (postId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateCommentInput) => createComment(postId, data),
        onMutate: async (variables) => {
            const listKeyRecent = commentKeys.list(postId, 'recent');
            const listKeyLiked = commentKeys.list(postId, 'most_liked');
            const repliesKey = variables.parent_id ? commentKeys.replies(postId, variables.parent_id) : null;

            // 1. Cancel in-flight refetches
            await queryClient.cancelQueries({ queryKey: commentKeys.post(postId) });

            // 2. Snapshot previous values
            const previousListRecent = queryClient.getQueryData(listKeyRecent);
            const previousListLiked = queryClient.getQueryData(listKeyLiked);
            const previousReplies = repliesKey ? queryClient.getQueryData(repliesKey) : null;

            // 3. Construct optimistic comment
            const myProfile = queryClient.getQueryData<any>(['profile', 'me']);
            const optimisticComment: Comment = {
                id: `temp-${Date.now()}`,
                post_id: postId,
                user_id: myProfile?.user_id || "",
                content: variables.content,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                profile_name: myProfile?.name || "Me",
                profile_username: myProfile?.username || null,
                profile_avatar: myProfile?.avatar_url || undefined,
                profile_is_verified: !!myProfile?.is_verified,
                profile_id: myProfile?.id || null,
                parent_id: variables.parent_id || null,
                reply_to_name: null,
                reply_to_username: null,
                reply_to_profile_id: null,
                reply_count: 0,
                like_count: 0,
                is_liked: false,
                is_owner: true,
                can_delete: true,
                can_edit: true,
            };

            // Resolve parent comment info if this is a reply
            if (variables.parent_id) {
                const listData = (previousListRecent || previousListLiked) as any;
                if (listData?.pages) {
                    const parentComment = listData.pages
                        .flatMap((p: any) => p.data)
                        .find((c: any) => String(c.id) === String(variables.parent_id));
                    if (parentComment) {
                        optimisticComment.reply_to_name = parentComment.profile_name || null;
                        optimisticComment.reply_to_username = parentComment.profile_username || null;
                        optimisticComment.reply_to_profile_id = parentComment.profile_id || null;
                    }
                }
            }

            // 4. Update caches optimistically
            if (repliesKey) {
                queryClient.setQueryData(repliesKey, (old: any) => {
                    if (!old?.pages) {
                        return {
                            pages: [{
                                data: [optimisticComment],
                                pagination: { total: 1, limit: 20, hasNextPage: false, nextCursor: null }
                            }],
                            pageParams: [undefined]
                        };
                    }
                    return {
                        ...old,
                        pages: old.pages.map((page: any, idx: number) => {
                            if (idx === old.pages.length - 1) {
                                return {
                                    ...page,
                                    data: [...page.data, optimisticComment]
                                };
                            }
                            return page;
                        })
                    };
                });

                // Increment reply count on top-level parent comment across list caches
                const incParentReply = (old: any) => {
                    if (!old?.pages) return old;
                    return {
                        ...old,
                        pages: old.pages.map((page: any) => ({
                            ...page,
                            data: page.data.map((c: any) => 
                                String(c.id) === String(variables.parent_id) 
                                    ? { ...c, reply_count: (c.reply_count || 0) + 1 } 
                                    : c
                            )
                        }))
                    };
                };
                queryClient.setQueryData(listKeyRecent, incParentReply);
                queryClient.setQueryData(listKeyLiked, incParentReply);
            } else {
                // Add top-level comment to recent list
                const addTopLevel = (old: any) => {
                    if (!old?.pages) return old;
                    return {
                        ...old,
                        pages: old.pages.map((page: any, idx: number) => {
                            if (idx === 0) {
                                return {
                                    ...page,
                                    data: [optimisticComment, ...page.data]
                                };
                            }
                            return page;
                        })
                    };
                };
                queryClient.setQueryData(listKeyRecent, addTopLevel);
                queryClient.setQueryData(listKeyLiked, addTopLevel);
            }

            patchCommentCountInFeedCaches(queryClient, postId, +1);

            return { previousListRecent, previousListLiked, previousReplies, optimisticComment };
        },
        onSuccess: (res, variables, context) => {
            const realComment = res.data;
            const replaceInList = (old: any) => {
                if (!old?.pages) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: any) => ({
                        ...page,
                        data: page.data.map((c: any) => 
                            c.id === context?.optimisticComment.id ? realComment : c
                        )
                    }))
                };
            };

            queryClient.setQueryData(commentKeys.list(postId, 'recent'), replaceInList);
            queryClient.setQueryData(commentKeys.list(postId, 'most_liked'), replaceInList);

            if (variables.parent_id) {
                const repliesKey = commentKeys.replies(postId, variables.parent_id);
                queryClient.setQueryData(repliesKey, replaceInList);
            }
        },
        onError: (_err, variables, context) => {
            if (context?.previousListRecent) {
                queryClient.setQueryData(commentKeys.list(postId, 'recent'), context.previousListRecent);
            }
            if (context?.previousListLiked) {
                queryClient.setQueryData(commentKeys.list(postId, 'most_liked'), context.previousListLiked);
            }
            if (variables.parent_id && context?.previousReplies) {
                queryClient.setQueryData(commentKeys.replies(postId, variables.parent_id), context.previousReplies);
            }
            patchCommentCountInFeedCaches(queryClient, postId, -1);
        },
        onSettled: (_data, _err, variables) => {
            queryClient.invalidateQueries({ queryKey: commentKeys.list(postId, 'recent') });
            queryClient.invalidateQueries({ queryKey: commentKeys.list(postId, 'most_liked') });
            if (variables.parent_id) {
                queryClient.invalidateQueries({ queryKey: commentKeys.replies(postId, variables.parent_id) });
            }
        },
    });
};

/**
 * Hook for updating a comment or reply
 */
export const useUpdateComment = (postId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ commentId, data }: { commentId: string; data: UpdateCommentInput; parentId?: string | null }) =>
            updateComment(postId, commentId, data),
        onMutate: async ({ commentId, data, parentId }) => {
            const listKeyRecent = commentKeys.list(postId, 'recent');
            const listKeyLiked = commentKeys.list(postId, 'most_liked');
            const repliesKey = parentId ? commentKeys.replies(postId, parentId) : null;

            await queryClient.cancelQueries({ queryKey: commentKeys.post(postId) });

            const previousListRecent = queryClient.getQueryData(listKeyRecent);
            const previousListLiked = queryClient.getQueryData(listKeyLiked);
            const previousReplies = repliesKey ? queryClient.getQueryData(repliesKey) : null;

            const updater = (old: any) => {
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
            };

            queryClient.setQueryData(listKeyRecent, updater);
            queryClient.setQueryData(listKeyLiked, updater);
            if (repliesKey) {
                queryClient.setQueryData(repliesKey, updater);
            }

            return { previousListRecent, previousListLiked, previousReplies };
        },
        onError: (_err, variables, context) => {
            if (context?.previousListRecent) {
                queryClient.setQueryData(commentKeys.list(postId, 'recent'), context.previousListRecent);
            }
            if (context?.previousListLiked) {
                queryClient.setQueryData(commentKeys.list(postId, 'most_liked'), context.previousListLiked);
            }
            if (variables.parentId && context?.previousReplies) {
                queryClient.setQueryData(commentKeys.replies(postId, variables.parentId), context.previousReplies);
            }
        },
        onSettled: (_data, _err, variables) => {
            queryClient.invalidateQueries({ queryKey: commentKeys.list(postId, 'recent') });
            queryClient.invalidateQueries({ queryKey: commentKeys.list(postId, 'most_liked') });
            if (variables.parentId) {
                queryClient.invalidateQueries({ queryKey: commentKeys.replies(postId, variables.parentId) });
            }
        },
    });
};

/**
 * Hook for deleting a comment/reply — optimistically decrements comment_count
 */
export const useDeleteComment = (postId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ commentId }: { commentId: string; parentId?: string | null }) => deleteComment(postId, commentId),
        onMutate: async ({ commentId, parentId }) => {
            const listKeyRecent = commentKeys.list(postId, 'recent');
            const listKeyLiked = commentKeys.list(postId, 'most_liked');
            const repliesKey = parentId ? commentKeys.replies(postId, parentId) : null;

            await queryClient.cancelQueries({ queryKey: commentKeys.post(postId) });

            const previousListRecent = queryClient.getQueryData(listKeyRecent);
            const previousListLiked = queryClient.getQueryData(listKeyLiked);
            const previousReplies = repliesKey ? queryClient.getQueryData(repliesKey) : null;

            const filterFn = (old: any) => {
                if (!old?.pages) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: any) => ({
                        ...page,
                        data: page.data.filter((c: Comment) => c.id !== commentId),
                    })),
                };
            };

            queryClient.setQueryData(listKeyRecent, filterFn);
            queryClient.setQueryData(listKeyLiked, filterFn);
            if (repliesKey) {
                queryClient.setQueryData(repliesKey, filterFn);
            }

            // Decrement parent reply count if a reply is deleted
            if (parentId) {
                const decrFn = (old: any) => {
                    if (!old?.pages) return old;
                    return {
                        ...old,
                        pages: old.pages.map((page: any) => ({
                            ...page,
                            data: page.data.map((c: any) => 
                                String(c.id) === String(parentId) 
                                    ? { ...c, reply_count: Math.max(0, (c.reply_count || 0) - 1) } 
                                    : c
                            )
                        }))
                    };
                };
                queryClient.setQueryData(listKeyRecent, decrFn);
                queryClient.setQueryData(listKeyLiked, decrFn);
            }

            patchCommentCountInFeedCaches(queryClient, postId, -1);

            return { previousListRecent, previousListLiked, previousReplies };
        },
        onError: (_err, variables, context) => {
            if (context?.previousListRecent) {
                queryClient.setQueryData(commentKeys.list(postId, 'recent'), context.previousListRecent);
            }
            if (context?.previousListLiked) {
                queryClient.setQueryData(commentKeys.list(postId, 'most_liked'), context.previousListLiked);
            }
            if (variables.parentId && context?.previousReplies) {
                queryClient.setQueryData(commentKeys.replies(postId, variables.parentId), context.previousReplies);
            }
            patchCommentCountInFeedCaches(queryClient, postId, +1);
        },
        onSettled: (_data, _err, variables) => {
            queryClient.invalidateQueries({ queryKey: commentKeys.list(postId, 'recent') });
            queryClient.invalidateQueries({ queryKey: commentKeys.list(postId, 'most_liked') });
            if (variables.parentId) {
                queryClient.invalidateQueries({ queryKey: commentKeys.replies(postId, variables.parentId) });
            }
        },
    });
};
