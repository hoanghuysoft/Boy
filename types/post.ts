export interface Post {
    id: string;
    profile_id: string;
    profile_name: string;
    profile_avatar: string;
    media_url: string;
    media_type: string;
    thumbnail_url: string | null;
    caption: string;
    created_at: string;
}