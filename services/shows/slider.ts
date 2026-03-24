import type { HeroSliderResponse } from "@/types/shows";
import { useQuery } from "@tanstack/react-query";
import { showsClient } from "../client";

export const getSlider = async (): Promise<HeroSliderResponse> => {
    const res = await showsClient.get("/slider_items");
    return res.data;
}

export const useSliderQuery = () => {
    return useQuery({
        queryKey: ["shows_slider"],
        queryFn: () => getSlider(),
    })
}