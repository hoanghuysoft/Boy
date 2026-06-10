import type { PopularVideosResponse } from "@/types/shows";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { showsClient } from "../client";
import { showsKeys } from "../queryKeys";

export const getPopularVideos = async (page: number = 1): Promise<PopularVideosResponse> => {
    const res = await showsClient.get("/popular", {
        params: { page },
    });
    return res.data;
};

/**
 * Single-page popular videos query.
 * Key: ['shows', 'popular', page]
 * staleTime: 5 min — matches server 300s SimpleCache TTL.
 */
export const usePopularVideosQuery = (page: number = 1) => {
    return useQuery({
        queryKey: showsKeys.popularPage(page),
        queryFn: () => getPopularVideos(page),
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Infinite scroll popular videos query.
 * Key: ['shows', 'popular'] — shares root with usePopularVideosQuery.
 */
export const usePopularInfiniteQuery = (enabled: boolean = true) => {
    return useInfiniteQuery({
        queryKey: showsKeys.popular(),
        queryFn: ({ pageParam }) => getPopularVideos(pageParam),
        getNextPageParam: (lastPage, allPages) => {
            const total = (lastPage as PopularVideosResponse & { total_pages?: number }).total_pages ?? 1;
            const next = allPages.length + 1;
            return next <= total ? next : undefined;
        },
        initialPageParam: 1,
        enabled,
        staleTime: 5 * 60 * 1000,
    });
};
