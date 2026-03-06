import { VideoFeedResponse, VideoFeedType } from "@/types/video";
import { useQuery } from "@tanstack/react-query";
import { client } from "./client";

/**
 * Fetch video feed from the server.
 * Uses offset-based pagination (not cursor-based like posts feed).
 */
export const getVideoFeed = async ({
    type = 'random',
    limit = 20,
    offset = 0,
}: {
    type?: VideoFeedType;
    limit?: number;
    offset?: number;
}): Promise<VideoFeedResponse> => {
    const response = await client.get<VideoFeedResponse>("/api/videos", {
        params: { type, limit, offset },
    });
    return response.data;
};

/**
 * React Query hook for fetching video feed.
 * Uses a simple query (not infinite) since Shots uses a flat list with preloading.
 * Fetch a larger batch upfront and prefetch ahead.
 */
export const useVideoFeed = (type: VideoFeedType = 'random', limit: number = 30) => {
    return useQuery({
        queryKey: ["videoFeed", type],
        queryFn: () => getVideoFeed({ type, limit }),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};
