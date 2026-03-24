import type { CategoryItemsResponse } from "@/types/shows";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { showsClient } from "../client";

export const getCategoryItems = async (
    category: string,
    page: number = 1
): Promise<CategoryItemsResponse> => {
    const res = await showsClient.get("/category", {
        params: {
            category,
            page,
        },
    });
    return res.data;
};

export const useCategoryItemsQuery = (category?: string, page: number = 1) => {
    return useQuery({
        queryKey: ["shows_category", category, page],
        queryFn: () => getCategoryItems(category!, page),
        enabled: !!category,
    });
};

export const useCategoryInfiniteQuery = (category?: string) => {
    return useInfiniteQuery({
        queryKey: ["shows_category_inf", category],
        queryFn: ({ pageParam }) => getCategoryItems(category!, pageParam as number),
        getNextPageParam: (lastPage, allPages) => {
            const total = (lastPage as any).total_pages ?? 1;
            const next = allPages.length + 1;
            return next <= total ? next : undefined;
        },
        initialPageParam: 1,
        enabled: !!category,
    });
};

