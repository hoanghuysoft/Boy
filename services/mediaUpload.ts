/**
 * Client API service for profile owners to upload and manage media
 * Uses the /client endpoints which verify profile ownership
 *
 * Supports both direct upload and pre-signed URL upload for large files
 */

import { useSettingsStore } from '@/stores/settings';
import { Media, MediaType } from '@/types/media';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { File as FSFile, type UploadOptions, type UploadResult, UploadType } from 'expo-file-system';
import { Image as RNImage } from 'react-native';
import { Blurhash } from 'react-native-blurhash';
import { client } from './client';
import { storage } from './storage';

// ============================================================================
// Types
// ============================================================================

export type UploadStorageProvider = 'welove' | 'thirdparty';

export interface UploadMediaOptions {
    caption?: string;
    post_id?: string;
    type?: MediaType;
    blurhash?: string;
    signal?: AbortSignal;
}

export interface UploadMediaResponse {
    data: Media;
}

export interface DeleteMediaResponse {
    success: boolean;
    fileDeleted: boolean;
}

export interface PresignedUploadInfo {
    uploadUrl: string;
    objectName: string;
    bucket: string;
    mediaType: MediaType;
    readUrl: string | null;
}

export interface FileAsset {
    uri: string;
    name?: string;
    type?: string;
    fileSize?: number;
    width?: number;
    height?: number;
    blurhash?: string;
}

// ============================================================================
// Content-Addressed Persistent Upload Ledger (Deduplication & Orphan Reuse)
// ============================================================================

const UPLOAD_LEDGER_STORAGE_KEY = 'MEDIA_UPLOAD_LEDGER_V1';
const MAX_LEDGER_ENTRIES = 100;
const LEDGER_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const UPLOAD_STALL_TIMEOUT_MS = 45_000; // 45 seconds without byte progress aborts stuck transfer

export interface CachedRemoteBinary {
    url: string;
    thumbnailUrl?: string | null;
    width?: number | null;
    height?: number | null;
    blurhash?: string | null;
    provider: UploadStorageProvider;
    uploadedAt: number;
}

export interface CachedMediaRecordEntry {
    media: Media;
    profileId: string;
    provider: UploadStorageProvider;
    attachedToPost?: boolean;
    createdAt: number;
}

interface UploadLedgerEntry {
    fingerprint: string;
    updatedAt: number;
    remoteByProvider: Partial<Record<UploadStorageProvider, CachedRemoteBinary>>;
    mediaByProfileAndProvider: Record<string, CachedMediaRecordEntry>;
}

type UploadLedgerMap = Record<string, UploadLedgerEntry>;

let inMemoryLedger: UploadLedgerMap | null = null;
const uriToFingerprintCache = new Map<string, string>();

function loadUploadLedger(): UploadLedgerMap {
    if (inMemoryLedger) return inMemoryLedger;
    try {
        const raw = storage.getString(UPLOAD_LEDGER_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as UploadLedgerMap;
            const now = Date.now();
            const cleaned: UploadLedgerMap = {};
            for (const [key, entry] of Object.entries(parsed)) {
                if (entry && now - entry.updatedAt < LEDGER_TTL_MS) {
                    cleaned[key] = entry;
                }
            }
            inMemoryLedger = cleaned;
            return cleaned;
        }
    } catch (err) {
        console.warn('[mediaUpload] Failed to read upload ledger:', err);
    }
    inMemoryLedger = {};
    return inMemoryLedger;
}

function saveUploadLedger(): void {
    if (!inMemoryLedger) return;
    try {
        const entries = Object.values(inMemoryLedger).sort((a, b) => b.updatedAt - a.updatedAt);
        const trimmed: UploadLedgerMap = {};
        for (const entry of entries.slice(0, MAX_LEDGER_ENTRIES)) {
            trimmed[entry.fingerprint] = entry;
        }
        inMemoryLedger = trimmed;
        storage.set(UPLOAD_LEDGER_STORAGE_KEY, JSON.stringify(trimmed));
    } catch (err) {
        console.warn('[mediaUpload] Failed to persist upload ledger:', err);
    }
}

