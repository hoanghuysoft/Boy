import type { LatestVideosResponse } from "@/types/shows";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { showsClient } from "../client";
import { showsKeys } from "../queryKeys";

export const getLatestVideos = async (page: number = 1): Promise<LatestVideosResponse> => {
    const res = await showsClient.get("/latest", {
        params: { page },
    });
    return res.data;
};

/**
 * Single-page latest videos query.
 * Key: ['shows', 'latest', page]
 * staleTime: 5 min — matches server 300s SimpleCache TTL.
 */
export const useLatestVideosQuery = (page: number = 1) => {
    return useQuery({
        queryKey: showsKeys.latestPage(page),
        queryFn: () => getLatestVideos(page),
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Infinite scroll latest videos query.
 * Key: ['shows', 'latest'] — shares root with useLatestVideosQuery.
 */
export const useLatestInfiniteQuery = (enabled: boolean = true) => {
    return useInfiniteQuery({
        queryKey: showsKeys.latest(),
        queryFn: ({ pageParam }) => getLatestVideos(pageParam),
        getNextPageParam: (lastPage, allPages) => {
            const total = (lastPage as LatestVideosResponse & { total_pages?: number }).total_pages ?? 1;
            const next = allPages.length + 1;
            return next <= total ? next : undefined;
        },
        initialPageParam: 1,
        enabled,
        staleTime: 5 * 60 * 1000,
    });
};
