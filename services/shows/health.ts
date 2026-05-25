import type { HealthResponse } from "@/types/shows";
import { useQuery } from "@tanstack/react-query";
import { showsClient } from "../client";
import { showsKeys } from "../queryKeys";

export const getShowsHealth = async (): Promise<HealthResponse> => {
    const res = await showsClient.get("/");
    return res.data;
};

/**
 * Health check — used to determine if the crawler server is reachable.
 * staleTime: 30s — want reasonably fresh connectivity status.
 */
export const useShowsHealthQuery = () => {
    return useQuery({
        queryKey: showsKeys.health(),
        queryFn: () => getShowsHealth(),
        staleTime: 30 * 1000,
        retry: 1,
    });
};
