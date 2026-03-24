import type { CategoriesResponse } from "@/types/shows";
import { useQuery } from "@tanstack/react-query";
import { showsClient } from "../client";

export const getCategories = async (): Promise<CategoriesResponse> => {
    const res = await showsClient.get("/categories");
    return res.data;
};

export const useCategoriesQuery = () => {
    return useQuery({
        queryKey: ["shows_categories"],
        queryFn: () => getCategories(),
    });
};

