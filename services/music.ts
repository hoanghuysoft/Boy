import { ProfileMusic } from "@/types/profilemusic";
import { useInfiniteQuery } from "@tanstack/react-query";
import { client } from "./client";

export interface MusicResponse {
    data: ProfileMusic[];
    pagination: {
        total: number;
        limit: number;
        hasNextPage: boolean;
        nextCursor: string | null;
    };
}

export const getMusic = async ({
    profileId,
    pageParam
}: {
    profileId: string;
    pageParam?: string;
}): Promise<MusicResponse> => {
    const params: Record<string, any> = { limit: 50 };
    if (pageParam) params.cursor = pageParam;

    const response = await client.get<MusicResponse>(`/api/profiles/${profileId}/music`, { params });
    return response.data;
};

export const useInfiniteMusic = (profileId: string) => {
    return useInfiniteQuery({
        queryKey: ["music", profileId],
        queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
            getMusic({ profileId, pageParam }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage: MusicResponse) =>
            lastPage.pagination.hasNextPage ? lastPage.pagination.nextCursor : undefined,
        enabled: !!profileId,
    });
};