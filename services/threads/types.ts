/**
 * Threads API Types & Interfaces
 * Powered by Social AIO (FB AIO Relay API)
 *
 * APIs covered:
 * 1. get_threads_user_info - Get Threads user profile info
 * 2. get_list_threads_posts - Get list of Threads posts (Supports 'Threads' | 'Replies' | 'Media' | 'Reposts')
 */

import type { InstagramBaseRequestOptions } from '../instagram/types';

export type ThreadsPostType = 'Threads' | 'Replies' | 'Media' | 'Reposts';

export interface ThreadsBaseRequestOptions extends InstagramBaseRequestOptions {
  clientId?: string;
  skipCache?: boolean;
  ttlMs?: number;
}

// ============================================================================
// 1. Threads User Profile
// ============================================================================

export interface ThreadsUserInfoParams extends ThreadsBaseRequestOptions {
  /** The URL or Username of Threads user (e.g. 'zuck' or 'https://www.threads.net/@zuck') */
  url: string;
  /** Return raw data from Threads directly */
  raw?: boolean;
}

export interface ThreadsUser {
  id?: string;
  pk?: string | number;
  username: string;
  name?: string;
  fullName?: string;
  full_name?: string;
  avatar?: string;
  avatar_big?: string;
  profilePicUrl?: string;
  profilePicUrlHd?: string;
  biography?: string;
  bio?: string;
  externalUrl?: string;
  url?: string;
  isPrivate?: boolean;
  is_private?: boolean;
  isVerified?: boolean;
  is_verified?: boolean;
  followerCount?: number;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  bioLinks?: Array<{ url: string; title?: string }>;
  raw?: any;
  [key: string]: any;
}

export interface ThreadsUserInfoResponse {
  info?: ThreadsUser | any;
  result?: ThreadsUser | any;
  user?: ThreadsUser | any;
  [key: string]: any;
}

// ============================================================================
// 2. Threads User Posts (Paginated)
// ============================================================================

export interface ThreadsPostsParams extends ThreadsBaseRequestOptions {
  /** The URL or Username of Threads user */
  url: string;
  /** Post type: 'Threads', 'Replies', 'Media' or 'Reposts' (default 'Threads') */
  type?: ThreadsPostType;
  /** Pagination cursor (empty or undefined for the first page) */
  cursor?: string;
  /** Return raw data from Threads directly */
  raw?: boolean;
}

export interface ThreadsMediaItem {
  id?: string;
  mediaType?: 'image' | 'video' | 'carousel' | number;
  url?: string;
  displayUrl?: string;
  videoUrl?: string;
  width?: number;
  height?: number;
  hasAudio?: boolean;
}

export interface ThreadsPostItem {
  id: string;
  pk?: string | number;
  code?: string;
  text?: string;
  caption?: string | null;
  takenAt?: number | string;
  likeCount?: number;
  replyCount?: number;
  repostCount?: number;
  shareCount?: number;
  media?: ThreadsMediaItem[];
  carouselMedia?: ThreadsMediaItem[];
  user?: {
    id?: string;
    username: string;
    fullName?: string;
    profilePicUrl?: string;
    isVerified?: boolean;
  };
  replyTo?: {
    id?: string;
    username?: string;
    text?: string;
  };
  raw?: any;
  [key: string]: any;
}

export interface ThreadsPostsListResponse {
  posts?: ThreadsPostItem[] | any[];
  result?: ThreadsPostItem[] | any[];
  cursor?: string | null;
  nextCursor?: string | null;
  hasMore?: boolean;
  [key: string]: any;
}
