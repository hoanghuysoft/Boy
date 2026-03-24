// Search endpoint (`GET /search?q=<query>&page=<n>`)

import type { VideoCard } from "./videoCard";

export interface SearchItemsResponse {
    q: string;
    page: number;
    total_pages: number;
    items: VideoCard[];
}

