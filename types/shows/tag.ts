// Tag endpoint (`GET /tag?tag=<tag>&page=<n>`)

import type { VideoCard } from "./videoCard";

export interface TagItemsResponse {
    tag: string;
    page: number;
    total_pages: number;
    items: VideoCard[];
}

