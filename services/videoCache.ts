import * as Crypto from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import { deleteFileIfExists, ensureDirectory, readJsonFileOrNull, resetDirectory, writeJsonFile } from './fileCacheUtils';

// ─── Constants ──────────────────────────────────────────────────────
const CACHE_DIR = new Directory(Paths.cache, 'video-cache');
const MANIFEST_FILE = new File(CACHE_DIR, 'manifest.json');

// Default max cache size: 500 MB
const DEFAULT_MAX_CACHE_BYTES = 500 * 1024 * 1024;

// Max simultaneous downloads (prevents thread/heap saturation during fast swiping)
const MAX_CONCURRENT_DOWNLOADS = 2;

// Debounce interval in ms for precache requests
const PRECACHE_DEBOUNCE_MS = 150;

// ─── Types ──────────────────────────────────────────────────────────
interface CacheEntry {
    url: string;         // original remote URL
    localUri: string;    // local file path
    size: number;        // file size in bytes
    lastAccess: number;  // timestamp (ms)
    createdAt: number;   // timestamp (ms)
}

interface Manifest {
    entries: Record<string, CacheEntry>; // keyed by hash
    totalSize: number;
}

interface QueueItem {
    url: string;
    hash: string;
    isPrecache: boolean;
    abortController: AbortController;
    isAborted: boolean;
    resolve: (uri: string) => void;
    promise: Promise<string>;
}

// ─── In-memory state ────────────────────────────────────────────────
let manifest: Manifest | null = null;
let maxCacheBytes = DEFAULT_MAX_CACHE_BYTES;

const inFlightDownloads: Map<string, QueueItem> = new Map();
const activeDownloads: Map<string, QueueItem> = new Map();
let downloadQueue: QueueItem[] = [];
let currentPrecacheUrls: Set<string> = new Set();
let precacheDebounceTimer: ReturnType<typeof setTimeout> | null = null;

// ─── Helpers ────────────────────────────────────────────────────────

/** Generate a short, filesystem-safe hash from a URL */
const hashUrl = async (url: string): Promise<string> => {
    const digest = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        url
    );
    return digest.substring(0, 16); // 16 hex chars is plenty for uniqueness
};

/** Extract file extension from URL (e.g. ".mp4") */
const getExtension = (url: string): string => {
    try {
        const pathname = new URL(url).pathname;
        const ext = pathname.substring(pathname.lastIndexOf('.'));
        if (ext && ext.length <= 6 && ext.length > 1) return ext;
    } catch { }
    return '.mp4'; // default
};

/** Ensure the cache directory exists */
const ensureCacheDir = async () => {
    ensureDirectory(CACHE_DIR);
};

// ─── Manifest Management ────────────────────────────────────────────

const loadManifest = async (): Promise<Manifest> => {
    if (manifest) return manifest;

    try {
        const savedManifest = await readJsonFileOrNull<Manifest>(MANIFEST_FILE);
        if (savedManifest) {
            manifest = savedManifest;
            return manifest;
        }
    } catch (e) {
        console.warn('[VideoCache] Failed to load manifest, creating new one:', e);
    }

    manifest = { entries: {}, totalSize: 0 };
    return manifest;
};

const saveManifest = async () => {
    if (!manifest) return;
    try {
        await ensureCacheDir();
        writeJsonFile(MANIFEST_FILE, manifest);
    } catch (e) {
        console.warn('[VideoCache] Failed to save manifest:', e);
    }
};

// ─── Eviction (LRU) ────────────────────────────────────────────────

/** Evict oldest-accessed entries until total size is within budget */
const evictIfNeeded = async (reserveBytes: number = 0) => {
    const m = await loadManifest();
    const targetSize = maxCacheBytes - reserveBytes;

    if (m.totalSize <= targetSize) return;

    // Sort entries by lastAccess ascending (oldest first)
    const sorted = Object.entries(m.entries).sort(
        ([, a], [, b]) => a.lastAccess - b.lastAccess
    );

    for (const [hash, entry] of sorted) {
        if (m.totalSize <= targetSize) break;

        // Skip evicting files currently being downloaded or in active playback
        if (activeDownloads.has(hash)) continue;

        try {
            deleteFileIfExists(entry.localUri);
        } catch { }

        m.totalSize -= entry.size;
        delete m.entries[hash];
    }

    await saveManifest();
};

// ─── Queue Processor ────────────────────────────────────────────────

