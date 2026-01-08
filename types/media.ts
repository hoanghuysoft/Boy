export type MediaType = 'photo' | 'video';

export interface Media {
    id: string;
    profile_id: string;
    type: MediaType;
    url: string;
    thumbnail_url: string | null;
    caption: string | null;
    created_at: string;
    updated_at: string;
}