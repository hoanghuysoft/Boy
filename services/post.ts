/**
 * Client API service for profile owners to manage their posts
 * Uses the /client endpoints which verify profile ownership
 */

import { Link, Post } from '@/types/post';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from './client';

// ============================================================================
// Types
// ============================================================================

export interface CreatePostInput {
    content?: string;
    location?: string;
    device?: string;
    deezer_id?: string;
    links?: Link[];
    is_ghost?: boolean;
    is_adult?: boolean;
    media_ids?: string[];
}

export interface CreatePostResponse {
    data: Post;
}

export interface DeletePostResponse {
    success: boolean;
    mediaDeleted: boolean;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Create a new post
 */
export const createPost = async (
    profileId: string,
    data: CreatePostInput
): Promise<CreatePostResponse> => {
    const response = await client.post<CreatePostResponse>(
        `/api/profiles/${profileId}/posts/client`,
        data
    );
    return response.data;
};

/**
 * Delete a post
 * @param profileId - Profile ID
 * @param postId - Post ID to delete
 * @param deleteMedia - Also delete associated media files from storage
 */
export const deletePost = async (
    profileId: string,
    postId: string,
    deleteMedia: boolean = false
): Promise<DeletePostResponse> => {
    const response = await client.delete<DeletePostResponse>(
        `/api/profiles/${profileId}/posts/client/${postId}`,
        { params: { deleteMedia } }
    );
    return response.data;
};

/**
 * Get a single post
 */
export const getPost = async (
    profileId: string,
    postId: string
): Promise<{ data: Post }> => {
    const response = await client.get<{ data: Post }>(
        `/api/profiles/${profileId}/posts/client/${postId}`
    );
    return response.data;
};

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook for creating a post
 */
export const useCreatePost = (profileId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreatePostInput) => createPost(profileId, data),
        onSuccess: () => {
            // Invalidate posts cache to refetch
            queryClient.invalidateQueries({ queryKey: ['profileFeed', profileId] });
            queryClient.invalidateQueries({ queryKey: ['feed'], exact: false }); // Matches ['feed', mode]
            queryClient.invalidateQueries({ queryKey: ['profile', profileId] });
            queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
        },
    });
};

/**
 * Hook for deleting a post
 */
export const useDeletePost = (profileId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ postId, deleteMedia = false }: { postId: string; deleteMedia?: boolean }) =>
            deletePost(profileId, postId, deleteMedia),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profileFeed', profileId] });
            queryClient.invalidateQueries({ queryKey: ['feed'], exact: false });
            queryClient.invalidateQueries({ queryKey: ['media', profileId] });
            queryClient.invalidateQueries({ queryKey: ['profile', profileId] });
            queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
        },
    });
};