const processQueue = async () => {
    while (activeDownloads.size < MAX_CONCURRENT_DOWNLOADS && downloadQueue.length > 0) {
        const item = downloadQueue.shift();
        if (!item) break;

        // Skip if aborted while waiting in queue
        if (item.isAborted || item.abortController.signal.aborted) {
            inFlightDownloads.delete(item.hash);
            item.resolve(item.url);
            continue;
        }

        // Check if already cached
        const m = await loadManifest();
        const existing = m.entries[item.hash];
        if (existing) {
            const existingFile = new File(existing.localUri);
            if (existingFile.exists) {
                existing.lastAccess = Date.now();
                saveManifest();
                inFlightDownloads.delete(item.hash);
                item.resolve(existing.localUri);
                continue;
            }
        }

        activeDownloads.set(item.hash, item);

        // Execute download asynchronously without blocking the loop
        (async (downloadItem: QueueItem) => {
            const ext = getExtension(downloadItem.url);
            const localFile = new File(CACHE_DIR, `${downloadItem.hash}${ext}`);
            const localUri = localFile.uri;

            try {
                await ensureCacheDir();

                // Reserve ~20MB for incoming video
                await evictIfNeeded(20 * 1024 * 1024);

                if (downloadItem.isAborted || downloadItem.abortController.signal.aborted) {
                    deleteFileIfExists(localUri);
                    downloadItem.resolve(downloadItem.url);
                    return;
                }

                await File.downloadFileAsync(downloadItem.url, localFile, {
                    signal: downloadItem.abortController.signal,
                    idempotent: true,
                });

                if (downloadItem.isAborted || downloadItem.abortController.signal.aborted) {
                    deleteFileIfExists(localUri);
                    downloadItem.resolve(downloadItem.url);
                    return;
                }

                const fileSize = localFile.size || 0;
                const entry: CacheEntry = {
                    url: downloadItem.url,
                    localUri,
                    size: fileSize,
                    lastAccess: Date.now(),
                    createdAt: Date.now(),
                };

                const currentManifest = await loadManifest();
                currentManifest.entries[downloadItem.hash] = entry;
                currentManifest.totalSize += fileSize;
                await saveManifest();

                // Evict again if file was larger than estimated
                await evictIfNeeded();

                downloadItem.resolve(localUri);
            } catch (err: any) {
                const wasAborted =
                    downloadItem.isAborted ||
                    downloadItem.abortController.signal.aborted ||
                    err?.name === 'AbortError';

                if (wasAborted) {
                    deleteFileIfExists(localUri);
                } else {
                    console.warn('[VideoCache] Download failed for:', downloadItem.url, err?.message || err);
                    deleteFileIfExists(localUri);
                }
                downloadItem.resolve(downloadItem.url); // Fallback to remote
            } finally {
                activeDownloads.delete(downloadItem.hash);
                inFlightDownloads.delete(downloadItem.hash);
                processQueue();
            }
        })(item);
    }
};

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Set the maximum cache size in bytes.
 * Will trigger eviction if current cache exceeds the new limit.
 */
export const setMaxCacheSize = async (bytes: number) => {
    maxCacheBytes = bytes;
    await evictIfNeeded();
};

/**
 * Get a cached local URI for the given video URL.
 * If not cached, returns the original URL (non-blocking).
 * Use `cacheVideo` to download in background.
 */
export const getCachedUri = async (url: string): Promise<string> => {
    try {
        const m = await loadManifest();
        const hash = await hashUrl(url);
        const entry = m.entries[hash];

        if (entry) {
            // Verify file still exists
            const file = new File(entry.localUri);
            if (file.exists) {
                // Update last access time
                entry.lastAccess = Date.now();
                // Don't await save to keep it fast
                saveManifest();
                return entry.localUri;
            } else {
                // File was deleted externally, remove from manifest
                m.totalSize -= entry.size;
                delete m.entries[hash];
                saveManifest();
            }
        }
    } catch (e) {
        console.warn('[VideoCache] getCachedUri error:', e);
    }

    return url; // fallback to remote
};

/**
 * Download and cache a video in the background with concurrency control.
 * Returns the local URI once downloaded, or the original URL on failure/cancellation.
 */
