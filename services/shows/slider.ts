import type { HeroSliderResponse } from "@/types/shows";
import { useQuery } from "@tanstack/react-query";
import { showsClient } from "../client";
import { showsKeys } from "../queryKeys";

export const getSlider = async (): Promise<HeroSliderResponse> => {
    const res = await showsClient.get("/slider_items");
    return res.data;
};

/**
 * Hero slider items on the home screen.
 * staleTime: 5 min — matches the server's 300s SimpleCache TTL.
 */
export const useSliderQuery = (enabled: boolean = true) => {
    return useQuery({
        queryKey: showsKeys.slider(),
        queryFn: () => getSlider(),
        enabled,
        staleTime: 5 * 60 * 1000,
    });
};