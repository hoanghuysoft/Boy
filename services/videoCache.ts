import { Directory, Paths } from 'expo-file-system';
import {
    clearVideoCacheAsync,
    getCurrentVideoCacheSize,
    setVideoCacheSizeAsync,
    type VideoSource,
} from 'expo-video';
import { Platform } from 'react-native';
import { resetDirectory } from './fileCacheUtils';

// ─── Legacy cache dir (for migration & cleanup) ──────────────────────
const LEGACY_CACHE_DIR = new Directory(Paths.cache, 'video-cache');

// Default max cache size: 500 MB
export const DEFAULT_MAX_CACHE_BYTES = 500 * 1024 * 1024;

let currentMaxCacheBytes = DEFAULT_MAX_CACHE_BYTES;
let lastAppliedNativeCacheBytes: number | null = null;
let pendingMaxCacheBytes: number | null = null;

// ─── Active Player Pool Suspension Registry ──────────────────────────
// expo-video requires 0 registered VideoPlayer instances when calling
// setVideoCacheSizeAsync() or clearVideoCacheAsync().
// Pooled players (e.g. ShotsViewModel, VideoPlayerContext) register here
// so cache maintenance operations can temporarily release them and resume after.
export interface CachePlayerPoolController {
    releasePlayersForCacheOp: () => void;
    restorePlayersAfterCacheOp?: () => void;
}

const playerPoolControllers = new Set<CachePlayerPoolController>();

export const registerCachePlayerPool = (
    controller: CachePlayerPoolController,
): (() => void) => {
    playerPoolControllers.add(controller);
    return () => {
        playerPoolControllers.delete(controller);
    };
};

const releaseAllRegisteredPools = () => {
    for (const controller of playerPoolControllers) {
        try {
            controller.releasePlayersForCacheOp();
        } catch (err) {
            console.warn('[VideoCache] Error releasing player pool:', err);
        }
    }
};

const restoreAllRegisteredPools = () => {
    for (const controller of playerPoolControllers) {
        try {
            controller.restorePlayersAfterCacheOp?.();
        } catch (err) {
            console.warn('[VideoCache] Error restoring player pool:', err);
        }
    }
};

/**
 * Checks whether a URI points to an HLS playlist (.m3u8).
 * Per expo-video documentation, iOS cannot use `useCaching: true` with HLS sources.
 */
export const isHlsVideoUri = (uri: string): boolean => {
    const clean = uri.split('?')[0]?.split('#')[0]?.toLowerCase() ?? '';
    return clean.endsWith('.m3u8');
};

/**
 * Determines whether native expo-video disk caching can be enabled for a URI.
 * - Android: supported for progressive (mp4/webm/etc.) and adaptive streams (non-DRM).
 * - iOS: supported for progressive files; not supported for HLS (.m3u8).
 */
export const canUseNativeVideoCaching = (uri: string | null | undefined): boolean => {
    if (!uri || typeof uri !== 'string') return false;
    if (!uri.startsWith('http://') && !uri.startsWith('https://')) return false;
    if (Platform.OS === 'ios' && isHlsVideoUri(uri)) {
        return false;
    }
    return true;
};

/**
 * Builds an expo-video `VideoSource` object with `useCaching: true` whenever supported
 * according to https://docs.expo.dev/versions/latest/sdk/video/#videosource.
 */
export const buildCachedVideoSource = (uri: string | null | undefined): VideoSource => {
    if (!uri) return null;
    return {
        uri,
        useCaching: canUseNativeVideoCaching(uri),
    };
};

/**
 * Apply any pending cache size limit once players have been released.
 */
export const flushPendingCacheSize = async (): Promise<void> => {
    if (pendingMaxCacheBytes === null) return;
    const target = pendingMaxCacheBytes;
    try {
        await setVideoCacheSizeAsync(target);
        lastAppliedNativeCacheBytes = target;
        pendingMaxCacheBytes = null;
    } catch {
        // Will retry next time players are released
    }
};

/**
 * Configure the native video cache size in bytes.
 * Managed directly by native ExoPlayer (Android) / AVFoundation (iOS) with LRU eviction.
 */
export const setMaxCacheSize = async (bytes: number): Promise<void> => {
    currentMaxCacheBytes = bytes;
    if (lastAppliedNativeCacheBytes === bytes && pendingMaxCacheBytes === null) return;

    try {
        await setVideoCacheSizeAsync(bytes);
        lastAppliedNativeCacheBytes = bytes;
        pendingMaxCacheBytes = null;
        return;
    } catch (err: any) {
        const msg = err?.message || String(err);
        if (msg.includes('active players') || msg.includes('Cannot clear cache') || msg.includes('Cannot change the cache size')) {
            // Release any background pooled players and retry immediately
            releaseAllRegisteredPools();
            try {
                await setVideoCacheSizeAsync(bytes);
                lastAppliedNativeCacheBytes = bytes;
                pendingMaxCacheBytes = null;
            } catch {
                pendingMaxCacheBytes = bytes;
            } finally {
                restoreAllRegisteredPools();
            }
            return;
        }
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
    } catch (err: any) {
        const msg = err?.message || String(err);
        if (msg.includes('active players') || msg.includes('Cannot clear cache')) {
            // Temporarily release background pooled players so native cache can clear cleanly
            releaseAllRegisteredPools();
            try {
                await clearVideoCacheAsync();
            } catch (retryErr) {
                console.warn('[VideoCache] Failed to clear native cache after releasing pools:', retryErr);
            } finally {
                restoreAllRegisteredPools();
            }
        } else {
            console.warn('[VideoCache] Failed to clear native cache:', err);
        }
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
