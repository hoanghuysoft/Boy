// Video details endpoint (`GET /video_detail`)

import type { VideoCard } from "./videoCard";

export interface VideoDetail {
    title: string;
    views: string;
    duration: string;
    uploaded: string;
    category: string;
    category_url: string;
    description: string;
    tags: string[];
    tag_urls: string[];
    poster_url: string;
    stream_url: string;
    download_url: string;
    extra_images: string[];
    episodes: { episode: number; url: string }[];
}

export interface VideoDetailResponse {
    video_detail: VideoDetail;
    related_videos: VideoCard[];
}

