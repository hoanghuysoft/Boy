import type { CategoryItemsResponse } from "@/types/shows";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { showsClient } from "../client";
import { showsKeys } from "../queryKeys";

export const getCategoryItems = async (
    category: string,
    page: number = 1
): Promise<CategoryItemsResponse> => {
    const res = await showsClient.get("/category", {
        params: { category, page },
    });
    return res.data;
};

/**
 * Single-page category query (used for a specific page number).
 * Key: ['shows', 'category', slug, page]
 * staleTime: 5 min — matches server 300s SimpleCache TTL.
 */
export const useCategoryItemsQuery = (category?: string, page: number = 1) => {
    return useQuery({
        queryKey: showsKeys.categoryPage(category!, page),
        queryFn: () => getCategoryItems(category!, page),
        enabled: !!category,
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Infinite scroll category query.
 * Key: ['shows', 'category', slug] — shares the same root as useCategoryItemsQuery
 * so invalidating showsKeys.category(slug) clears both.
 */
export const useCategoryInfiniteQuery = (category?: string) => {
    return useInfiniteQuery({
        queryKey: showsKeys.category(category!),
        queryFn: ({ pageParam }) => getCategoryItems(category!, pageParam),
        getNextPageParam: (lastPage, allPages) => {
            const total = (lastPage as CategoryItemsResponse & { total_pages?: number }).total_pages ?? 1;
            const next = allPages.length + 1;
            return next <= total ? next : undefined;
        },
        initialPageParam: 1,
        enabled: !!category,
        staleTime: 5 * 60 * 1000,
    });
};
