import type { HealthResponse } from "@/types/shows";
import { useQuery } from "@tanstack/react-query";
import { showsClient } from "../client";

export const getShowsHealth = async (): Promise<HealthResponse> => {
    const res = await showsClient.get("/");
    return res.data;
};

export const useShowsHealthQuery = () => {
    return useQuery({
        queryKey: ["shows_health"],
        queryFn: () => getShowsHealth(),
    });
};

