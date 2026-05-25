import type { VideoDetailResponse } from "@/types/shows";
import { useQuery } from "@tanstack/react-query";
import { showsClient } from "../client";
import { showsKeys } from "../queryKeys";

export const getVideoDetail = async (videoUrlOrSlug: string): Promise<VideoDetailResponse> => {
    const res = await showsClient.get("/video_detail", {
        params: {
            video_url: videoUrlOrSlug,
        },
    });
    return res.data;
};

/**
 * Video detail + related videos.
 * staleTime: 5 min — video metadata doesn't change frequently and
 * the server caches it for 300s anyway.
 */
export const useVideoDetailQuery = (videoUrlOrSlug?: string) => {
    return useQuery({
        queryKey: showsKeys.videoDetail(videoUrlOrSlug!),
        queryFn: () => getVideoDetail(videoUrlOrSlug!),
        enabled: !!videoUrlOrSlug,
        staleTime: 5 * 60 * 1000,
    });
};
