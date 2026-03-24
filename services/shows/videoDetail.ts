import type { VideoDetailResponse } from "@/types/shows";
import { useQuery } from "@tanstack/react-query";
import { showsClient } from "../client";

export const getVideoDetail = async (videoUrlOrSlug: string): Promise<VideoDetailResponse> => {
    const res = await showsClient.get("/video_detail", {
        params: {
            video_url: videoUrlOrSlug,
        },
    });
    return res.data;
};

export const useVideoDetailQuery = (videoUrlOrSlug?: string) => {
    return useQuery({
        queryKey: ["shows_video_detail", videoUrlOrSlug],
        queryFn: () => getVideoDetail(videoUrlOrSlug!),
        enabled: !!videoUrlOrSlug,
    });
};

