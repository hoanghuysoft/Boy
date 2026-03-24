// Categories endpoint (`GET /categories`) and category page (`GET /category`)

import type { VideoCard } from "./videoCard";

export interface Category {
    name: string;
    url: string;
}

export interface CategoriesResponse {
    categories: Category[];
}

export interface CategoryItemsResponse {
    category: string;
    page: number;
    total_pages: number;
    items: VideoCard[];
}

