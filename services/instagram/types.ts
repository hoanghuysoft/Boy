/**
 * Instagram API Types & Interfaces
 * Powered by Social AIO (FB AIO Relay API)
 *
 * APIs covered:
 * 1. get_ig_user_info - Get Instagram user profile info
 * 2. get_list_ig_user_stories - Get Instagram user stories
 * 3. get_list_ig_post - Get Instagram user posts (paginated)
 * 4. get_list_ig_user_reels - Get Instagram user reels (paginated)
 */

// ============================================================================
// Social AIO Relay Core Types
// ============================================================================

export interface SocialAioCallPayload<P = Record<string, any>> {
  id: string; // CLIENT_ID from Social AIO / FB AIO extension
  apiname: string; // e.g. 'get_ig_user_info', 'get_list_ig_user_stories', 'get_list_ig_post'
  apiparams: P;
}

export interface SocialAioRelayResponse<T = any> {
  error?: number;
  message?: string;
  code?: number;
  data?: T;
  [key: string]: any;
}

export interface InstagramBaseRequestOptions {
  clientId?: string;
  skipCache?: boolean;
  ttlMs?: number;
}

// ============================================================================
// 1. Instagram User Profile
// ============================================================================

export interface InstagramUserInfoParams extends InstagramBaseRequestOptions {
  /** The URL or Username of Instagram user (e.g. 'instagram' or 'https://instagram.com/username') */
  url: string;
  /** Return raw data from Instagram directly */
  raw?: boolean;
}

export interface InstagramUserMediaStats {
  postsCount?: number;
  followersCount?: number;
  followingCount?: number;
}

export interface InstagramUser {
  id: string;
  uid?: string | number;
  pk?: string | number;
  username: string;
  name?: string;
  fullName?: string;
  full_name?: string;
  avatar?: string;
  avatar_big?: string;
  biography?: string;
  externalUrl?: string;
  url?: string;
  profilePicUrl?: string;
  profilePicUrlHd?: string;
  isPrivate?: boolean;
  isVerified?: boolean;
  isBusiness?: boolean;
  category?: string;
  type?: string;
  postsCount?: number;
  followersCount?: number;
  followingCount?: number;
  highlightCount?: number;
  raw?: any;
  [key: string]: any;
}

export interface InstagramUserInfoResponse {
  info?: InstagramUser | any;
  result?: InstagramUser | any;
  [key: string]: any;
}

// ============================================================================
// 2. Instagram User Stories
// ============================================================================

export interface InstagramStoryParams extends InstagramBaseRequestOptions {
  /** The URL or Username of Instagram user */
  url: string;
  /** Return raw data from Instagram directly */
  raw?: boolean;
}

export interface InstagramStoryMediaResource {
  url: string;
  width?: number;
  height?: number;
}

export interface InstagramStoryItem {
  id: string;
  pk?: string | number;
  mediaType: 'image' | 'video' | number;
  displayUrl: string;
  videoUrl?: string;
  takenAt: number | string;
  expiringAt?: number | string;
  caption?: string | null;
  hasAudio?: boolean;
  videoDuration?: number;
  storyCtaUrl?: string;
  user?: {
    id: string;
    username: string;
    profilePicUrl?: string;
  };
  raw?: any;
  [key: string]: any;
}

export interface InstagramStoryResponse {
  stories?: InstagramStoryItem[] | any[];
  result?: InstagramStoryItem[] | any[];
  [key: string]: any;
}

// ============================================================================
// 3. Instagram User Posts (Paginated)
// ============================================================================

export interface InstagramPostParams extends InstagramBaseRequestOptions {
  /** The URL or Username of Instagram user */
  url: string;
  /** Pagination cursor (empty or undefined for the first page) */
  cursor?: string;
}

export interface InstagramPostCarouselItem {
  id: string;
  mediaType: 'image' | 'video' | number;
  displayUrl: string;
  videoUrl?: string;
  width?: number;
  height?: number;
}

export interface InstagramPostItem {
  id: string;
  pk?: string | number;
  code?: string; // shortcode e.g. "Cx8123abc"
  mediaType: 'image' | 'video' | 'carousel' | number;
  displayUrl: string;
  videoUrl?: string;
  caption?: string | null;
  likeCount?: number;
  commentCount?: number;
  viewCount?: number;
  takenAt: number | string;
  carouselMedia?: InstagramPostCarouselItem[];
  user?: {
    id: string;
    username: string;
    fullName?: string;
    profilePicUrl?: string;
    isVerified?: boolean;
  };
  raw?: any;
  [key: string]: any;
}

export interface InstagramPostListResponse {
  posts?: InstagramPostItem[] | any[];
  result?: InstagramPostItem[] | any[];
  cursor?: string | null;
  nextCursor?: string | null;
  hasMore?: boolean;
  [key: string]: any;
}

// ============================================================================
// 4. Instagram User Reels (Paginated)
// ============================================================================

export interface InstagramReelParams extends InstagramBaseRequestOptions {
  /** The URL or Username of Instagram user */
  url: string;
  /** Pagination cursor (empty for first page) */
  cursor?: string;
  /** Return raw data from Instagram directly */
  raw?: boolean;
}

export interface InstagramReelItem {
  id: string;
  pk?: string | number;
  code?: string;
  mediaType: 'video' | number;
  displayUrl: string;
  videoUrl?: string;
  caption?: string | null;
  likeCount?: number;
  commentCount?: number;
  playCount?: number;
  duration?: number;
  takenAt: number | string;
  user?: {
    id: string;
    username: string;
    profilePicUrl?: string;
  };
  raw?: any;
}

export interface InstagramReelsResponse {
  reels?: InstagramReelItem[] | any[];
  cursor?: string | null;
  hasMore?: boolean;
  [key: string]: any;
}
