/**
 * Workplace service
 * Endpoints:
 *   GET  /api/profiles/[id]/workplaces                 - List profile workplaces (paginated)
 *   POST /api/profiles/[id]/workplaces                 - Add a workplace (company_name, position, location, start_date, end_date, description)
 *   PUT  /api/profiles/[id]/workplaces/[workplaceId]   - Update a workplace (company_name, position, location, start_date, end_date, description)
 *   DELETE /api/profiles/[id]/workplaces/[workplaceId] - Remove a workplace
 */

import { Workplace } from "@/types/profileworplace";
import {
    useInfiniteQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { client } from "./client";

// ============================================================================
// Types
// ============================================================================

export interface WorkplaceResponse {
    data: Workplace[];
    pagination: {
        total: number;
        limit: number;
        hasNextPage: boolean;
        nextCursor: string | null;
    };
}

export interface AddWorkplacePayload {
    profileId: string;
    company_name: string;
    position: string;
    location: string;
    start_date: string;
    end_date?: string | null;
    description?: string | null;
}

export interface UpdateWorkplacePayload {
    profileId: string;
    workplaceId: string;
    company_name: string;
    position: string;
    location: string;
    start_date: string;
    end_date?: string | null;
    description?: string | null;
}

export interface DeleteWorkplacePayload {
    profileId: string;
    workplaceId: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch paginated workplaces for a profile
 */
export const getWorkplaces = async ({
    profileId,
    pageParam,
}: {
    profileId: string;
    pageParam?: string;
}): Promise<WorkplaceResponse> => {
    const params: Record<string, any> = { limit: 50 };
    if (pageParam) params.cursor = pageParam;

    const response = await client.get<WorkplaceResponse>(
        `/api/profiles/${profileId}/workplaces`,
        { params }
    );
    return response.data;
};

/**
 * Legacy function for backward compatibility
 */
export const getWorkplace = async (id: string) => {
    const response = await client.get(`/api/profiles/${id}/workplaces`);
    return response.data.data;
};

/**
 * Add a new workplace to a profile
 */
export const addWorkplace = async ({
    profileId,
    company_name,
    position,
    location,
    start_date,
    end_date,
    description,
}: AddWorkplacePayload): Promise<{ data: Workplace }> => {
    const response = await client.post<{ data: Workplace }>(
        `/api/profiles/${profileId}/workplaces`,
        { company_name, position, location, start_date, end_date, description }
    );
    return response.data;
};

/**
 * Update a workplace on a profile
 */
export const updateWorkplace = async ({
    profileId,
    workplaceId,
    company_name,
    position,
    location,
    start_date,
    end_date,
    description,
}: UpdateWorkplacePayload): Promise<{ data: Workplace }> => {
    const response = await client.put<{ data: Workplace }>(
        `/api/profiles/${profileId}/workplaces/${workplaceId}`,
        { company_name, position, location, start_date, end_date, description }
    );
    return response.data;
};

/**
 * Remove a workplace from a profile
 */
export const deleteWorkplace = async ({
    profileId,
    workplaceId,
}: DeleteWorkplacePayload): Promise<{ message: string }> => {
    const response = await client.delete<{ message: string }>(
        `/api/profiles/${profileId}/workplaces/${workplaceId}`
    );
    return response.data;
};

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook for fetching profile workplaces (infinite scroll)
 */
export const useInfiniteWorkplaces = (profileId: string) => {
    return useInfiniteQuery({
        queryKey: ["workplaces", profileId],
        queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
            getWorkplaces({ profileId, pageParam }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage: WorkplaceResponse) =>
            lastPage.pagination.hasNextPage
                ? lastPage.pagination.nextCursor ?? undefined
                : undefined,
        enabled: !!profileId,
    });
};

/**
 * Hook to add a workplace to a profile's list
 */
export const useAddWorkplace = (profileId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: Omit<AddWorkplacePayload, 'profileId'>) =>
            addWorkplace({ profileId, ...payload }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["workplaces", profileId] });
        },
    });
};

/**
 * Hook to update a workplace on a profile's list
 */
export const useUpdateWorkplace = (profileId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ workplaceId, ...payload }: Omit<UpdateWorkplacePayload, 'profileId'>) =>
            updateWorkplace({ profileId, workplaceId, ...payload }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["workplaces", profileId] });
        },
    });
};

/**
 * Hook to delete a workplace from a profile's list
 * Performs optimistic removal so the UI updates instantly
 */
export const useDeleteWorkplace = (profileId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (workplaceId: string) =>
            deleteWorkplace({ profileId, workplaceId }),
        onMutate: async (workplaceId: string) => {
            // Cancel in-flight queries
            await queryClient.cancelQueries({ queryKey: ["workplaces", profileId] });

            // Snapshot current data for rollback
            const previous = queryClient.getQueryData(["workplaces", profileId]);

            // Optimistically remove the workplace from all pages
            queryClient.setQueryData(["workplaces", profileId], (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: WorkplaceResponse) => ({
                        ...page,
                        data: page.data.filter((item) => item.id !== workplaceId),
                        pagination: {
                            ...page.pagination,
                            total: Math.max(0, page.pagination.total - 1),
                        },
                    })),
                };
            });

            return { previous };
        },
        onError: (_err, _workplaceId, context) => {
            // Roll back on error
            if (context?.previous) {
                queryClient.setQueryData(["workplaces", profileId], context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["workplaces", profileId] });
        },
    });
};