/**
 * Computes a deterministic content fingerprint (SHA-256) for a local file URI.
 * Even if the user re-picks the same file from ImagePicker (which creates a new temporary URI),
 * the SHA-256 digest matches so previously uploaded cloud files & media records can be reused.
 */
export async function computeFileFingerprint(file: FileAsset): Promise<string> {
    if (!file.uri) return '';
    const cached = uriToFingerprintCache.get(file.uri);
    if (cached) return cached;

    try {
        const fsFile = new FSFile(file.uri);
        const sha256 = await fsFile.digest('SHA-256');
        if (sha256) {
            const fp = `sha256:${sha256}`;
            uriToFingerprintCache.set(file.uri, fp);
            return fp;
        }
    } catch {
        // Fallback for non-standard URIs if digest fails
    }

    const fallback = `uri:${file.uri}|size:${file.fileSize ?? 0}`;
    uriToFingerprintCache.set(file.uri, fallback);
    return fallback;
}

function getProfileProviderKey(profileId: string, provider: UploadStorageProvider): string {
    return `${profileId}:${provider}`;
}

export function getCachedRemoteBinary(
    fingerprint: string,
    provider: UploadStorageProvider
): CachedRemoteBinary | null {
    if (!fingerprint) return null;
    const ledger = loadUploadLedger();
    return ledger[fingerprint]?.remoteByProvider?.[provider] ?? null;
}

export function setCachedRemoteBinary(
    fingerprint: string,
    binary: CachedRemoteBinary
): void {
    if (!fingerprint) return;
    const ledger = loadUploadLedger();
    const existing = ledger[fingerprint] ?? {
        fingerprint,
        updatedAt: Date.now(),
        remoteByProvider: {},
        mediaByProfileAndProvider: {},
    };
    existing.updatedAt = Date.now();
    existing.remoteByProvider[binary.provider] = binary;
    ledger[fingerprint] = existing;
    saveUploadLedger();
}

export function getCachedUnattachedMediaRecord(
    fingerprint: string,
    profileId: string,
    provider: UploadStorageProvider
): Media | null {
    if (!fingerprint || !profileId) return null;
    const ledger = loadUploadLedger();
    const key = getProfileProviderKey(profileId, provider);
    const entry = ledger[fingerprint]?.mediaByProfileAndProvider?.[key];
    if (entry && !entry.attachedToPost && entry.media?.id) {
        return entry.media;
    }
    return null;
}

export function setCachedMediaRecord(
    fingerprint: string,
    profileId: string,
    provider: UploadStorageProvider,
    media: Media
): void {
    if (!fingerprint || !profileId || !media?.id) return;
    const ledger = loadUploadLedger();
    const existing = ledger[fingerprint] ?? {
        fingerprint,
        updatedAt: Date.now(),
        remoteByProvider: {},
        mediaByProfileAndProvider: {},
    };
    const key = getProfileProviderKey(profileId, provider);
    existing.updatedAt = Date.now();
    existing.mediaByProfileAndProvider[key] = {
        media,
        profileId,
        provider,
        attachedToPost: false,
        createdAt: Date.now(),
    };
    ledger[fingerprint] = existing;
    saveUploadLedger();
}

/**
 * Marks uploaded media IDs as attached to a created post so they won't be
 * treated as unattached draft media or deleted on draft cleanup.
 */
export function markMediaAttachedToPost(mediaIds: string[]): void {
    if (!mediaIds.length) return;
    const idSet = new Set(mediaIds);
    const ledger = loadUploadLedger();
    let changed = false;

    for (const entry of Object.values(ledger)) {
        for (const record of Object.values(entry.mediaByProfileAndProvider)) {
            if (idSet.has(record.media.id) && !record.attachedToPost) {
                record.attachedToPost = true;
                changed = true;
            }
        }
    }

    if (changed) {
        saveUploadLedger();
    }
}

/**
 * Checks whether a local FileAsset already has a reusable unattached Media record
 * for the active profile and storage provider.
 */
