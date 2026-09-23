export type FeedMode = 'latest' | 'lucky' | 'this_day';

export interface PostResponse {
    data: Post[]
    pagination: Pagination
}

export interface CaptionPart {
    type: 'text' | 'tag' | 'mention' | 'link';
    text: string;
}

export interface Post {
    id: string
    profile_id: string
    created_at: string
    content: string
    clean_content?: string
    caption_parts?: CaptionPart[]
    youtube_ids?: string[]
    lang?: string | null
    is_owner?: boolean
    can_delete?: boolean
    is_repost?: boolean
    display_media?: Media[]
    display_music?: Music | null
    display_links?: Link[]
    display_audio_url?: string | null
    display_device?: string | null
    has_video?: boolean
    has_media?: boolean
    has_music?: boolean
    location: any
    device: string
    deezer_id: string
    audio_url: string
    links: Link[]
    is_ghost: boolean
    is_adult: boolean
    is_liked: boolean
    is_bookmarked: boolean
    bookmark_count?: number
    profile_name: string
    profile_avatar: string
    profile_is_verified: boolean
    media: Media[]
    like_count: number
    comment_count: number
    view_count: number
    share_count: number
    repost_count?: number
    is_reposted?: boolean
    music: Music
    reposted_post?: any
}

export interface Link {
    url: string
    label: string
}

export interface Media {
    id: string
    type: string
    url: string
    thumbnail_url: any
    caption: string
    backup1: string | null;
    blurhash: string | 'LGF5?xYk^6#M@-5c,1J5@[or[Q6.';
}

export interface Music {
    title: string
    artist: string
    album: string
    cover: string
    cover_url: string
    preview_url: string
    url: string
}

export interface Pagination {
    total: number
    limit: number
    hasMore: boolean
    hasNextPage: boolean
    nextCursor: string | null
}
