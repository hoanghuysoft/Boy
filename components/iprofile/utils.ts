/**
 * Instagram Profile & Media Utilities
 *
 * Helpers for platform identification, handle extraction, date formatting,
 * and high-resolution asset resolution.
 */

import { ProfileDetail } from '@/types/profiledetail';
import { ProfileLink } from '@/types/profilelink';

const INSTAGRAM_URL_PATTERN =
  /(?:https?:\/\/)?(?:www\.)?(?:instagram\.com|instagr\.am)\/@?([A-Za-z0-9_.]+)(?:\/|\?|#|$)/i;

const INSTAGRAM_HANDLE_PATTERN = /^@?([A-Za-z0-9_.]{1,30})$/;

const RESERVED_INSTAGRAM_PATHS = new Set([
  'about',
  'accounts',
  'developer',
  'direct',
  'explore',
  'legal',
  'p',
  'privacy',
  'reel',
  'reels',
  'stories',
  'terms',
  'tv',
]);

/**
 * Check if a platform name or URL points to Instagram
 */
export function isInstagramPlatform(platform?: string | null, url?: string | null): boolean {
  const p = (platform || '').toLowerCase().trim();
  const u = (url || '').toLowerCase().trim();
  return (
    p === 'instagram' ||
    p === 'ig' ||
    p.includes('instagram') ||
    u.includes('instagram.com') ||
    u.includes('instagr.am')
  );
}

/**
 * Extract an Instagram username/handle from a URL, label, or @handle string
 */
export function extractInstagramHandle(input?: string | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 1. Try URL extraction
  const urlMatch = trimmed.match(INSTAGRAM_URL_PATTERN);
  if (urlMatch && urlMatch[1]) {
    const handle = urlMatch[1].replace(/^\//, '').replace(/\/$/, '');
    if (!RESERVED_INSTAGRAM_PATHS.has(handle.toLowerCase())) {
      return handle;
    }
  }

  // 2. Try direct handle extraction (e.g. "@username" or "username")
  const handleMatch = trimmed.match(INSTAGRAM_HANDLE_PATTERN);
  if (handleMatch && handleMatch[1]) {
    const handle = handleMatch[1];
    if (!RESERVED_INSTAGRAM_PATHS.has(handle.toLowerCase())) {
      return handle;
    }
  }

  return null;
}

export interface InstagramProfileInfo {
  link?: ProfileLink | null;
  handle: string | null;
  rawUrl: string;
}

/**
 * Inspect socialLinks and profile to find an Instagram link and resolve its target/handle
 */
export function extractInstagramProfileInfo(
  socialLinks: ProfileLink[] = [],
  profile?: ProfileDetail | null
): InstagramProfileInfo | null {
  const link = socialLinks.find((item) => isInstagramPlatform(item.platform, item.url));
  const rawUrl =
    link?.url ||
    (profile as any)?.instagram ||
    (profile as any)?.ig ||
    (isInstagramPlatform(undefined, profile?.website) ? profile?.website : '') ||
    '';

  if (!link && !rawUrl) {
    return null;
  }

  let handle =
    extractInstagramHandle(link?.url) ||
    extractInstagramHandle(link?.label) ||
    extractInstagramHandle(rawUrl);

  if (!handle && link && isInstagramPlatform(link.platform, '')) {
    const candidate = (link.url || link.label || '').trim().replace(/^@/, '');
    if (
      /^[A-Za-z0-9_.]{1,30}$/.test(candidate) &&
      !RESERVED_INSTAGRAM_PATHS.has(candidate.toLowerCase())
    ) {
      handle = candidate;
    }
  }

  return {
    link: link || null,
    handle: handle || (rawUrl ? rawUrl.replace(/^@/, '') : null),
    rawUrl,
  };
}

/**
 * Parses Instagram timestamps (Unix seconds, milliseconds, or ISO strings)
 * into a standard ISO 8601 string that Day.js / JS Date can parse accurately.
 */
export function parseInstagramDate(takenAt?: number | string | null): string {
  if (!takenAt) return new Date().toISOString();

  if (typeof takenAt === 'number' && !isNaN(takenAt) && takenAt > 0) {
    const ms = takenAt > 1e11 ? takenAt : takenAt * 1000;
    return new Date(ms).toISOString();
  }

  if (typeof takenAt === 'string') {
    const parsedNumber = Number(takenAt);
    if (!isNaN(parsedNumber) && parsedNumber > 0) {
      const ms = parsedNumber > 1e11 ? parsedNumber : parsedNumber * 1000;
      return new Date(ms).toISOString();
    }
    const parsedDate = Date.parse(takenAt);
    if (!isNaN(parsedDate)) {
      return new Date(parsedDate).toISOString();
    }
  }

  return new Date().toISOString();
}

/**
 * Format relative time for Instagram story header (e.g. "2h", "45m", "1d")
 */
export function formatStoryTime(takenAt?: number | string | null): string {
  if (!takenAt) return '';
  const dateStr = parseInstagramDate(takenAt);
  const now = Date.now();
  const past = new Date(dateStr).getTime();
  const diffSec = Math.max(0, Math.floor((now - past) / 1000));

  if (diffSec < 60) return `${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}
