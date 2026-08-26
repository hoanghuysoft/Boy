/**
 * FxTwitter API v2 Types & Interfaces
 * Spec: https://docs.fxembed.com/api/twitter/operations/
 * OpenAPI: https://api.fxtwitter.com/2/openapi.json
 */

// ============================================================================
// Common / Shared Types
// ============================================================================

export interface FxCursor {
  top?: string | null;
  bottom?: string | null;
}

export interface FxTextFacet {
  type: 'url' | 'mention' | 'hashtag' | 'bold' | 'media' | 'custom_emoji' | string;
  indices: [number, number];
  original?: string;
  replacement?: string;
  display?: string;
  id?: string;
}

export interface FxRawText {
  text: string;
  display_text_range?: [number, number];
  facets?: FxTextFacet[];
}

export interface FxTranslation {
  text: string;
  source_lang: string;
  source_lang_en: string;
  target_lang: string;
  provider: string;
}

export interface FxVerification {
  verified: boolean;
  type?: 'organization' | 'government' | 'individual' | null;
  verified_at?: string | null;
  identity_verified?: boolean;
  verified_by?: string;
}

export interface FxAboutAccount {
  based_in?: string | null;
  location_accurate?: boolean;
  created_country_accurate?: boolean | null;
  source?: string | null;
  username_changes?: {
    count: number;
    last_changed_at?: string | null;
  };
}

export interface FxWebsite {
  url: string;
  display_url: string;
}

export interface FxBirthday {
  day?: number;
  month?: number;
  year?: number;
}

// ============================================================================
// User / Profile
// ============================================================================

export interface FxTwitterUser {
  type: 'profile';
  id: string;
  name: string;
  screen_name: string;
  avatar_url: string | null;
  banner_url?: string | null;
  description: string;
  raw_description?: FxRawText;
  location?: string;
  url?: string;
  protected?: boolean;
  followers?: number;
  following?: number;
  statuses?: number;
  media_count?: number;
  likes?: number;
  joined?: string;
  website?: FxWebsite | null;
  birthday?: FxBirthday | null;
  verification?: FxVerification;
  about_account?: FxAboutAccount;
  profile_embed?: boolean;
  reason?: 'suspended';
}

export interface FxUserResponse {
  code: number;
  message: string;
  user?: FxTwitterUser;
  reason?: 'suspended';
  id?: string;
}

export interface FxProfileAboutResponse {
  code: number;
  message: string;
  about_account?: FxAboutAccount;
}

// ============================================================================
// Media Structures
// ============================================================================

export interface FxPhotoFormat {
  webp?: string;
  jpeg?: string;
}

export interface FxPhoto {
  id?: string;
  format?: string;
  type: 'photo' | 'gif';
  url: string;
  width: number;
  height: number;
  transcode_url?: string | null;
  altText?: string;
}

export interface FxVideoVariant {
  container?: 'mp4' | 'webm' | 'm3u8' | string;
  codec?: 'h264' | 'hevc' | 'vp9' | 'av1' | string;
  bitrate?: number;
  url: string;
  size?: number;
  height?: number;
  width?: number;
}

export interface FxVideo {
  id?: string;
  format?: string;
  type: 'video' | 'gif';
  url: string;
  width: number;
  height: number;
  thumbnail_url?: string | null;
  transcode_url?: string | null;
  duration?: number;
  filesize?: number;
  formats?: FxVideoVariant[];
  publisher?: FxTwitterUser | null;
}

export interface FxMosaic {
  id?: string;
  format?: string;
  type: 'mosaic_photo';
  url: string;
  width: number;
  height: number;
  formats: FxPhotoFormat;
}

export interface FxExternalMedia {
  type: 'video' | string;
  url: string;
  thumbnail_url?: string;
  height?: number;
  width?: number;
}

export interface FxBroadcast {
  url: string;
  width: number;
  height: number;
  state: 'LIVE' | 'ENDED' | string;
  broadcaster: {
    username: string;
    display_name: string;
    id: string;
  };
  stream: {
    url: string;
  };
  title?: string;
  source?: string;
  orientation?: 'landscape' | 'portrait';
  broadcast_id?: string;
  media_id?: string;
  media_key?: string;
  is_high_latency?: boolean;
  thumbnail?: {
    original: { url: string };
    small?: { url: string };
    medium?: { url: string };
    large?: { url: string };
    x_large?: { url: string };
  };
}

