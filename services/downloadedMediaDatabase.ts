/**
 * downloadedMediaDatabase.ts
 *
 * Local database to track and deduplicate downloaded media from external posts
 * (FxTwitter) using high-performance C++ MMKV storage.
 *
 * Prevents redundant re-downloads, tracks asset IDs and timestamps, and provides
 * reactive status updates for the UI.
 */

import { Media, Post } from "@/types/post";
import { createMMKV } from "react-native-mmkv";
import { create } from "zustand";

// ─── Types ──────────────────────────────────────────────────────────

export interface DownloadedMediaRecord {
    key: string;
    postId: string;
    mediaId?: string;
    url: string;
    assetId?: string;
    platform?: "fxtwitter" | "other";
    mediaType: "photo" | "video" | "gif";
    fileName: string;
    downloadedAt: number;
}

export interface PostDownloadStatus {
    isFullyDownloaded: boolean;
    isPartiallyDownloaded: boolean;
    downloadedCount: number;
    totalCount: number;
    unDownloadedMedia: Media[];
    downloadedRecords: DownloadedMediaRecord[];
}

// ─── MMKV Instance ──────────────────────────────────────────────────

export const downloadedMediaDb = createMMKV({ id: "downloaded-media-db" });

const KEY_PREFIX_MEDIA = "media:";
const KEY_PREFIX_POST = "post_medias:";

// ─── Reactive Zustand State for Live UI Updates ─────────────────────

interface DownloadedMediaState {
    version: number;
    bumpVersion: () => void;
}

export const useDownloadedMediaStore = create<DownloadedMediaState>((set) => ({
    version: 0,
    bumpVersion: () => set((state) => ({ version: state.version + 1 })),
}));

// ─── Key Generation ─────────────────────────────────────────────────

/**
 * Generates a consistent, canonical deduplication key for a media item.
 */
export function getMediaDownloadKey(
    media: { id?: string; url?: string; thumbnail_url?: string },
    postId?: string,
    index?: number
): string {
    // 1. Check if media has a canonical platform ID
    if (
        media.id &&
        !media.id.startsWith("temp-") &&
        !media.id.includes("carousel") &&
        !media.id.includes("media-")
    ) {
        return `id:${media.id}`;
    }

    const url = media.url || media.thumbnail_url || "";
    if (url) {
        try {
            const parsed = new URL(url);
            // Twitter / X photo or video path (e.g. /media/G12345)
            if (parsed.hostname.includes("twimg.com")) {
                return `tw:${parsed.pathname}`;
            }
            return `url:${parsed.origin}${parsed.pathname}`;
        } catch {
            return `raw:${url}`;
        }
    }

    return `fallback:${postId || "post"}_${index ?? 0}`;
}

// ─── Database Operations ────────────────────────────────────────────

/**
 * Check if a specific media item has already been downloaded and recorded.
 */
export function isMediaDownloaded(
    media: { id?: string; url?: string; thumbnail_url?: string },
    postId?: string,
    index?: number
): boolean {
    const key = getMediaDownloadKey(media, postId, index);
    if (downloadedMediaDb.contains(KEY_PREFIX_MEDIA + key)) {
        return true;
    }
    if (postId) {
        const postKeys = getPostDownloadedKeys(postId);
        if (postKeys.includes(key)) return true;
        if (media.id && postKeys.includes(`id:${media.id}`)) return true;
    }
    return false;
}

/**
 * Get the record for a specific media item.
 */
export function getDownloadedRecord(key: string): DownloadedMediaRecord | null {
    const raw = downloadedMediaDb.getString(KEY_PREFIX_MEDIA + key);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

/**
 * Get all downloaded media keys recorded for a specific post.
 */
export function getPostDownloadedKeys(postId: string): string[] {
    const raw = downloadedMediaDb.getString(KEY_PREFIX_POST + postId);
    if (!raw) return [];
    try {
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

/**
 * Save a single downloaded media record into the database.
 */
export function recordDownloadedMedia(record: DownloadedMediaRecord): void {
    const mediaKey = KEY_PREFIX_MEDIA + record.key;
    downloadedMediaDb.set(mediaKey, JSON.stringify(record));

    if (record.postId) {
        const postKey = KEY_PREFIX_POST + record.postId;
        const existingKeys = getPostDownloadedKeys(record.postId);
        if (!existingKeys.includes(record.key)) {
            existingKeys.push(record.key);
            downloadedMediaDb.set(postKey, JSON.stringify(existingKeys));
        }
    }

    useDownloadedMediaStore.getState().bumpVersion();
}

/**
 * Save multiple downloaded media records into the database in batch.
 */
export function recordBatchDownloadedMedia(records: DownloadedMediaRecord[]): void {
    if (records.length === 0) return;

    for (const record of records) {
        const mediaKey = KEY_PREFIX_MEDIA + record.key;
        downloadedMediaDb.set(mediaKey, JSON.stringify(record));

        if (record.postId) {
            const postKey = KEY_PREFIX_POST + record.postId;
            const existingKeys = getPostDownloadedKeys(record.postId);
            if (!existingKeys.includes(record.key)) {
                existingKeys.push(record.key);
                downloadedMediaDb.set(postKey, JSON.stringify(existingKeys));
            }
        }
    }

    useDownloadedMediaStore.getState().bumpVersion();
}

/**
 * Check the overall download status of a post and return missing/un-downloaded items.
 */
export function checkPostDownloadStatus(post: Post | null): PostDownloadStatus {
    if (!post || !post.media || post.media.length === 0) {
        return {
            isFullyDownloaded: false,
            isPartiallyDownloaded: false,
            downloadedCount: 0,
            totalCount: 0,
            unDownloadedMedia: [],
            downloadedRecords: [],
        };
    }

    const totalCount = post.media.length;
    const unDownloadedMedia: Media[] = [];
    const downloadedRecords: DownloadedMediaRecord[] = [];
    let downloadedCount = 0;

    for (let i = 0; i < post.media.length; i++) {
        const item = post.media[i];
        const key = getMediaDownloadKey(item, post.id, i);
        const record = getDownloadedRecord(key);

        if (isMediaDownloaded(item, post.id, i)) {
            downloadedCount++;
            if (record) downloadedRecords.push(record);
        } else {
            unDownloadedMedia.push(item);
        }
    }

    return {
        isFullyDownloaded: downloadedCount === totalCount && totalCount > 0,
        isPartiallyDownloaded: downloadedCount > 0 && downloadedCount < totalCount,
        downloadedCount,
        totalCount,
        unDownloadedMedia,
        downloadedRecords,
    };
}

/**
 * Clear all downloaded media tracking (useful for testing or cache reset).
 */
export function clearDownloadedMediaDatabase(): void {
    downloadedMediaDb.clearAll();
    useDownloadedMediaStore.getState().bumpVersion();
}
