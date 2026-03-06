// ─────────────────────────────────────────────────────────────────────────────
// Local Facebook Data Types
// Generated from sample JSON files in /sample
// ─────────────────────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────
// Shared / Primitive
// ──────────────────────────────────────────────

/** Unix timestamp in milliseconds */
type Timestamp = number;

// ──────────────────────────────────────────────
// Highlight (Highlight.json)
// ──────────────────────────────────────────────

export interface FBHighlight {
    id: string;
    title: string;
    thumbnail: string;
    count: number;
    cursor: string;
}

export type FBHighlightList = FBHighlight[];

// ──────────────────────────────────────────────
// Photo (Photos.json)
// ──────────────────────────────────────────────

export type FBPhotoType = 'photos_by' | 'photos_of' | string;

export interface FBPhoto {
    id: string;
    url: string;
    thumbnail: string;
    image: string;
    width: number;
    height: number;
    accessibility_caption: string;
    cursor: string;
    photo_type: FBPhotoType;
}

export type FBPhotoList = FBPhoto[];

// ──────────────────────────────────────────────
// Video (Videos.json)
// ──────────────────────────────────────────────

export interface FBReaction {
    id: string;
    name: string;
    count: number;
}

export interface FBVideoStatistics {
    play_count: number;
    reaction_count: number;
    top_reactions: FBReaction[];
}

export interface FBVideo {
    id: string;
    /** 0 = not recent, positive integer = recency rank */
    recent: number;
    created_time: Timestamp;
    description: string;
    /** Duration in seconds */
    length: number;
    url: string;
    picture: string;
    cursor: string;
    post_id: string;
    statistics: FBVideoStatistics;
}

export type FBVideoList = FBVideo[];

// ──────────────────────────────────────────────
// Post (posts.json)
// ──────────────────────────────────────────────

export interface FBActor {
    id: string;
    url: string;
    name: string;
    avatar: string;
}

export interface FBPrivacy {
    scope: 'EVERYONE' | 'FRIENDS' | 'FRIENDS_OF_FRIENDS' | 'SELF' | string;
    description: string;
}

export type FBAttachmentType =
    | 'Photo'
    | 'Video'
    | 'GenericAttachmentMedia'
    | string;

export interface FBAttachment {
    id: string;
    type: FBAttachmentType;
    thumbnail: string;
    /** Present when attachment is a video */
    title?: string;
    /** Present when attachment belongs to an album */
    total_count?: number;
}

export interface FBPostContent {
    /** Raw text body of the post */
    text?: string;
    attachments: FBAttachment[];
}

export interface FBPostReactions {
    total: number;
    top: FBReaction[];
}

export interface FBPost {
    id: string;
    post_id: string;
    story_id: string;
    url: string;
    /** Short user-written caption (may differ from content.text) */
    message?: string;
    /** System-generated title (e.g. "John is in Hanoi.") */
    title?: string;
    /** System-generated summary */
    summary?: string;
    creation_time: Timestamp;
    can_delete: boolean;
    actor: FBActor;
    privacy: FBPrivacy;
    content: FBPostContent;
    is_pinned?: boolean;
    /** null when this is the first/only page */
    cursor: string | null;
    /** 0 = not recent, positive integer = recency rank */
    recent: number;
    reactions: FBPostReactions;
}

export type FBPostList = FBPost[];

// ──────────────────────────────────────────────
// Joined Group (joined_groups.json)
// ──────────────────────────────────────────────

export type FBGroupVisibility = 'OPEN' | 'CLOSED' | 'SECRET' | string;

export interface FBGroup {
    id: string;
    name: string;
    description?: string;
    url: string;
    visibility: FBGroupVisibility;
    image: string;
    membersCount: number;
    cursor: string;
    /** 0 = not recent, positive integer = recency rank */
    recent: number;
    /** Unix timestamp (ms). 0 means unknown/unavailable */
    addedTime: Timestamp;
    signals: unknown[];
    recentActivity: unknown[];
}

export type FBGroupList = FBGroup[];
