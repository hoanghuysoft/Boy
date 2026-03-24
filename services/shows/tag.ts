import type { TagItemsResponse } from "@/types/shows";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { showsClient } from "../client";

export const getTagItems = async (tag: string, page: number = 1): Promise<TagItemsResponse> => {
    const res = await showsClient.get("/tag", {
        params: {
            tag,
            page,
        },
    });
    return res.data;
};

export const useTagItemsQuery = (tag?: string, page: number = 1) => {
    return useQuery({
        queryKey: ["shows_tag", tag, page],
        queryFn: () => getTagItems(tag!, page),
        enabled: !!tag,
    });
};

export const useTagInfiniteQuery = (tag?: string) => {
    return useInfiniteQuery({
        queryKey: ["shows_tag_inf", tag],
        queryFn: ({ pageParam }) => getTagItems(tag!, pageParam as number),
        getNextPageParam: (lastPage, allPages) => {
            const total = (lastPage as any).total_pages ?? 1;
            const next = allPages.length + 1;
            return next <= total ? next : undefined;
        },
        initialPageParam: 1,
        enabled: !!tag,
    });
};

