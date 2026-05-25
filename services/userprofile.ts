import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "./client";

import { Profile } from "@/types/profile";

export interface ProfilesResponse {
    data: Profile[];
    pagination: {
        total: number;
        totalMatches: number;
        limit: number;
        hasNextPage: boolean;
        nextCursor: string | null;
    };
    search?: {
        query: string;
        matchedField: string;
    };
}

export const getProfiles = async ({ pageParam, search }: { pageParam?: string; search?: string }) => {
    const params: Record<string, any> = { limit: 20 };
    if (pageParam) params.cursor = pageParam;
    if (search) params.search = search;

    const response = await client.get<ProfilesResponse>("/api/profiles", { params });
    return response.data;
};

export const useInfiniteProfiles = (search: string = "", enabled: boolean = true) => {
    return useInfiniteQuery({
        queryKey: ["profiles", search],
        queryFn: ({ pageParam }: { pageParam: string | undefined }) => getProfiles({ pageParam, search }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage: ProfilesResponse) => lastPage.pagination.hasNextPage ? lastPage.pagination.nextCursor : undefined,
        enabled,
    });
};

export const getProfileDetail = async (id: string) => {
    const response = await client.get(`/api/profiles/${id}`);
    return response.data.data;
}

export const getMyProfileDetail = async () => {
    const response = await client.get("/api/profiles/me");
    return response.data.data;
}

export const useProfile = (id: string, isMe: boolean) => {
    return useQuery({
        queryKey: isMe ? ['profile', 'me'] : ['profile', id],
        queryFn: () => (isMe ? getMyProfileDetail() : getProfileDetail(id)),
        enabled: isMe || !!id,
    });
};

export const checkAdmin = async () => {
    const response = await client.get("/api/admin/check");
    return response.data;
}

export const useAdminCheck = () => {
    return useQuery({
        queryKey: ['admin-check'],
        queryFn: checkAdmin,
        retry: false,
    });
};

export const updateProfile = async (id: string, data: any) => {
    const response = await client.put(`/api/profiles/${id}`, data);
    return response.data;
};

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updateProfile(id, data),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['profile', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
        }
    });
};
