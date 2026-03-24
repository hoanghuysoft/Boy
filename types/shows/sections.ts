// Sections endpoint (`GET /sections`)

import type { VideoCard } from "./videoCard";

export interface ShowSection {
    heading: string;
    more_url: string;
    items: VideoCard[];
}

export interface SectionsResponse {
    sections: ShowSection[];
}

