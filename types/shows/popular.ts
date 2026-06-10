// Popular Videos endpoint (`GET /popular?page=<n>`)

import type { VideoCard } from "./videoCard";

export interface PopularVideosResponse {
    page: number;
    total_pages: number;
    items: VideoCard[];
}
