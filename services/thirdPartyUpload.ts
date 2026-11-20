import { useSettingsStore } from '@/stores/settings';
import { File as FSFile, UploadType } from 'expo-file-system';
import {
    computeFileFingerprint,
    createMediaRecord,
    FileAsset,
    generateBlurhash,
    getCachedRemoteBinary,
    getCachedUnattachedMediaRecord,
    getImageDimensions,
    runCancellableNativeUpload,
    setCachedMediaRecord,
    setCachedRemoteBinary,
    UploadMediaResponse,
} from './mediaUpload';

export interface ThirdPartyUploadResult {
    url: string;
    thumbnailUrl?: string | null;
    width?: number | null;
    height?: number | null;
    blurhash?: string | null;
}

export const uploadToThirdParty = async (
    file: FileAsset,
    onProgress?: (data: { bytesSent: number; totalBytes: number }) => void,
    signal?: AbortSignal
): Promise<ThirdPartyUploadResult> => {
    const fingerprint = await computeFileFingerprint(file);

    // 1. Check if this exact binary was already uploaded to ImgBB / x02.me
    const cachedRemote = getCachedRemoteBinary(fingerprint, 'thirdparty');
    if (cachedRemote?.url) {
        onProgress?.({ bytesSent: 100, totalBytes: 100 });
        return {
            url: cachedRemote.url,
            thumbnailUrl: cachedRemote.thumbnailUrl ?? null,
            width: file.width || cachedRemote.width || null,
            height: file.height || cachedRemote.height || null,
            blurhash: file.blurhash || cachedRemote.blurhash || null,
        };
    }

    const { imgbbApiKey, x02ApiKey } = useSettingsStore.getState();

    const isVideo =
        file.type?.startsWith('video/') ||
        file.uri.toLowerCase().includes('.mp4') ||
        file.uri.toLowerCase().includes('.mov') ||
        file.uri.toLowerCase().includes('.webm');

    // Calculate blurhash in parallel if missing for photos
    const blurhashPromise = file.blurhash
        ? Promise.resolve(file.blurhash)
        : !isVideo && file.uri
            ? generateBlurhash(file.uri)
            : Promise.resolve(null);

    // Calculate dimensions in parallel if missing for photos
    const dimensionsPromise =
        (!file.width || !file.height) && !isVideo && file.uri
            ? getImageDimensions(file.uri)
            : Promise.resolve(null);

    if (isVideo) {
        if (!x02ApiKey) {
            throw new Error(
                'x02.me API Key is required for third-party video uploads. Please configure it in Settings or switch off Third-Party Cloud.'
            );
        }

        // Videos go to x02.me
        const fsFile = new FSFile(file.uri);
        const headers: Record<string, string> = {
            'x-response-format': 'json',
            'x-api-key': x02ApiKey,
        };

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
            throw new Error(`x02.me upload failed with status ${result.status}`);
        }

        let resData: any;
        try {
            resData = JSON.parse(result.body);
        } catch {
            throw new Error('x02.me returned an invalid response');
        }

        if (!resData?.success || !resData?.data?.url) {
            throw new Error(resData?.error || 'x02.me upload failed');
        }

        const calculatedDims = await dimensionsPromise;
        const width = file.width || calculatedDims?.width || null;
        const height = file.height || calculatedDims?.height || null;
        const blurhash = await blurhashPromise;

        const uploadResult: ThirdPartyUploadResult = {
            url: resData.data.url,
            thumbnailUrl: null,
            width,
            height,
            blurhash,
        };

        setCachedRemoteBinary(fingerprint, {
            ...uploadResult,
            provider: 'thirdparty',
            uploadedAt: Date.now(),
        });

        return uploadResult;
    } else {
        // Images go to ImgBB
        if (!imgbbApiKey) {
            throw new Error('ImgBB API Key is required for image uploads. Please enter it in Settings.');
        }

        const fsFile = new FSFile(file.uri);
        const result = await runCancellableNativeUpload(
            fsFile,
            'https://api.imgbb.com/1/upload',
            {
                httpMethod: 'POST',
                uploadType: UploadType.MULTIPART,
                fieldName: 'image',
                mimeType: file.type || 'image/jpeg',
                parameters: {
                    key: imgbbApiKey,
                },
                onProgress,
                signal,
            }
        );

        if (result.status < 200 || result.status >= 300) {
            throw new Error(`ImgBB upload failed with status ${result.status}`);
        }

        let resData: any;
        try {
            resData = JSON.parse(result.body);
        } catch {
            throw new Error('ImgBB returned an invalid response');
        }

        if (!resData?.success || !resData?.data?.url) {
            throw new Error(resData?.error?.message || 'ImgBB upload failed');
        }

        const calculatedDims = await dimensionsPromise;
        const width = resData.data.width
            ? Number(resData.data.width)
            : file.width || calculatedDims?.width || null;
        const height = resData.data.height
            ? Number(resData.data.height)
            : file.height || calculatedDims?.height || null;
        const blurhash = await blurhashPromise;

        const uploadResult: ThirdPartyUploadResult = {
            url: resData.data.url,
            thumbnailUrl: resData.data.thumb?.url || null,
            width,
            height,
            blurhash,
        };

        setCachedRemoteBinary(fingerprint, {
            ...uploadResult,
            provider: 'thirdparty',
            uploadedAt: Date.now(),
        });

        return uploadResult;
    }
};

/**
 * Full third-party upload + DB Media record creation with SHA-256 deduplication.
 * Reuses both the remote ImgBB/x02.me URL and the created Media record on retry.
 */
export const smartThirdPartyUpload = async (
    profileId: string,
    file: FileAsset,
    isVideo: boolean,
    onProgress?: (data: { bytesSent: number; totalBytes: number }) => void,
    signal?: AbortSignal
): Promise<UploadMediaResponse> => {
    const fingerprint = await computeFileFingerprint(file);

    const cachedMedia = getCachedUnattachedMediaRecord(fingerprint, profileId, 'thirdparty');
    if (cachedMedia) {
        onProgress?.({ bytesSent: 100, totalBytes: 100 });
        return { data: cachedMedia };
    }

    const uploadResult = await uploadToThirdParty(file, onProgress, signal);
    const mediaType = isVideo ? 'video' : 'photo';

    const createdRecord = await createMediaRecord(
        profileId,
        uploadResult.url,
        mediaType,
        {
            thumbnail_url: uploadResult.thumbnailUrl,
            width: uploadResult.width,
            height: uploadResult.height,
            blurhash: uploadResult.blurhash,
        },
        signal
    );

    if (fingerprint && createdRecord?.data) {
        setCachedMediaRecord(fingerprint, profileId, 'thirdparty', createdRecord.data);
    }

    return createdRecord;
};