export async function findReusableUploadedMedia(
    profileId: string,
    file: FileAsset,
    provider: UploadStorageProvider
): Promise<Media | null> {
    if (!profileId || !file.uri) return null;
    const fingerprint = await computeFileFingerprint(file);
    return getCachedUnattachedMediaRecord(fingerprint, profileId, provider);
}

/**
 * If a user explicitly removes a media item from a draft before creating the post,
 * this deletes any unattached server Media record & cloud object so it doesn't stay orphaned.
 */
export async function cleanupOrphanDraftMediaForFile(
    profileId: string,
    file: FileAsset
): Promise<void> {
    if (!profileId || !file.uri) return;
    try {
        const fingerprint = await computeFileFingerprint(file);
        if (!fingerprint) return;
        const ledger = loadUploadLedger();
        const entry = ledger[fingerprint];
        if (!entry) return;

        let changed = false;
        for (const provider of ['welove', 'thirdparty'] as UploadStorageProvider[]) {
            const key = getProfileProviderKey(profileId, provider);
            const record = entry.mediaByProfileAndProvider[key];
            if (record && !record.attachedToPost && record.media?.id) {
                delete entry.mediaByProfileAndProvider[key];
                if (provider === 'welove') {
                    delete entry.remoteByProvider.welove;
                }
                changed = true;
                await deleteMedia(profileId, record.media.id, true).catch(() => { });
            }
        }

        if (changed) {
            saveUploadLedger();
        }
    } catch (err) {
        console.warn('[mediaUpload] Failed to cleanup orphan draft media:', err);
    }
}

/**
 * Executes an `expo-file-system` native upload with:
 * - Immediate cancellation when `externalSignal` aborts (`UploadTask.cancel()`)
 * - Automatic stall watchdog timeout (`UPLOAD_STALL_TIMEOUT_MS`) if no bytes move
 */
export async function runCancellableNativeUpload(
    fsFile: FSFile,
    url: string,
    options: UploadOptions & { signal?: AbortSignal }
): Promise<UploadResult> {
    const { signal: externalSignal, onProgress, ...restOptions } = options;

    if (externalSignal?.aborted) {
        const abortErr = new Error('Upload cancelled');
        abortErr.name = 'AbortError';
        throw abortErr;
    }

    const stallController = new AbortController();
    let isStalledTimeout = false;
    let stallTimer: ReturnType<typeof setTimeout> | null = null;

    const resetStallTimer = () => {
        if (stallTimer) clearTimeout(stallTimer);
        stallTimer = setTimeout(() => {
            isStalledTimeout = true;
            stallController.abort();
        }, UPLOAD_STALL_TIMEOUT_MS);
    };

    const onExternalAbort = () => {
        if (stallTimer) clearTimeout(stallTimer);
        stallController.abort();
    };

    if (externalSignal) {
        externalSignal.addEventListener('abort', onExternalAbort, { once: true });
    }

    resetStallTimer();

    const task = fsFile.createUploadTask(url, {
        ...restOptions,
        signal: stallController.signal,
        onProgress: (data) => {
            resetStallTimer();
            onProgress?.(data);
        },
    });

    try {
        return await task.uploadAsync();
    } catch (err: any) {
        if (externalSignal?.aborted) {
            const abortErr = new Error('Upload cancelled');
            abortErr.name = 'AbortError';
            throw abortErr;
        }
        if (isStalledTimeout) {
            throw new Error('Upload timed out due to a stalled network connection. Please try again.');
        }
        throw err;
    } finally {
        if (stallTimer) clearTimeout(stallTimer);
        if (externalSignal) {
            externalSignal.removeEventListener('abort', onExternalAbort);
        }
        try {
            task.release();
        } catch { }
    }
}