export type FxMediaItem = FxPhoto | FxVideo | FxMosaic | {
  id?: string;
  format?: string;
  type: string;
  url: string;
  width: number;
  height: number;
};

export interface FxTwitterMedia {
  photos?: FxPhoto[];
  videos?: FxVideo[];
  all?: FxMediaItem[];
  mosaic?: FxMosaic;
  external?: FxExternalMedia;
  broadcast?: FxBroadcast;
}

// ============================================================================
// Poll, Card, Article, Community Note
// ============================================================================

export interface FxPollChoice {
  label: string;
  count: number;
  percentage: number;
}

export interface FxPoll {
  choices: FxPollChoice[];
  total_votes: number;
  ends_at: string;
  time_left_en: string;
}

export interface FxCard {
  url: string;
  title?: string;
  description?: string;
  domain?: string;
  card_name?: string;
  image?: {
    width?: number;
    height?: number;
    url?: string;
    alt?: string;
  };
}

export interface FxReplyingTo {
  screen_name: string;
  status: string;
  url?: string;
  profile_url?: string;
  display_name?: string;
}

export interface FxRepostedBy {
  id: string;
  name: string;
  screen_name: string;
  avatar_url?: string | null;
  url?: string;
}

export interface FxCommunityNote {
  text: string;
  facets?: FxTextFacet[];
}

export interface FxCommunity {
  id: string;
  name: string;
  description: string;
  created_at: string;
  search_tags: string[];
  is_nsfw: boolean;
  topic?: string | null;
  admin?: FxTwitterUser | null;
  creator?: FxTwitterUser | null;
  join_policy: 'Open' | 'Closed' | string;
  invites_policy: 'MemberInvitesAllowed' | 'MemberInvitesDisabled' | string;
  is_pinned: boolean;
}

export interface FxArticle {
  created_at: string;
  modified_at?: string;
  id: string;
  title: string;
  preview_text: string;
  cover_media?: {
    id: string;
    media_key: string;
    media_id: string;
    media_info: any;
  };
  content?: {
    blocks: Array<{
      key: string;
      data?: Record<string, any>;
      entityRanges: Array<{ key: number; length: number; offset: number }>;
      inlineStyleRanges: Array<{ length: number; offset: number; style: string }>;
      text: string;
      type: string;
    }>;
    entityMap?: Array<{
      key: string;
      value: {
        type: 'MARKDOWN' | 'MEDIA' | 'TWEET' | string;
        mutability: string;
        data: Record<string, any>;
      };
    }>;
  };
  media_entities?: Array<{
    id: string;
    media_key: string;
    media_id: string;
    media_info: any;
  }>;
}

// ============================================================================
// Status / Post
// ============================================================================

export interface FxStatusTombstone {
  type: 'tombstone';
  provider: 'twitter' | 'bluesky' | 'mastodon' | 'tiktok' | 'instagram' | 'threads' | string;
  reason: 'deleted' | 'suspended' | 'private' | 'blocked' | 'unavailable' | string;
  message: string;
  id?: string;
  url?: string;
  author?: FxTwitterUser;
  at_uri?: string;
  cid?: string;
}

export interface FxTwitterStatus {
  type: 'status';
  id: string;
  url: string;
  text: string;
  created_at: string;
  created_timestamp: number;
  likes: number;
  reposts: number;
  quotes?: number;
  replies: number;
  views?: number | null;
  bookmarks?: number | null;
  author: FxTwitterUser;
  media?: FxTwitterMedia;
  raw_text?: FxRawText;
  lang?: string | null;
  translation?: FxTranslation;
  possibly_sensitive?: boolean;
  replying_to?: FxReplyingTo | null;
  reposted_by?: FxRepostedBy | null;
  quote?: FxTwitterStatus | FxStatusTombstone | null;
  poll?: FxPoll;
  article?: FxArticle;
  community_note?: FxCommunityNote | null;
  community?: FxCommunity;
  card?: FxCard;
  is_note_tweet?: boolean;
  source?: string | null;
  embed_card?: 'tweet' | 'summary' | 'summary_large_image' | 'player' | string;
  provider?: 'twitter' | 'bluesky' | 'mastodon' | 'instagram' | 'threads' | string;
}

// ============================================================================
// Timeline & Conversation Response Wrappers
// ============================================================================

export interface FxPaginatedResponse<T> {
  code: number;
  results: T[];
  cursor: FxCursor;
}

