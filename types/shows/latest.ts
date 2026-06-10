// Latest Videos endpoint (`GET /latest?page=<n>`)

import type { VideoCard } from "./videoCard";

export interface LatestVideosResponse {
    page: number;
    total_pages: number;
    items: VideoCard[];
}
