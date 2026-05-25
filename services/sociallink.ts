/**
 * SocialLink service
 * Endpoints:
 *   GET  /api/profiles/[id]/social-links               - List profile social links (paginated)
 *   POST /api/profiles/[id]/social-links               - Add a social link (platform, url, label)
 *   PUT  /api/profiles/[id]/social-links/[linkId]      - Update a social link (platform, url, label)
 *   DELETE /api/profiles/[id]/social-links/[linkId]    - Remove a social link
 */

import { ProfileLink } from "@/types/profilelink";
import {
    useInfiniteQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { client } from "./client";

// ============================================================================
// Types
// ============================================================================

export interface SocialLinkResponse {
    data: ProfileLink[];
    pagination: {
        total: number;
        limit: number;
        hasNextPage: boolean;
        nextCursor: string | null;
    };
}

export interface AddSocialLinkPayload {
    profileId: string;
    platform: string;
    url: string;
    label?: string | null;
}

export interface UpdateSocialLinkPayload {
    profileId: string;
    linkId: string;
    platform: string;
    url: string;
    label?: string | null;
}

export interface DeleteSocialLinkPayload {
    profileId: string;
    linkId: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch paginated social links for a profile
 */
export const getSocialLinks = async ({
    profileId,
    pageParam,
}: {
    profileId: string;
    pageParam?: string;
}): Promise<SocialLinkResponse> => {
    const params: Record<string, any> = { limit: 50 };
    if (pageParam) params.cursor = pageParam;

    const response = await client.get<SocialLinkResponse>(
        `/api/profiles/${profileId}/social-links`,
        { params }
    );
    return response.data;
};

/**
 * Add a new social link to a profile
 */
export const addSocialLink = async ({
    profileId,
    platform,
    url,
    label,
}: AddSocialLinkPayload): Promise<{ data: ProfileLink }> => {
    const response = await client.post<{ data: ProfileLink }>(
        `/api/profiles/${profileId}/social-links`,
        { platform, url, label }
    );
    return response.data;
};

/**
 * Update a social link on a profile
 */
export const updateSocialLink = async ({
    profileId,
    linkId,
    platform,
    url,
    label,
}: UpdateSocialLinkPayload): Promise<{ data: ProfileLink }> => {
    const response = await client.put<{ data: ProfileLink }>(
        `/api/profiles/${profileId}/social-links/${linkId}`,
        { platform, url, label }
    );
    return response.data;
};

/**
 * Remove a social link from a profile
 */
export const deleteSocialLink = async ({
    profileId,
    linkId,
}: DeleteSocialLinkPayload): Promise<{ message: string }> => {
    const response = await client.delete<{ message: string }>(
        `/api/profiles/${profileId}/social-links/${linkId}`
    );
    return response.data;
};

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook for fetching profile social links (infinite scroll)
 */
export const useInfiniteSocialLinks = (profileId: string) => {
    return useInfiniteQuery({
        queryKey: ["social-links", profileId],
        queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
            getSocialLinks({ profileId, pageParam }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage: SocialLinkResponse) =>
            lastPage.pagination.hasNextPage
                ? lastPage.pagination.nextCursor ?? undefined
                : undefined,
        enabled: !!profileId,
    });
};

/**
 * Hook to add a social link to a profile's list
 */
export const useAddSocialLink = (profileId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ platform, url, label }: Omit<AddSocialLinkPayload, 'profileId'>) =>
            addSocialLink({ profileId, platform, url, label }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["social-links", profileId] });
        },
    });
};

/**
 * Hook to update a social link on a profile's list
 */
export const useUpdateSocialLink = (profileId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ linkId, platform, url, label }: Omit<UpdateSocialLinkPayload, 'profileId'>) =>
            updateSocialLink({ profileId, linkId, platform, url, label }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["social-links", profileId] });
        },
    });
};

/**
 * Hook to delete a social link from a profile's list
 * Performs optimistic removal so the UI updates instantly
 */
export const useDeleteSocialLink = (profileId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (linkId: string) =>
            deleteSocialLink({ profileId, linkId }),
        onMutate: async (linkId: string) => {
            // Cancel in-flight queries
            await queryClient.cancelQueries({ queryKey: ["social-links", profileId] });

            // Snapshot current data for rollback
            const previous = queryClient.getQueryData(["social-links", profileId]);

            // Optimistically remove the link from all pages
            queryClient.setQueryData(["social-links", profileId], (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: SocialLinkResponse) => ({
                        ...page,
                        data: page.data.filter((item) => item.id !== linkId),
                        pagination: {
                            ...page.pagination,
                            total: Math.max(0, page.pagination.total - 1),
                        },
                    })),
                };
            });

            return { previous };
        },
        onError: (_err, _linkId, context) => {
            // Roll back on error
            if (context?.previous) {
                queryClient.setQueryData(["social-links", profileId], context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["social-links", profileId] });
        },
    });
};
