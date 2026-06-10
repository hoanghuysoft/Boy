import type { LeastViewedVideosResponse } from "@/types/shows";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { showsClient } from "../client";
import { showsKeys } from "../queryKeys";

export const getLeastViewedVideos = async (page: number = 1): Promise<LeastViewedVideosResponse> => {
    const res = await showsClient.get("/least-viewed", {
        params: { page },
    });
    return res.data;
};

/**
 * Single-page least viewed videos query.
 * Key: ['shows', 'leastViewed', page]
 * staleTime: 5 min — matches server 300s SimpleCache TTL.
 */
export const useLeastViewedVideosQuery = (page: number = 1) => {
    return useQuery({
        queryKey: showsKeys.leastViewedPage(page),
        queryFn: () => getLeastViewedVideos(page),
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Infinite scroll least viewed videos query.
 * Key: ['shows', 'leastViewed'] — shares root with useLeastViewedVideosQuery.
 */
export const useLeastViewedInfiniteQuery = (enabled: boolean = true) => {
    return useInfiniteQuery({
        queryKey: showsKeys.leastViewed(),
        queryFn: ({ pageParam }) => getLeastViewedVideos(pageParam),
        getNextPageParam: (lastPage, allPages) => {
            const total = (lastPage as LeastViewedVideosResponse & { total_pages?: number }).total_pages ?? 1;
            const next = allPages.length + 1;
            return next <= total ? next : undefined;
        },
        initialPageParam: 1,
        enabled,
        staleTime: 5 * 60 * 1000,
    });
};
