import { ProfileLink } from "@/types/profilelink";
import { useInfiniteQuery } from "@tanstack/react-query";
import { client } from "./client";

export interface SocialLinkResponse {
    data: ProfileLink[];
    pagination: {
        total: number;
        limit: number;
        hasNextPage: boolean;
        nextCursor: string | null;
    };
}

export const getSocialLinks = async ({
    profileId,
    pageParam
}: {
    profileId: string;
    pageParam?: string;
}): Promise<SocialLinkResponse> => {
    const params: Record<string, any> = { limit: 50 };
    if (pageParam) params.cursor = pageParam;

    const response = await client.get<SocialLinkResponse>(`/api/profiles/${profileId}/social-links`, { params });
    return response.data;
};

export const useInfiniteSocialLinks = (profileId: string) => {
    return useInfiniteQuery({
        queryKey: ["social-links", profileId],
        queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
            getSocialLinks({ profileId, pageParam }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage: SocialLinkResponse) =>
            lastPage.pagination.hasNextPage ? lastPage.pagination.nextCursor : undefined,
        enabled: !!profileId,
    });
};
