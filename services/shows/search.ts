import type { SearchItemsResponse } from "@/types/shows";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { showsClient } from "../client";

export const getSearchItems = async (
    query: string,
    page: number = 1
): Promise<SearchItemsResponse> => {
    const res = await showsClient.get("/search", {
        params: {
            q: query,
            page,
        },
    });
    return res.data;
};

export const useSearchItemsQuery = (query?: string, page: number = 1) => {
    return useQuery({
        queryKey: ["shows_search", query, page],
        queryFn: () => getSearchItems(query!, page),
        enabled: !!query,
    });
};

export const useSearchInfiniteQuery = (query?: string) => {
    return useInfiniteQuery({
        queryKey: ["shows_search_inf", query],
        queryFn: ({ pageParam }) => getSearchItems(query!, pageParam as number),
        getNextPageParam: (lastPage, allPages) => {
            const total = (lastPage as any).total_pages ?? 1;
            const next = allPages.length + 1;
            return next <= total ? next : undefined;
        },
        initialPageParam: 1,
        enabled: !!query,
    });
};

