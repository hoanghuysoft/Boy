import { ProfileAddress } from "@/types/profileaddress";
import { useInfiniteQuery } from "@tanstack/react-query";
import { client } from "./client";

export interface AddressResponse {
    data: ProfileAddress[];
    pagination: {
        total: number;
        limit: number;
        hasNextPage: boolean;
        nextCursor: string | null;
    };
}

export const getAddresses = async ({
    profileId,
    pageParam
}: {
    profileId: string;
    pageParam?: string;
}): Promise<AddressResponse> => {
    const params: Record<string, any> = { limit: 50 };
    if (pageParam) params.cursor = pageParam;

    const response = await client.get<AddressResponse>(`/api/profiles/${profileId}/addresses`, { params });
    return response.data;
};

export const useInfiniteAddresses = (profileId: string) => {
    return useInfiniteQuery({
        queryKey: ["addresses", profileId],
        queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
            getAddresses({ profileId, pageParam }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage: AddressResponse) =>
            lastPage.pagination.hasNextPage ? lastPage.pagination.nextCursor : undefined,
        enabled: !!profileId,
    });
};
