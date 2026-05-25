import type { CategoriesResponse } from "@/types/shows";
import { useQuery } from "@tanstack/react-query";
import { showsClient } from "../client";
import { showsKeys } from "../queryKeys";

export const getCategories = async (): Promise<CategoriesResponse> => {
    const res = await showsClient.get("/categories");
    return res.data;
};

/**
 * Category list shown in the header bar.
 * staleTime: 5 min — categories rarely change.
 */
export const useCategoriesQuery = () => {
    return useQuery({
        queryKey: showsKeys.categories(),
        queryFn: () => getCategories(),
        staleTime: 5 * 60 * 1000,
    });
};
