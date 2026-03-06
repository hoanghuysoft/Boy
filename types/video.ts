export interface VideoItem {
    id: string;
    profile_id: string;
    profile_name: string;
    profile_avatar: string | null;
    media_url: string;
    media_type: string;
    thumbnail_url: string | null;
    caption: string | null;
    created_at: string;
}

export type VideoFeedType = 'random' | 'on_this_day';

export interface VideoFeedResponse {
    data: VideoItem[];
}
