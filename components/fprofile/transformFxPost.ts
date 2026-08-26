/**
 * Transformer: FxTwitterStatus -> Post
 *
 * Adapts FxTwitter API v2 status responses into the heavily optimized Post model
 * used throughout the application, without mutating the core PostItem component.
 *
 * Ensures maximum resolution for images (name=orig) and highest bitrate for videos.
 */

import { FALLBACK_AVATAR_URL } from "@/components/profile/header/constants";
import { FxPhoto, FxTwitterStatus, FxVideo } from "@/services/fxtwitter/types";
import { Link, Media, Post } from "@/types/post";

/**
 * Ensures photo URLs from Twitter/X request the highest uncompressed resolution (orig)
 */
export function getHighestQualityPhotoUrl(url?: string | null): string {
  if (!url) return "";
  const trimmed = url.trim();

  // If this is a Twitter media URL (pbs.twimg.com/media/...), upgrade quality to 'orig'
  if (trimmed.includes("pbs.twimg.com/media/")) {
    // If URL has query params (e.g. ?format=jpg&name=small)
    if (trimmed.includes("?")) {
      const [base, query] = trimmed.split("?");
      const params = new URLSearchParams(query);
      params.set("name", "orig");
      return `${base}?${params.toString()}`;
    }
    // If URL has no query params, append ?name=orig
    return `${trimmed}?name=orig`;
  }

  return trimmed;
}

/**
 * Selects the highest quality/bitrate MP4 or video variant available from FxTwitter
 */
export function getHighestQualityVideoUrl(video: FxVideo): string {
  if (video.formats && video.formats.length > 0) {
    // Filter for direct MP4 / non-manifest playable streams
    const playableFormats = video.formats.filter(
      (f) => f.url && f.container !== "m3u8"
    );

    if (playableFormats.length > 0) {
      // Sort descending by resolution (width * height) and bitrate
      playableFormats.sort((a, b) => {
        const resA = (a.width || 0) * (a.height || 0);
        const resB = (b.width || 0) * (b.height || 0);
        if (resA !== resB) return resB - resA;
        return (b.bitrate || 0) - (a.bitrate || 0);
      });
      return playableFormats[0].url;
    }
  }

  return video.url || video.formats?.[0]?.url || "";
}

/**
 * Reliably converts FxTwitter created_timestamp (seconds/ms) or Twitter date strings
 * into standard ISO 8601 string that Day.js on Hermes can parse accurately.
 */
export function parseFxTwitterDate(
  createdAt?: string | null,
  createdTimestamp?: number | null
): string {
  // 1. Prefer created_timestamp (exact Unix epoch in seconds or milliseconds)
  if (typeof createdTimestamp === "number" && !isNaN(createdTimestamp) && createdTimestamp > 0) {
    const ms = createdTimestamp > 1e11 ? createdTimestamp : createdTimestamp * 1000;
    return new Date(ms).toISOString();
  }

  // 2. Parse createdAt string
  if (createdAt) {
    // Check if standard Date.parse works
    const parsed = Date.parse(createdAt);
    if (!isNaN(parsed)) {
      return new Date(parsed).toISOString();
    }

    // Handle Twitter legacy date format "Wed Oct 10 20:19:24 +0000 2018"
    const twitterMatch = createdAt.match(
      /^[A-Za-z]{3}\s+([A-Za-z]{3})\s+(\d{1,2})\s+(\d{2}:\d{2}:\d{2})\s+([+-]\d{4})\s+(\d{4})$/
    );
    if (twitterMatch) {
      const [, monthStr, day, time, offset, year] = twitterMatch;
      const months: Record<string, string> = {
        Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
        Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
      };
      const month = months[monthStr] || "01";
      const formattedOffset = `${offset.slice(0, 3)}:${offset.slice(3)}`;
      const isoCandidate = `${year}-${month}-${day.padStart(2, "0")}T${time}${formattedOffset}`;
      const isoParsed = Date.parse(isoCandidate);
      if (!isNaN(isoParsed)) {
        return new Date(isoParsed).toISOString();
      }
    }
  }

  return new Date().toISOString();
}

export function transformFxTwitterStatusToPost(status: FxTwitterStatus): Post {
  const photos = status.media?.photos || [];
  const videos = status.media?.videos || [];

  const mediaList: Media[] = [];

  // Map Photos (with max resolution orig URLs)
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const maxQualityUrl = getHighestQualityPhotoUrl(photo.url);

    mediaList.push({
      id: photo.id || `${status.id}-photo-${i}`,
      type: photo.type === "gif" ? "gif" : "photo",
      url: maxQualityUrl,
      thumbnail_url: photo.transcode_url || photo.url,
      caption: photo.altText || "",
      backup1: photo.url !== maxQualityUrl ? photo.url : null,
      blurhash: "LGF5?xYk^6#M@-5c,1J5@[or[Q6.",
    });
  }

  // Map Videos (with highest bitrate variant)
  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    const bestVideoUrl = getHighestQualityVideoUrl(video);

    mediaList.push({
      id: video.id || `${status.id}-video-${i}`,
      type: "video",
      url: bestVideoUrl,
      thumbnail_url: video.thumbnail_url || video.url || "",
      caption: "",
      backup1: video.url !== bestVideoUrl ? video.url : null,
      blurhash: "LGF5?xYk^6#M@-5c,1J5@[or[Q6.",
    });
  }

  // Map Links / Cards
  const links: Link[] = [];
  if (status.card?.url) {
    links.push({
      url: status.card.url,
      label: status.card.title || status.card.domain || status.card.url,
    });
  }

  // Map Quote / Repost
  let quotedPost: any = undefined;
  if (status.quote && status.quote.type === "status") {
    quotedPost = transformFxTwitterStatusToPost(status.quote as FxTwitterStatus);
  }

  const createdAt = parseFxTwitterDate(status.created_at, status.created_timestamp);

  // Ensure author avatar is high quality (replace _normal with _400x400 if applicable)
  const highResAvatar = status.author?.avatar_url
    ? status.author.avatar_url.replace(/_normal\.(jpg|jpeg|png|gif)$/i, "_400x400.$1")
    : FALLBACK_AVATAR_URL;

  return {
    id: status.id,
    profile_id: status.author?.id || status.author?.screen_name || "",
    created_at: createdAt,
    content: status.text || "",
    location: status.author?.location || null,
    device: status.source || "X for Mobile",
    deezer_id: "",
    audio_url: "",
    links,
    is_ghost: false,
    is_adult: !!status.possibly_sensitive,
    is_liked: false,
    is_bookmarked: false,
    profile_name: status.author?.name || status.author?.screen_name || "User",
    profile_avatar: highResAvatar,
    profile_is_verified: !!status.author?.verification?.verified,
    media: mediaList,
    like_count: status.likes || 0,
    comment_count: status.replies || 0,
    view_count: status.views || 0,
    share_count: status.reposts || 0,
    music: {
      title: "",
      artist: "",
      album: "",
      cover: "",
      cover_url: "",
      preview_url: "",
      url: "",
    },
    reposted_post: quotedPost,
  };
}

const postTransformCache = new Map<string, Post>();

export function getCachedFxTwitterPost(status: FxTwitterStatus): Post {
  const existing = postTransformCache.get(status.id);
  if (existing) return existing;
  const transformed = transformFxTwitterStatusToPost(status);
  postTransformCache.set(status.id, transformed);
  return transformed;
}