export function isUploadAbortError(error: unknown): boolean {
    if (!error) return false;
    const err = error as any;
    if (err?.name === 'AbortError') return true;
    const msg = String(err?.message || '').toLowerCase();
    return msg.includes('upload cancelled') || msg.includes('aborted') || msg.includes('cancelled');
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Determine media type from file
 */
function getMediaType(file: FileAsset): MediaType {
    const type = file.type || '';
    if (type.startsWith('video/')) return 'video';

    const source = `${file.name || ''} ${file.uri || ''}`.toLowerCase();
    if (source.includes('.mp4') || source.includes('.mov') || source.includes('.webm') || source.includes('.m4v')) {
        return 'video';
    }

    return 'photo';
}

/**
 * Get file extension from URI or type
 */
function getFileExtension(file: FileAsset): string {
    if (file.name) {
        const parts = file.name.split('.');
        if (parts.length > 1) return parts[parts.length - 1];
    }

    const type = file.type || '';
    if (type.includes('jpeg') || type.includes('jpg')) return 'jpg';
    if (type.includes('png')) return 'png';
    if (type.includes('gif')) return 'gif';
    if (type.includes('webp')) return 'webp';
    if (type.includes('mp4')) return 'mp4';
    if (type.includes('mov') || type.includes('quicktime')) return 'mov';
    if (type.includes('webm')) return 'webm';

    return 'jpg';
}

/**
 * Generate a blurhash string for an image URI
 * @param uri Local or remote image URI
 * @param componentsX X component count (default: 4)
 * @param componentsY Y component count (default: 3)
 */
export async function generateBlurhash(
    uri: string,
    componentsX: number = 4,
    componentsY: number = 3
): Promise<string | null> {
    try {
        if (!uri) return null;
        const hash = await Blurhash.encode(uri, componentsX, componentsY);
        return hash;
    } catch (error) {
        console.warn('[mediaUpload] Failed to generate blurhash:', error);
        return null;
    }
}

/**
 * Get image dimensions for a local URI
 */
export function getImageDimensions(uri: string): Promise<{ width: number; height: number } | null> {
    return new Promise((resolve) => {
        if (!uri) return resolve(null);
        RNImage.getSize(
            uri,
            (width, height) => resolve({ width, height }),
            (error) => {
                console.warn('[mediaUpload] Failed to get image dimensions:', error);
                resolve(null);
            }
        );
    });
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Upload a media file directly using FormData
 * Best for smaller files (< 5MB)
 */
export const uploadMedia = async (
    profileId: string,
    file: FileAsset,
    options: UploadMediaOptions = {}
): Promise<UploadMediaResponse> => {
    const type = options.type || getMediaType(file);
    const { x02ApiKey } = useSettingsStore.getState();

    if (type === 'video' && x02ApiKey) {
        try {
            return await uploadVideoViaX02(profileId, file, options);
        } catch (e) {
            console.warn('[mediaUpload] x02 video upload failed, falling back to direct upload:', e);
        }
    }

    const formData = new FormData();

    formData.append('file', {
        uri: file.uri,
        name: file.name || `upload.${getFileExtension(file)}`,
        type: file.type || (type === 'video' ? 'video/mp4' : 'image/jpeg'),
    } as any);

    if (options.caption) formData.append('caption', options.caption);
    if (options.post_id) formData.append('post_id', options.post_id);
    if (options.type) formData.append('type', options.type);

    let width = file.width;
    let height = file.height;
    if ((!width || !height) && type === 'photo' && file.uri) {
        const dims = await getImageDimensions(file.uri);
        if (dims) {
            width = width || dims.width;
            height = height || dims.height;
        }
    }
    if (width) formData.append('width', String(width));
    if (height) formData.append('height', String(height));

    let blurhash = options.blurhash || file.blurhash;
    if (!blurhash && type === 'photo') {
        blurhash = (await generateBlurhash(file.uri)) || undefined;
    }
    if (blurhash) formData.append('blurhash', blurhash);

    const response = await client.post<UploadMediaResponse>(
        `/api/profiles/${profileId}/media/client`,
        formData,
        { signal: options.signal },
    );

    return response.data;
};

const VIDEO_UPLOAD_MAX_RETRIES = 3;
const VIDEO_UPLOAD_RETRY_DELAY_MS = 2000;

const sleep = (ms: number, signal?: AbortSignal) =>
    new Promise<void>((resolve, reject) => {
        if (signal?.aborted) {
            const abortErr = new Error('Upload cancelled');
            abortErr.name = 'AbortError';
            return reject(abortErr);
        }
        const timer = setTimeout(() => {
            signal?.removeEventListener('abort', onAbort);
            resolve();
        }, ms);
        const onAbort = () => {
            clearTimeout(timer);
            const abortErr = new Error('Upload cancelled');
            abortErr.name = 'AbortError';
            reject(abortErr);
        };
        signal?.addEventListener('abort', onAbort, { once: true });
    });

const uploadVideoToX02 = async (
    file: FileAsset,
    onProgress?: (data: { bytesSent: number; totalBytes: number }) => void,
    signal?: AbortSignal
): Promise<string> => {
    const { x02ApiKey } = useSettingsStore.getState();
    const fsFile = new FSFile(file.uri);
    const headers: Record<string, string> = {
        'x-response-format': 'json',
    };
    if (x02ApiKey) {
        headers['x-api-key'] = x02ApiKey;
    }

    const result = await runCancellableNativeUpload(
        fsFile,
        'https://up.x02.me/api/upload?format=json',
        {
            httpMethod: 'POST',
            uploadType: UploadType.MULTIPART,
            fieldName: 'file',
            mimeType: file.type || 'video/mp4',
            headers,
            onProgress,
            signal,
        }
    );

    if (result.status < 200 || result.status >= 300) {
        throw new Error(`x02.me video upload failed with status ${result.status}`);
    }

    let resData: any;
    try {
        resData = JSON.parse(result.body);
    } catch {
        throw new Error('x02.me returned an invalid response');
    }

    if (!resData?.success || !resData?.data?.url) {
        throw new Error(resData?.error || 'x02.me video upload failed');
    }

    return resData.data.url;
};

const uploadVideoViaX02 = async (
    profileId: string,
    file: FileAsset,
    options: UploadMediaOptions = {},
    onProgress?: (data: { bytesSent: number; totalBytes: number }) => void
): Promise<UploadMediaResponse> => {
    const fingerprint = await computeFileFingerprint(file);

    // 1. Check if we already uploaded this exact binary to x02.me
    const cachedRemote = getCachedRemoteBinary(fingerprint, 'welove');
    if (cachedRemote?.url) {
        onProgress?.({ bytesSent: 100, totalBytes: 100 });
        return createMediaRecord(
            profileId,
            cachedRemote.url,
            'video',
            {
                caption: options.caption,
                post_id: options.post_id,
                width: file.width || cachedRemote.width || null,
                height: file.height || cachedRemote.height || null,
                blurhash: options.blurhash || file.blurhash || cachedRemote.blurhash || null,
            },
            options.signal
        );
    }

    let lastError: unknown = null;

    for (let attempt = 1; attempt <= VIDEO_UPLOAD_MAX_RETRIES; attempt += 1) {
        if (options.signal?.aborted) {
            const abortErr = new Error('Upload cancelled');
            abortErr.name = 'AbortError';
            throw abortErr;
        }
        try {
            const videoUrl = await uploadVideoToX02(file, onProgress, options.signal);
            setCachedRemoteBinary(fingerprint, {
                url: videoUrl,
                width: file.width || null,
                height: file.height || null,
                blurhash: options.blurhash || file.blurhash || null,
                provider: 'welove',
                uploadedAt: Date.now(),
            });
            return await createMediaRecord(
                profileId,
                videoUrl,
                'video',
                {
                    caption: options.caption,
                    post_id: options.post_id,
                    width: file.width || null,
                    height: file.height || null,
                    blurhash: options.blurhash || file.blurhash || null,
                },
                options.signal
            );
        } catch (error) {
            if (isUploadAbortError(error) || options.signal?.aborted) {
                throw error;
            }
            lastError = error;
            if (attempt < VIDEO_UPLOAD_MAX_RETRIES) {
                await sleep(VIDEO_UPLOAD_RETRY_DELAY_MS, options.signal);
            }
        }
    }

    throw new Error(
        `Video upload failed after ${VIDEO_UPLOAD_MAX_RETRIES} retries. ${lastError instanceof Error ? lastError.message : ''}`.trim()
    );
};

/**
 * Get a pre-signed URL for uploading large files directly to storage
 * Best for larger files (> 5MB) to avoid server memory issues
 */
export const getUploadUrl = async (
    profileId: string,
    filename: string,
    type: MediaType = 'photo',
    signal?: AbortSignal
): Promise<PresignedUploadInfo> => {
    const response = await client.get<PresignedUploadInfo>(
        `/api/profiles/${profileId}/media/client`,
        { params: { filename, type }, signal, timeout: 20_000 }
    );
    return response.data;
};

/**
 * Upload a file using a pre-signed URL (direct to Oracle storage)
 * Use this for large files to bypass server memory limits
 */
export const uploadWithPresignedUrl = async (
    uploadUrl: string,
    file: FileAsset,
    onProgress?: (data: { bytesSent: number; totalBytes: number }) => void,
    signal?: AbortSignal
): Promise<void> => {
    const fsFile = new FSFile(file.uri);
    const result = await runCancellableNativeUpload(fsFile, uploadUrl, {
        httpMethod: 'PUT',
        uploadType: UploadType.BINARY_CONTENT,
        headers: {
            'Content-Type': file.type || 'application/octet-stream',
        },
        onProgress,
        signal,
    });

    if (result.status < 200 || result.status >= 300) {
        throw new Error(`Upload failed with status ${result.status}`);
    }
};

/**
 * Create a media record after pre-signed upload
 * Call this after uploadWithPresignedUrl to register the media in the database
 */
export const createMediaRecord = async (
    profileId: string,
    url: string,
    type: MediaType,
    options: {
        caption?: string;
        post_id?: string;
        thumbnail_url?: string | null;
        width?: number | null;
        height?: number | null;
        blurhash?: string | null;
    } = {},
    signal?: AbortSignal
): Promise<UploadMediaResponse> => {
    const response = await client.post<UploadMediaResponse>(
        `/api/profiles/${profileId}/media/client/create`,
        {
            url,
            type,
            caption: options.caption,
            post_id: options.post_id,
            thumbnail_url: options.thumbnail_url,
            width: options.width,
            height: options.height,
            blurhash: options.blurhash,
        },
        { signal, timeout: 20_000 }
    );
    return response.data;
};

/**
 * Upload a large file via pre-signed URL then create the media record
 */
export const uploadLargeMedia = async (
    profileId: string,
    file: FileAsset,
    options: UploadMediaOptions = {},
    onProgress?: (data: { bytesSent: number; totalBytes: number }) => void
): Promise<UploadMediaResponse> => {
    const type = options.type || getMediaType(file);
    const { x02ApiKey } = useSettingsStore.getState();

    if (type === 'video' && x02ApiKey) {
        try {
            return await uploadVideoViaX02(profileId, file, options, onProgress);
        } catch (e) {
            if (isUploadAbortError(e) || options.signal?.aborted) {
                throw e;
            }
            console.warn('[mediaUpload] x02 video upload failed, falling back to WeLove direct storage:', e);
        }
    }

    const fingerprint = await computeFileFingerprint(file);

    let blurhash = options.blurhash || file.blurhash;
    if (!blurhash && type === 'photo') {
        blurhash = (await generateBlurhash(file.uri)) || undefined;
    }

    let width = file.width || null;
    let height = file.height || null;
    if ((!width || !height) && type === 'photo' && file.uri) {
        const dims = await getImageDimensions(file.uri);
        if (dims) {
            width = width || dims.width;
            height = height || dims.height;
        }
    }

    // Check if the binary was already uploaded to WeLove cloud storage (e.g. createMediaRecord failed previously)
    const cachedRemote = getCachedRemoteBinary(fingerprint, 'welove');
    if (cachedRemote?.url) {
        onProgress?.({ bytesSent: 100, totalBytes: 100 });
        return createMediaRecord(
            profileId,
            cachedRemote.url,
            type,
            {
                caption: options.caption,
                post_id: options.post_id,
                width: width ?? cachedRemote.width ?? null,
                height: height ?? cachedRemote.height ?? null,
                blurhash: blurhash ?? cachedRemote.blurhash ?? null,
            },
            options.signal
        );
    }

    const filename = file.name || `upload.${getFileExtension(file)}`;
    const uploadInfo = await getUploadUrl(profileId, filename, type, options.signal);
    await uploadWithPresignedUrl(uploadInfo.uploadUrl, file, onProgress, options.signal);

    if (!uploadInfo.readUrl) {
        throw new Error('Failed to get read URL for uploaded file');
    }

    setCachedRemoteBinary(fingerprint, {
        url: uploadInfo.readUrl,
        width,
        height,
        blurhash: blurhash ?? null,
        provider: 'welove',
        uploadedAt: Date.now(),
    });

    return createMediaRecord(
        profileId,
        uploadInfo.readUrl,
        type,
        {
            caption: options.caption,
            post_id: options.post_id,
            width,
            height,
            blurhash,
        },
        options.signal
    );
};

/**
 * Smart upload — uses content-addressed SHA-256 deduplication and native streaming upload
 * with progress tracking and cancellation support for both photos and videos.
 */
export const smartUpload = async (
    profileId: string,
    file: FileAsset,
    options: UploadMediaOptions = {},
    onProgress?: (data: { bytesSent: number; totalBytes: number }) => void
): Promise<UploadMediaResponse> => {
    const fingerprint = await computeFileFingerprint(file);

    // 1. Check persistent SHA-256 ledger for an already-created unattached Media record for this profile
    const cachedMedia = getCachedUnattachedMediaRecord(fingerprint, profileId, 'welove');
    if (cachedMedia) {
        onProgress?.({ bytesSent: 100, totalBytes: 100 });
        return { data: cachedMedia };
    }

    // 2. Always use uploadLargeMedia (native FSFile streaming with presigned URL / x02 + progress + cancellation)
    const response = await uploadLargeMedia(profileId, file, options, onProgress);

    // 3. Persist in SHA-256 ledger so interrupted batches or failed post submissions reuse this Media record
    if (fingerprint && response?.data) {
        setCachedMediaRecord(fingerprint, profileId, 'welove', response.data);
    }

    return response;
};

/**
 * Delete a media item
 */
export const deleteMedia = async (
    profileId: string,
    mediaId: string,
    deleteFile: boolean = true
): Promise<DeleteMediaResponse> => {
    const response = await client.delete<DeleteMediaResponse>(
        `/api/profiles/${profileId}/media/client/${mediaId}`,
        { params: { deleteFile } }
    );
    return response.data;
};

/**
 * Update media metadata (caption, link to post)
 */
export const updateMedia = async (
    profileId: string,
    mediaId: string,
    data: { caption?: string; post_id?: string | null }
): Promise<UploadMediaResponse> => {
    const response = await client.put<UploadMediaResponse>(
        `/api/profiles/${profileId}/media/client/${mediaId}`,
        data
    );
    return response.data;
};

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook for uploading a single media file
 */
export const useUploadMedia = (profileId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ file, options }: { file: FileAsset; options?: UploadMediaOptions }) =>
            smartUpload(profileId, file, options),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['media', profileId] });
        },
    });
};

/**
 * Hook for uploading multiple media files
 */
export const useUploadMultipleMedia = (profileId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            files,
            options,
        }: {
            files: FileAsset[];
            options?: UploadMediaOptions;
        }) => {
            const uploadedMedia: Media[] = [];

            for (const file of files) {
                const result = await smartUpload(profileId, file, options);
                uploadedMedia.push(result.data);
            }

            return uploadedMedia;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['media', profileId] });
        },
    });
};

/**
 * Hook for deleting media
 */
export const useDeleteMedia = (profileId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ mediaId, deleteFile = true }: { mediaId: string; deleteFile?: boolean }) =>
            deleteMedia(profileId, mediaId, deleteFile),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['media', profileId] });
        },
    });
};

/**
 * Hook for updating media metadata
 */
export const useUpdateMedia = (profileId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            mediaId,
            data,
        }: {
            mediaId: string;
            data: { caption?: string; post_id?: string | null };
        }) => updateMedia(profileId, mediaId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['media', profileId] });
        },
    });
};
