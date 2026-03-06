import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';

// ─── Constants ──────────────────────────────────────────────────────
const CACHE_DIR = `${FileSystem.cacheDirectory}video-cache/`;
const MANIFEST_PATH = `${CACHE_DIR}manifest.json`;

// Default max cache size: 500 MB
const DEFAULT_MAX_CACHE_BYTES = 500 * 1024 * 1024;

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

// ─── In-memory state ────────────────────────────────────────────────
let manifest: Manifest | null = null;
let maxCacheBytes = DEFAULT_MAX_CACHE_BYTES;
const inFlightDownloads: Map<string, Promise<string>> = new Map();

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
    const info = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!info.exists) {
        await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    }
};

// ─── Manifest Management ────────────────────────────────────────────

const loadManifest = async (): Promise<Manifest> => {
    if (manifest) return manifest;

    try {
        const info = await FileSystem.getInfoAsync(MANIFEST_PATH);
        if (info.exists) {
            const raw = await FileSystem.readAsStringAsync(MANIFEST_PATH);
            manifest = JSON.parse(raw) as Manifest;
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
        await FileSystem.writeAsStringAsync(MANIFEST_PATH, JSON.stringify(manifest));
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

        try {
            await FileSystem.deleteAsync(entry.localUri, { idempotent: true });
        } catch { }

        m.totalSize -= entry.size;
        delete m.entries[hash];
    }

    await saveManifest();
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
            const info = await FileSystem.getInfoAsync(entry.localUri);
            if (info.exists) {
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
 * Download and cache a video in the background.
 * Returns the local URI once downloaded, or the original URL on failure.
 * Deduplicates concurrent downloads of the same URL.
 */
export const cacheVideo = async (url: string): Promise<string> => {
    const hash = await hashUrl(url);

    // Check if already cached
    const m = await loadManifest();
    const existing = m.entries[hash];
    if (existing) {
        const info = await FileSystem.getInfoAsync(existing.localUri);
        if (info.exists) {
            existing.lastAccess = Date.now();
            saveManifest();
            return existing.localUri;
        }
    }

    // Deduplicate in-flight downloads
    const inflight = inFlightDownloads.get(hash);
    if (inflight) return inflight;

    const downloadPromise = (async () => {
        try {
            await ensureCacheDir();
            const ext = getExtension(url);
            const localUri = `${CACHE_DIR}${hash}${ext}`;

            // Evict old files if needed (estimate ~20MB per video)
            await evictIfNeeded(20 * 1024 * 1024);

            const downloadResult = await FileSystem.downloadAsync(url, localUri);

            if (downloadResult.status === 200) {
                const info = await FileSystem.getInfoAsync(localUri);
                const fileSize = (info as any).size || 0;

                const entry: CacheEntry = {
                    url,
                    localUri,
                    size: fileSize,
                    lastAccess: Date.now(),
                    createdAt: Date.now(),
                };

                const m = await loadManifest();
                m.entries[hash] = entry;
                m.totalSize += fileSize;
                await saveManifest();

                // Evict again if the actual file was larger than estimated
                await evictIfNeeded();

                return localUri;
            } else {
                // Clean up failed download
                await FileSystem.deleteAsync(localUri, { idempotent: true });
                return url;
            }
        } catch (e) {
            console.warn('[VideoCache] Download failed for:', url, e);
            return url;
        } finally {
            inFlightDownloads.delete(hash);
        }
    })();

    inFlightDownloads.set(hash, downloadPromise);
    return downloadPromise;
};

/**
 * Pre-cache multiple video URLs in background.
 * Non-blocking — fires and forgets.
 */
export const precacheVideos = (urls: string[]) => {
    for (const url of urls) {
        cacheVideo(url).catch(() => { }); // fire-and-forget
    }
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
 * Clear the entire video cache.
 */
export const clearVideoCache = async () => {
    try {
        await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
        manifest = { entries: {}, totalSize: 0 };
        await ensureCacheDir();
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
