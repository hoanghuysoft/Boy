// Hero slider endpoint (`GET /slider_items`)

export interface HeroSliderItem {
    active: boolean;
    category: string;
    title: string;
    description: string;
    video_url: string;
    background_image: string;
}

export interface HeroSliderResponse {
    slider_items: HeroSliderItem[];
}

