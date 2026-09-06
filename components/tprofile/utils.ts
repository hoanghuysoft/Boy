/**
 * Threads Profile & Media Utilities
 *
 * Helpers for platform identification, handle extraction, date formatting,
 * and high-resolution asset resolution.
 */

import { ProfileDetail } from '@/types/profiledetail';
import { ProfileLink } from '@/types/profilelink';

const THREADS_URL_PATTERN =
  /(?:https?:\/\/)?(?:www\.)?(?:threads\.net|threads\.com)\/@?([A-Za-z0-9_.]+)(?:\/|\?|#|$)/i;

const THREADS_HANDLE_PATTERN = /^@?([A-Za-z0-9_.]{1,30})$/;

const RESERVED_THREADS_PATHS = new Set([
  'about',
  'accounts',
  'developer',
  'direct',
  'explore',
  'legal',
  'p',
  'post',
  'privacy',
  'reel',
  'reels',
  'stories',
  't',
  'terms',
]);

/**
 * Check if a platform name or URL points to Threads
 */
export function isThreadsPlatform(platform?: string | null, url?: string | null): boolean {
  const p = (platform || '').toLowerCase().trim();
  const u = (url || '').toLowerCase().trim();
  return (
    p === 'threads' ||
    p === 'thread' ||
    p.includes('threads') ||
    u.includes('threads.net') ||
    u.includes('threads.com')
  );
}

/**
 * Extract a Threads username/handle from a URL, label, or @handle string
 */
export function extractThreadsHandle(input?: string | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 1. Try URL extraction
  const urlMatch = trimmed.match(THREADS_URL_PATTERN);
  if (urlMatch && urlMatch[1]) {
    const handle = urlMatch[1].replace(/^\//, '').replace(/\/$/, '').replace(/^@/, '');
    if (!RESERVED_THREADS_PATHS.has(handle.toLowerCase())) {
      return handle;
    }
  }

  // 2. Try direct handle extraction (e.g. "@username" or "username")
  const handleMatch = trimmed.match(THREADS_HANDLE_PATTERN);
  if (handleMatch && handleMatch[1]) {
    const handle = handleMatch[1].replace(/^@/, '');
    if (!RESERVED_THREADS_PATHS.has(handle.toLowerCase())) {
      return handle;
    }
  }

  return null;
}

export interface ThreadsProfileInfo {
  link?: ProfileLink | null;
  handle: string | null;
  rawUrl: string;
}

/**
 * Inspect socialLinks and profile to find a Threads link and resolve its target/handle
 */
export function extractThreadsProfileInfo(
  socialLinks: ProfileLink[] = [],
  profile?: ProfileDetail | null
): ThreadsProfileInfo | null {
  const link = socialLinks.find((item) => isThreadsPlatform(item.platform, item.url));
  const rawUrl =
    link?.url ||
    (profile as any)?.threads ||
    (profile as any)?.thread ||
    (isThreadsPlatform(undefined, profile?.website) ? profile?.website : '') ||
    '';

  if (!link && !rawUrl) {
    return null;
  }

  let handle =
    extractThreadsHandle(link?.url) ||
    extractThreadsHandle(link?.label) ||
    extractThreadsHandle(rawUrl);

  if (!handle && link && isThreadsPlatform(link.platform, '')) {
    const candidate = (link.url || link.label || '').trim().replace(/^@/, '');
    if (
      /^[A-Za-z0-9_.]{1,30}$/.test(candidate) &&
      !RESERVED_THREADS_PATHS.has(candidate.toLowerCase())
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
 * Parses Threads timestamps (Unix seconds, milliseconds, or ISO strings)
 * into a standard ISO 8601 string that Day.js / JS Date can parse accurately.
 */
export function parseThreadsDate(takenAt?: number | string | null): string {
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
 * Format relative time for Threads post (e.g. "2h", "45m", "1d")
 */
export function formatThreadsTime(takenAt?: number | string | null): string {
  if (!takenAt) return '';
  const dateStr = parseThreadsDate(takenAt);
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
