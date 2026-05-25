import type { TagItemsResponse } from "@/types/shows";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { showsClient } from "../client";
import { showsKeys } from "../queryKeys";

export const getTagItems = async (tag: string, page: number = 1): Promise<TagItemsResponse> => {
    const res = await showsClient.get("/tag", {
        params: { tag, page },
    });
    return res.data;
};

/**
 * Single-page tag query.
 * Key: ['shows', 'tag', tag, page]
 * staleTime: 5 min — matches server 300s SimpleCache TTL.
 */
export const useTagItemsQuery = (tag?: string, page: number = 1) => {
    return useQuery({
        queryKey: showsKeys.tagPage(tag!, page),
        queryFn: () => getTagItems(tag!, page),
        enabled: !!tag,
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Infinite scroll tag query.
 * Key: ['shows', 'tag', tag] — shares root with useTagItemsQuery.
 */
export const useTagInfiniteQuery = (tag?: string) => {
    return useInfiniteQuery({
        queryKey: showsKeys.tag(tag!),
        queryFn: ({ pageParam }) => getTagItems(tag!, pageParam),
        getNextPageParam: (lastPage, allPages) => {
            const total = (lastPage as TagItemsResponse & { total_pages?: number }).total_pages ?? 1;
            const next = allPages.length + 1;
            return next <= total ? next : undefined;
        },
        initialPageParam: 1,
        enabled: !!tag,
        staleTime: 5 * 60 * 1000,
    });
};
