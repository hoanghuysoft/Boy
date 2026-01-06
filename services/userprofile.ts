import { useQuery } from "@tanstack/react-query";
import { client } from "./client";

export const getAllProfiles = async () => {
    const response = await client.get("/api/profiles");
    return response.data.data;
}

export const useAllProfiles = () => {
    return useQuery({
        queryKey: ["all-profiles"],
        queryFn: getAllProfiles,
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