export const cacheVideo = async (url: string, isPrecache: boolean = false): Promise<string> => {
    const hash = await hashUrl(url);

    // Check if already cached
    const m = await loadManifest();
    const existing = m.entries[hash];
    if (existing) {
        const existingFile = new File(existing.localUri);
        if (existingFile.exists) {
            existing.lastAccess = Date.now();
            saveManifest();
            return existing.localUri;
        }
    }

    // Check if already in flight or in queue
    const inflight = inFlightDownloads.get(hash);
    if (inflight) {
        // If an explicit request comes in for an item previously queued as precache, upgrade it
        if (!isPrecache && inflight.isPrecache) {
            inflight.isPrecache = false;
        }
        return inflight.promise;
    }

    let resolvePromise!: (uri: string) => void;
    const promise = new Promise<string>((resolve) => {
        resolvePromise = resolve;
    });

    const queueItem: QueueItem = {
        url,
        hash,
        isPrecache,
        abortController: new AbortController(),
        isAborted: false,
        resolve: resolvePromise,
        promise,
    };

    inFlightDownloads.set(hash, queueItem);

    if (!isPrecache) {
        // High priority: insert at the front of the queue
        downloadQueue.unshift(queueItem);
    } else {
        // Background precache: append to back
        downloadQueue.push(queueItem);
    }

    processQueue();
    return promise;
};

/**
 * Pre-cache multiple video URLs in the background.
 * - Throttles / debounces requests to prevent download storms during rapid swiping.
 * - Aborts stale in-flight precaches when the user scrolls away from earlier videos.
 * - Caps concurrency to MAX_CONCURRENT_DOWNLOADS.
 */
export const precacheVideos = (urls: string[]) => {
    if (precacheDebounceTimer) {
        clearTimeout(precacheDebounceTimer);
        precacheDebounceTimer = null;
    }

    precacheDebounceTimer = setTimeout(async () => {
        precacheDebounceTimer = null;
        if (!urls || urls.length === 0) return;

        const newTargetUrls = new Set(urls);
        currentPrecacheUrls = newTargetUrls;

        // 1. Abort any active background precache downloads that are no longer in the target set
        for (const [hash, activeItem] of activeDownloads.entries()) {
            if (activeItem.isPrecache && !newTargetUrls.has(activeItem.url)) {
                activeItem.isAborted = true;
                activeItem.abortController.abort();
                activeDownloads.delete(hash);
                inFlightDownloads.delete(hash);
            }
        }

        // 2. Prune queued background precaches that are no longer needed
        downloadQueue = downloadQueue.filter((item) => {
            if (item.isPrecache && !newTargetUrls.has(item.url)) {
                item.isAborted = true;
                item.abortController.abort();
                inFlightDownloads.delete(item.hash);
                item.resolve(item.url);
                return false;
            }
            return true;
        });

        // 3. Queue the new target URLs
        for (const url of urls) {
            cacheVideo(url, true).catch(() => { });
        }
    }, PRECACHE_DEBOUNCE_MS);
};

/**
 * Get the current total cache size in bytes.
 */
export const getCacheSize = async (): Promise<number> => {
    const m = await loadManifest();
    return m.totalSize;
};

/**
 * Get the number of cached videos.
 */
export const getCacheCount = async (): Promise<number> => {
    const m = await loadManifest();
    return Object.keys(m.entries).length;
};

/**
 * Clear the entire video cache and cancel all active/pending downloads.
 */
export const clearVideoCache = async () => {
    try {
        if (precacheDebounceTimer) {
            clearTimeout(precacheDebounceTimer);
            precacheDebounceTimer = null;
        }

        // Abort all active downloads
        for (const activeItem of activeDownloads.values()) {
            activeItem.isAborted = true;
            activeItem.abortController.abort();
        }
        activeDownloads.clear();

        // Abort all queued items
        for (const item of downloadQueue) {
            item.isAborted = true;
            item.abortController.abort();
            item.resolve(item.url);
        }
        downloadQueue = [];
        inFlightDownloads.clear();
        currentPrecacheUrls.clear();

        resetDirectory(CACHE_DIR);
        manifest = { entries: {}, totalSize: 0 };
        await saveManifest();
    } catch (e) {
        console.warn('[VideoCache] Failed to clear cache:', e);
    }
};

/**
 * Get the current max cache size in bytes.
 */
export const getMaxCacheSize = (): number => {
    return maxCacheBytes;
};

/**
 * Format bytes into human-readable string.
 */
export const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const val = bytes / Math.pow(k, i);
    return `${val.toFixed(val >= 100 ? 0 : 1)} ${sizes[i]}`;
};
