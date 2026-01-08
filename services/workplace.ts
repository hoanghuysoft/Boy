import { Workplace } from "@/types/profileworplace";
import { useInfiniteQuery } from "@tanstack/react-query";
import { client } from "./client";

export interface WorkplaceResponse {
    data: Workplace[];
    pagination: {
        total: number;
        limit: number;
        hasNextPage: boolean;
        nextCursor: string | null;
    };
}

export const getWorkplaces = async ({
    profileId,
    pageParam
}: {
    profileId: string;
    pageParam?: string;
}): Promise<WorkplaceResponse> => {
    const params: Record<string, any> = { limit: 50 };
    if (pageParam) params.cursor = pageParam;

    const response = await client.get<WorkplaceResponse>(`/api/profiles/${profileId}/workplaces`, { params });
    return response.data;
};

// Legacy function for backward compatibility
export const getWorkplace = async (id: string) => {
    const response = await client.get(`/api/profiles/${id}/workplaces`);
    return response.data.data;
};

export const useInfiniteWorkplaces = (profileId: string) => {
    return useInfiniteQuery({
        queryKey: ["workplaces", profileId],
        queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
            getWorkplaces({ profileId, pageParam }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage: WorkplaceResponse) =>
            lastPage.pagination.hasNextPage ? lastPage.pagination.nextCursor : undefined,
        enabled: !!profileId,
    });
};