import type { SectionsResponse } from "@/types/shows";
import { useQuery } from "@tanstack/react-query";
import { showsClient } from "../client";

export const getSections = async (): Promise<SectionsResponse> => {
    const res = await showsClient.get("/sections");
    return res.data;
}

export const useSectionsQuery = () => {
    return useQuery({
        queryKey: ["shows_sections"],
        queryFn: () => getSections(),
    })
}