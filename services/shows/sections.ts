import type { SectionsResponse } from "@/types/shows";
import { useQuery } from "@tanstack/react-query";
import { showsClient } from "../client";
import { showsKeys } from "../queryKeys";

export const getSections = async (): Promise<SectionsResponse> => {
    const res = await showsClient.get("/sections");
    return res.data;
};

/**
 * Home-screen sections (Latest / Most Viewed / Least Viewed).
 * staleTime: 5 min — matches the server's 300s SimpleCache TTL.
 */
export const useSectionsQuery = (enabled: boolean = true) => {
    return useQuery({
        queryKey: showsKeys.sections(),
        queryFn: () => getSections(),
        enabled,
        staleTime: 5 * 60 * 1000,
    });
};