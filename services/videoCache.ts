import { Directory, Paths } from 'expo-file-system';
import {
    clearVideoCacheAsync,
    getCurrentVideoCacheSize,
    setVideoCacheSizeAsync,
} from 'expo-video';
import { deleteFileIfExists, resetDirectory } from './fileCacheUtils';

// ─── Legacy cache dir (for migration & cleanup) ──────────────────────
const LEGACY_CACHE_DIR = new Directory(Paths.cache, 'video-cache');

// Default max cache size: 500 MB
export const DEFAULT_MAX_CACHE_BYTES = 500 * 1024 * 1024;

let currentMaxCacheBytes = DEFAULT_MAX_CACHE_BYTES;

/**
 * Configure the native video cache size in bytes.
 * Managed directly by native ExoPlayer (Android) / AVFoundation (iOS) with LRU eviction.
 */
export const setMaxCacheSize = async (bytes: number): Promise<void> => {
    currentMaxCacheBytes = bytes;
    try {
        await setVideoCacheSizeAsync(bytes);
    } catch (err) {
        console.warn('[VideoCache] Failed to set native cache size:', err);
    }
};

/**
 * Get current disk space occupied by the native video cache in bytes.
 */
export const getCacheSize = async (): Promise<number> => {
    try {
        const size = getCurrentVideoCacheSize();
        return typeof size === 'number' && Number.isFinite(size) ? size : 0;
    } catch (err) {
        console.warn('[VideoCache] Failed to get cache size:', err);
        return 0;
    }
};

/**
 * Approximate number of cached items (estimated from total cache size).
 */
export const getCacheCount = async (): Promise<number> => {
    const size = await getCacheSize();
    if (size <= 0) return 0;
    // Average video reel size ~4-5MB
    return Math.max(1, Math.round(size / (4.5 * 1024 * 1024)));
};

/**
 * Clear the entire native video cache and any leftover legacy files.
 */
export const clearVideoCache = async (): Promise<void> => {
    try {
        await clearVideoCacheAsync();
    } catch (err) {
        console.warn('[VideoCache] Failed to clear native cache:', err);
    }

    try {
        // Clean up legacy custom cache directory if present
        if (LEGACY_CACHE_DIR.exists) {
            resetDirectory(LEGACY_CACHE_DIR);
        }
    } catch (err) {
        console.warn('[VideoCache] Failed to clean legacy directory:', err);
    }
};

/**
 * Resolves a video URI.
 * Since expo-video handles progressive disk caching natively via { uri, useCaching: true },
 * this returns the original URL for native streaming/caching.
 */
export const getCachedUri = async (url: string): Promise<string> => {
    return url;
};

/**
 * Check if a URL is cached.
 */
export const isCached = (_url: string): boolean => {
    return false;
};

/**
 * Pre-caching placeholder.
 * Handled natively by expo-video 3-player pool in background buffers.
 */
export const precacheVideos = (_urls: string[]): void => {
    // Handled natively by expo-video
};

/**
 * Get the current max cache size setting in bytes.
 */
export const getMaxCacheSize = (): number => {
    return currentMaxCacheBytes;
};

/**
 * Format bytes into human-readable string (e.g. "12.4 MB").
 */
export const formatBytes = (bytes: number): string => {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
    const val = bytes / Math.pow(k, i);
    return `${val.toFixed(val >= 100 ? 0 : 1)} ${sizes[i]}`;
};
