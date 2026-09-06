import { ProfileDetail } from '@/types/profiledetail';
import { ProfileLink } from '@/types/profilelink';

const X_URL_PATTERN =
  /(?:https?:\/\/)?(?:www\.|mobile\.)?(?:twitter\.com|x\.com|fxtwitter\.com|vxtwitter\.com|fixupx\.com)\/@?([A-Za-z0-9_]{1,15})(?:\/|\?|#|$)/i;

const X_HANDLE_PATTERN = /^@?([A-Za-z0-9_]{1,15})$/;

const RESERVED_X_PATHS = new Set([
  'about',
  'download',
  'explore',
  'hashtag',
  'help',
  'home',
  'i',
  'intent',
  'jobs',
  'login',
  'messages',
  'notifications',
  'privacy',
  'rules',
  'search',
  'settings',
  'share',
  'signup',
  'tos',
]);

/**
 * Check if a platform name or URL points to X/Twitter
 */
export function isXPlatform(platform?: string | null, url?: string | null): boolean {
  const p = (platform || '').toLowerCase().trim();
  const u = (url || '').toLowerCase().trim();
  return (
    p === 'x' ||
    p === 'twitter' ||
    p.includes('twitter') ||
    p.includes('x (twitter)') ||
    u.includes('twitter.com') ||
    u.includes('x.com') ||
    u.includes('fxtwitter.com') ||
    u.includes('vxtwitter.com') ||
    u.includes('fixupx.com')
  );
}

/**
 * Extract an X/Twitter handle from a URL, label, or @handle string
 */
export function extractXHandle(input?: string | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 1. Try URL extraction
  const urlMatch = trimmed.match(X_URL_PATTERN);
  if (urlMatch && urlMatch[1]) {
    const handle = urlMatch[1];
    if (!RESERVED_X_PATHS.has(handle.toLowerCase())) {
      return handle;
    }
  }

  // 2. Try direct handle extraction (e.g. "@username" or "username")
  const handleMatch = trimmed.match(X_HANDLE_PATTERN);
  if (handleMatch && handleMatch[1]) {
    const handle = handleMatch[1];
    if (!RESERVED_X_PATHS.has(handle.toLowerCase())) {
      return handle;
    }
  }

  return null;
}

export interface XProfileInfo {
  link?: ProfileLink | null;
  handle: string | null;
  rawUrl: string;
}

/**
 * Inspect socialLinks and profile to find an X/Twitter link and resolve its handle
 */
export function extractXProfileInfo(
  socialLinks: ProfileLink[] = [],
  profile?: ProfileDetail | null
): XProfileInfo | null {
  const link = socialLinks.find((item) => isXPlatform(item.platform, item.url));
  const rawUrl =
    link?.url ||
    (profile as any)?.twitter ||
    (profile as any)?.x ||
    (isXPlatform(undefined, profile?.website) ? profile?.website : '') ||
    '';

  if (!link && !rawUrl) {
    return null;
  }

  // 1. Try extracting from link url, link label, or rawUrl
  let handle =
    extractXHandle(link?.url) ||
    extractXHandle(link?.label) ||
    extractXHandle(rawUrl);

  // 2. If not matched via regex, but platform is X/Twitter, try raw string without @
  if (!handle && link && isXPlatform(link.platform, '')) {
    const candidate = (link.url || link.label || '').trim().replace(/^@/, '');
    if (
      /^[A-Za-z0-9_]{1,15}$/.test(candidate) &&
      !RESERVED_X_PATHS.has(candidate.toLowerCase())
    ) {
      handle = candidate;
    }
  }

  return {
    link: link || null,
    handle,
    rawUrl,
  };
}

export { extractInstagramProfileInfo, isInstagramPlatform } from '@/components/iprofile/utils';
export { extractThreadsProfileInfo, isThreadsPlatform } from '@/components/tprofile/utils';

