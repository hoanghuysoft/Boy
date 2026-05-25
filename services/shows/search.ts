import type { SearchItemsResponse } from "@/types/shows";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { showsClient } from "../client";
import { showsKeys } from "../queryKeys";

export const getSearchItems = async (
    query: string,
    page: number = 1
): Promise<SearchItemsResponse> => {
    const res = await showsClient.get("/search", {
        params: { q: query, page },
    });
    return res.data;
};

/**
 * Single-page search query.
 * Key: ['shows', 'search', query, page]
 * staleTime: 5 min — matches server 300s SimpleCache TTL.
 */
export const useSearchItemsQuery = (query?: string, page: number = 1) => {
    return useQuery({
        queryKey: showsKeys.searchPage(query!, page),
        queryFn: () => getSearchItems(query!, page),
        enabled: !!query,
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Infinite scroll search query.
 * Key: ['shows', 'search', query] — shares root with useSearchItemsQuery.
 */
export const useSearchInfiniteQuery = (query?: string) => {
    return useInfiniteQuery({
        queryKey: showsKeys.search(query!),
        queryFn: ({ pageParam }) => getSearchItems(query!, pageParam),
        getNextPageParam: (lastPage, allPages) => {
            const total = (lastPage as SearchItemsResponse & { total_pages?: number }).total_pages ?? 1;
            const next = allPages.length + 1;
            return next <= total ? next : undefined;
        },
        initialPageParam: 1,
        enabled: !!query,
        staleTime: 5 * 60 * 1000,
    });
};
