/**
 * Transformer: Threads Post -> Post Model
 *
 * Adapts Social AIO Threads post responses into the optimized Post model
 * used throughout the application, selecting the highest quality media assets
 * and fully compatible with PostItem and cross-posting.
 */

import { FALLBACK_AVATAR_URL } from "@/components/profile/header/constants";
import { ThreadsPostItem, ThreadsUser } from "@/services/threads/types";
import { Link, Media, Post } from "@/types/post";
import { parseThreadsDate } from "./utils";

/**
 * Pick the highest quality image URL available
 */
export function getHighestQualityImageUrl(obj: any): string {
  if (!obj) return "";
  if (typeof obj === "string") return obj;

  // 1. Check image_versions2 / candidates (sorted by resolution)
  const candidates = obj.image_versions2?.candidates || obj.candidates;
  if (Array.isArray(candidates) && candidates.length > 0) {
    const sorted = [...candidates].sort((a, b) => {
      const areaA = (a.width || 0) * (a.height || 0);
      const areaB = (b.width || 0) * (b.height || 0);
      return areaB - areaA;
    });
    if (sorted[0]?.url) return sorted[0].url;
  }

  // 2. Direct high-res properties
  if (obj.display_url_hd || obj.displayUrlHd) return obj.display_url_hd || obj.displayUrlHd;
  if (obj.display_url || obj.displayUrl) return obj.display_url || obj.displayUrl;
  if (obj.image_hd || obj.imageHd) return obj.image_hd || obj.imageHd;
  if (obj.image) return obj.image;
  if (obj.avatar_big || obj.profilePicUrlHd || obj.profile_pic_url_hd) {
    return obj.avatar_big || obj.profilePicUrlHd || obj.profile_pic_url_hd;
  }
  if (obj.avatar || obj.profilePicUrl || obj.profile_pic_url) {
    return obj.avatar || obj.profilePicUrl || obj.profile_pic_url;
  }
  if (obj.url) return obj.url;

  return "";
}

/**
 * Pick the highest quality video URL available
 */
export function getHighestQualityVideoUrl(obj: any): string {
  if (!obj) return "";
  if (typeof obj === "string") return obj;

  // 1. Check video_versions (array with width, height, bandwidth)
  const versions = obj.video_versions || obj.videoVersions;
  if (Array.isArray(versions) && versions.length > 0) {
    const sorted = [...versions].sort((a, b) => {
      const areaA = (a.width || 0) * (a.height || 0);
      const areaB = (b.width || 0) * (b.height || 0);
      return areaB - areaA;
    });
    if (sorted[0]?.url) return sorted[0].url;
  }

  // 2. Direct video properties
  if (obj.video_hd || obj.videoHd) return obj.video_hd || obj.videoHd;
  if (obj.video || obj.video_url || obj.videoUrl) return obj.video || obj.video_url || obj.videoUrl;

  return "";
}

/**
 * Extract caption or text safely from Threads object
 */
function extractThreadsText(item?: any): string {
  if (!item) return "";
  if (typeof item === "string") return item;
  if (typeof item.text === "string") return item.text;
  if (typeof item.caption === "string") return item.caption;
  if (typeof item.caption?.text === "string") return item.caption.text;
  if (typeof item.content === "string") return item.content;
  return "";
}

/**
 * Transform a Threads Post Item into standard app Post model
 */
export function transformThreadsPostToPost(
  item: ThreadsPostItem | any,
  fallbackUser?: ThreadsUser | null
): Post {
  const mediaList: Media[] = [];

  const user = item.user || item.owner || item.author || fallbackUser;
  const authorName =
    user?.name ||
    user?.fullName ||
    user?.full_name ||
    user?.username ||
    "Threads User";
  const authorHandle = user?.username || "";
  const authorAvatar = getHighestQualityImageUrl(user) || FALLBACK_AVATAR_URL;
  const isVerified = !!(user?.isVerified || user?.is_verified);

  const postId = String(item.id || item.post_id || item.pk || item.code || `threads-post-${Date.now()}`);
  const content = extractThreadsText(item);
  const createdAt = parseThreadsDate(item.created_at || item.takenAt || item.taken_at || item.published_at);

  // 1. Check for Carousel / Multiple Media
  const carousel =
    item.carousel ||
    item.carouselMedia ||
    item.carousel_media ||
    item.media ||
    item.images ||
    item.sidecar_children ||
    item.items;

  if (Array.isArray(carousel) && carousel.length > 0) {
    for (let i = 0; i < carousel.length; i++) {
      const sub = carousel[i];
      const videoUrl = getHighestQualityVideoUrl(sub);
      const imageUrl = getHighestQualityImageUrl(sub);
      const isVideo =
        !!videoUrl ||
        sub.mediaType === "video" ||
        sub.media_type === 2 ||
        sub.mediaType === 2;

      const mediaUrl = isVideo ? videoUrl : imageUrl;
      const thumbUrl = imageUrl || mediaUrl;

      if (mediaUrl) {
        mediaList.push({
          id: String(sub.id || `${postId}-carousel-${i}`),
          type: isVideo ? "video" : "photo",
          url: mediaUrl,
          thumbnail_url: thumbUrl,
          caption: "",
          backup1: null,
          blurhash: "LGF5?xYk^6#M@-5c,1J5@[or[Q6.",
        });
      }
    }
  } else {
    // 2. Single Media (Photo or Video)
    const videoUrl = getHighestQualityVideoUrl(item);
    const imageUrl = getHighestQualityImageUrl(item);
    const isVideo =
      !!videoUrl ||
      item.mediaType === "video" ||
      item.media_type === 2 ||
      item.mediaType === 2;

    const mediaUrl = isVideo ? videoUrl : imageUrl;
    const thumbUrl = imageUrl || mediaUrl;

    if (mediaUrl) {
      mediaList.push({
        id: `${postId}-media-0`,
        type: isVideo ? "video" : "photo",
        url: mediaUrl,
        thumbnail_url: thumbUrl,
        caption: "",
        backup1: null,
        blurhash: "LGF5?xYk^6#M@-5c,1J5@[or[Q6.",
      });
    }
  }

  const links: Link[] = [];

  return {
    id: postId,
    profile_id: String(user?.id || user?.uid || user?.pk || authorHandle || "threads-user"),
    created_at: createdAt,
    content,
    location: item.location?.name || null,
    device: "Threads for Mobile",
    deezer_id: "",
    audio_url: "",
    links,
    is_ghost: false,
    is_adult: false,
    is_liked: false,
    is_bookmarked: false,
    profile_name: authorName,
    profile_avatar: authorAvatar,
    profile_is_verified: isVerified,
    media: mediaList,
    like_count: item.like_count || item.likeCount || item.likes || 0,
    comment_count: item.reply_count || item.replyCount || item.comment_count || item.commentCount || item.replies || 0,
    view_count: item.view_count || item.viewCount || 0,
    share_count: item.repost_count || item.repostCount || item.share_count || 0,
    music: {
      title: "",
      artist: "",
      album: "",
      cover: "",
      cover_url: "",
      preview_url: "",
      url: "",
    },
    reposted_post: undefined,
  };
}

const postTransformCache = new Map<string, Post>();

export function getCachedThreadsPost(
  item: ThreadsPostItem | any,
  fallbackUser?: ThreadsUser | null
): Post {
  const key = String(item.id || item.post_id || item.pk || item.code || JSON.stringify(item).slice(0, 40));
  const existing = postTransformCache.get(key);
  if (existing) return existing;
  const transformed = transformThreadsPostToPost(item, fallbackUser);
  postTransformCache.set(key, transformed);
  return transformed;
}
