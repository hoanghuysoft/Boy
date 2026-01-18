import { CarouselItem } from "@/types/carousel";
import { useQuery } from "@tanstack/react-query";
import { client } from "./client";

export const useCarouselQuery = () => {
    return useQuery({
        queryKey: ["carousel"],
        queryFn: () => getCarouselData(),
    });
};

export const getCarouselData = async (): Promise<CarouselItem[]> => {
    const res = await client.get(`/api/carousel`);
    return res.data.data;
}