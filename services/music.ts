/**
 * Music service
 * Endpoints:
 *   GET  /api/profiles/[id]/music              - List profile music (paginated)
 *   POST /api/profiles/[id]/music              - Add a track (deezer_id)
 *   PUT  /api/profiles/[id]/music/[musicId]    - Update a track (deezer_id)
 *   DELETE /api/profiles/[id]/music/[musicId]  - Remove a track
 */

import { ProfileMusic } from "@/types/profilemusic";
import {
    useInfiniteQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { client } from "./client";

// ============================================================================
// Types
// ============================================================================

export interface MusicResponse {
    data: ProfileMusic[];
    pagination: {
        total: number;
        limit: number;
        hasNextPage: boolean;
        nextCursor: string | null;
    };
}

export interface AddMusicPayload {
    profileId: string;
    deezer_id: string;
}

export interface UpdateMusicPayload {
    profileId: string;
    musicId: string;
    deezer_id: string;
}

export interface DeleteMusicPayload {
    profileId: string;
    musicId: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch paginated music for a profile
 */
export const getMusic = async ({
    profileId,
    pageParam,
}: {
    profileId: string;
    pageParam?: string;
}): Promise<MusicResponse> => {
    const params: Record<string, any> = { limit: 50 };
    if (pageParam) params.cursor = pageParam;

    const response = await client.get<MusicResponse>(
        `/api/profiles/${profileId}/music`,
        { params }
    );
    return response.data;
};

/**
 * Add a new track to a profile
 */
export const addMusic = async ({
    profileId,
    deezer_id,
}: AddMusicPayload): Promise<{ data: ProfileMusic }> => {
    const response = await client.post<{ data: ProfileMusic }>(
        `/api/profiles/${profileId}/music`,
        { deezer_id }
    );
    return response.data;
};

/**
 * Update a track on a profile
 */
export const updateMusic = async ({
    profileId,
    musicId,
    deezer_id,
}: UpdateMusicPayload): Promise<{ data: ProfileMusic }> => {
    const response = await client.put<{ data: ProfileMusic }>(
        `/api/profiles/${profileId}/music/${musicId}`,
        { deezer_id }
    );
    return response.data;
};

/**
 * Remove a track from a profile
 */
export const deleteMusic = async ({
    profileId,
    musicId,
}: DeleteMusicPayload): Promise<{ message: string }> => {
    const response = await client.delete<{ message: string }>(
        `/api/profiles/${profileId}/music/${musicId}`
    );
    return response.data;
};

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook for fetching profile music (infinite scroll)
 */
export const useInfiniteMusic = (profileId: string) => {
    return useInfiniteQuery({
        queryKey: ["music", profileId],
        queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
            getMusic({ profileId, pageParam }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage: MusicResponse) =>
            lastPage.pagination.hasNextPage
                ? lastPage.pagination.nextCursor ?? undefined
                : undefined,
        enabled: !!profileId,
    });
};

/**
 * Hook to add a track to a profile's music list
 */
export const useAddMusic = (profileId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (deezer_id: string) =>
            addMusic({ profileId, deezer_id }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["music", profileId] });
        },
    });
};

/**
 * Hook to update a track on a profile's music list
 */
export const useUpdateMusic = (profileId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ musicId, deezer_id }: { musicId: string; deezer_id: string }) =>
            updateMusic({ profileId, musicId, deezer_id }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["music", profileId] });
        },
    });
};

/**
 * Hook to delete a track from a profile's music list
 * Performs optimistic removal so the UI updates instantly
 */
export const useDeleteMusic = (profileId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (musicId: string) =>
            deleteMusic({ profileId, musicId }),
        onMutate: async (musicId: string) => {
            // Cancel in-flight queries
            await queryClient.cancelQueries({ queryKey: ["music", profileId] });

            // Snapshot current data for rollback
            const previous = queryClient.getQueryData(["music", profileId]);

            // Optimistically remove the track from all pages
            queryClient.setQueryData(["music", profileId], (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: MusicResponse) => ({
                        ...page,
                        data: page.data.filter((item) => item.id !== musicId),
                        pagination: {
                            ...page.pagination,
                            total: Math.max(0, page.pagination.total - 1),
                        },
                    })),
                };
            });

            return { previous };
        },
        onError: (_err, _musicId, context) => {
            // Roll back on error
            if (context?.previous) {
                queryClient.setQueryData(["music", profileId], context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["music", profileId] });
        },
    });
};