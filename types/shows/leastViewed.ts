// Least Viewed Videos endpoint (`GET /least-viewed?page=<n>`)

import type { VideoCard } from "./videoCard";

export interface LeastViewedVideosResponse {
    page: number;
    total_pages: number;
    items: VideoCard[];
}