export interface FxSocialThread {
  code: number;
  status: FxTwitterStatus | FxStatusTombstone | null;
  thread?: (FxTwitterStatus | FxStatusTombstone)[] | null;
  author?: FxTwitterUser | null;
}

export interface FxSocialConversation {
  code: number;
  status: FxTwitterStatus | FxStatusTombstone | null;
  thread?: (FxTwitterStatus | FxStatusTombstone)[] | null;
  replies?: (FxTwitterStatus | FxStatusTombstone | any)[] | null;
  author?: FxTwitterUser | null;
  cursor?: {
    bottom?: string | null;
  } | null;
}

// ============================================================================
// Trends & Typeahead
// ============================================================================

export interface FxTrendItem {
  name: string;
  rank?: string | null;
  context?: string | null;
  grouped_topics?: Array<{ name: string }>;
}

export interface FxTrendsResponse {
  code: number;
  message: string;
  timeline_type?: string;
  trends: FxTrendItem[];
  cursor?: FxCursor;
}

export interface FxTypeaheadTopic {
  topic: string;
  rounded_score?: number;
  tokens?: Array<{ token: string }>;
}

export interface FxTypeaheadEvent {
  title: string;
  subtitle?: string;
  rounded_score?: number;
  topic?: string;
}

export interface FxTypeaheadResponse {
  code: number;
  query: string;
  num_results: number;
  users: FxTwitterUser[];
  topics: FxTypeaheadTopic[];
  events: FxTypeaheadEvent[];
}

// ============================================================================
// Request Parameters
// ============================================================================

export interface FxBaseRequestOptions {
  /** Skip persistent MMKV cache and force network fetch */
  skipCache?: boolean;
}

export interface FxPaginationParams extends FxBaseRequestOptions {
  /** Page size (default: 20, max: 100) */
  count?: number;
  /** Pagination cursor from prior response */
  cursor?: string;
  /** Target language (e.g. 'en', 'vi', 'ja') for inline translation */
  lang?: string;
}

export interface FxUserProfileParams extends FxBaseRequestOptions {
  /** Username without @ or numeric user id as 'id:<rest_id>' */
  handle: string;
  /** Include detailed about_account fields */
  about_account?: boolean;
}

export interface FxUserMediaParams extends FxPaginationParams {
  /** Username without @ or numeric user id */
  handle: string;
}

export interface FxUserStatusesParams extends FxPaginationParams {
  /** Username without @ or numeric user id */
  handle: string;
  /** Fetch tweets since timestamp or snowflake */
  since?: string;
  /** Include replies in timeline */
  with_replies?: boolean;
  /** Group thread items */
  groupthreads?: boolean;
}

export interface FxUserArticlesParams extends FxPaginationParams {
  /** Username without @ or numeric user id */
  handle: string;
}

export interface FxUserFollowParams extends FxBaseRequestOptions {
  /** Username without @ or numeric user id */
  handle: string;
  /** Page size (default: 20, max: 100) */
  count?: number;
  /** Pagination cursor */
  cursor?: string;
}

export interface FxStatusParams extends FxBaseRequestOptions {
  /** Tweet ID (numeric snowflake) */
  id: string;
  /** Include about_account info */
  about_account?: boolean;
  /** Target translation language */
  lang?: string;
}

export interface FxStatusListParams extends FxBaseRequestOptions {
  /** Tweet ID */
  id: string;
  /** Page size */
  count?: number;
  /** Cursor */
  cursor?: string;
  /** Target translation language */
  lang?: string;
}

export interface FxConversationParams extends FxBaseRequestOptions {
  /** Root Tweet ID */
  id: string;
  /** Ranking order */
  ranking_mode?: 'relevance' | 'recency';
  /** Cursor */
  cursor?: string;
  /** Include about_account */
  about_account?: boolean;
  /** Target language */
  lang?: string;
}

export interface FxSearchParams extends FxPaginationParams {
  /** Search query */
  q: string;
  /** Search feed filter */
  feed?: 'top' | 'latest' | 'photos' | 'videos' | 'users';
}

export interface FxTypeaheadParams extends FxBaseRequestOptions {
  /** Search prefix */
  q: string;
  /** Result filter */
  result_type?: 'users' | 'topics' | 'events';
  /** Source context */
  src?: string;
}

export interface FxTrendsParams extends FxBaseRequestOptions {
  /** Trend timeline type */
  type?: string;
  /** Max count */
  count?: number;
}
