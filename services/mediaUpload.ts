/**
 * Client API service for profile owners to upload and manage media
 * Uses the /client endpoints which verify profile ownership
 *
 * Supports both direct upload and pre-signed URL upload for large files
 */

import { Media, MediaType } from '@/types/media';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from './client';

// ============================================================================
// Types
// ============================================================================

export interface UploadMediaOptions {
    caption?: string;
    post_id?: string;
    type?: MediaType;
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
    const formData = new FormData();

    formData.append('file', {
        uri: file.uri,
        name: file.name || `upload.${getFileExtension(file)}`,
        type: file.type || 'image/jpeg',
    } as any);

    if (options.caption) formData.append('caption', options.caption);
    if (options.post_id) formData.append('post_id', options.post_id);
    if (options.type) formData.append('type', options.type);

    const response = await client.post<UploadMediaResponse>(
        `api/profiles/${profileId}/media/client`,
        formData,
    );

    return response.data;
};

/**
 * Get a pre-signed URL for uploading large files directly to storage
 * Best for larger files (> 5MB) to avoid server memory issues
 */
export const getUploadUrl = async (
    profileId: string,
    filename: string,
    type: MediaType = 'photo'
): Promise<PresignedUploadInfo> => {
    const response = await client.get<PresignedUploadInfo>(
        `/api/profiles/${profileId}/media/client`,
        { params: { filename, type } }
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
): Promise<void> => {
    const fileResponse = await fetch(file.uri);
    const blob = await fileResponse.blob();

    await fetch(uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: {
            'Content-Type': file.type || 'application/octet-stream',
        },
    });
};

/**
 * Create a media record after pre-signed upload
 * Call this after uploadWithPresignedUrl to register the media in the database
 */
export const createMediaRecord = async (
    profileId: string,
    url: string,
    type: MediaType,
    options: { caption?: string; post_id?: string } = {}
): Promise<UploadMediaResponse> => {
    const response = await client.post<UploadMediaResponse>(
        `/api/profiles/${profileId}/media/client/create`,
        {
            url,
            type,
            caption: options.caption,
            post_id: options.post_id,
        }
    );
    return response.data;
};

/**
 * Upload a large file via pre-signed URL then create the media record
 */
export const uploadLargeMedia = async (
    profileId: string,
    file: FileAsset,
    options: UploadMediaOptions = {}
): Promise<UploadMediaResponse> => {
    const type = options.type || getMediaType(file);
    const filename = file.name || `upload.${getFileExtension(file)}`;

    const uploadInfo = await getUploadUrl(profileId, filename, type);
    await uploadWithPresignedUrl(uploadInfo.uploadUrl, file);

    if (!uploadInfo.readUrl) {
        throw new Error('Failed to get read URL for uploaded file');
    }

    return createMediaRecord(profileId, uploadInfo.readUrl, type, {
        caption: options.caption,
        post_id: options.post_id,
    });
};

/**
 * Smart upload — automatically chooses the best upload method based on file size
 */
export const smartUpload = async (
    profileId: string,
    file: FileAsset,
    options: UploadMediaOptions = {}
): Promise<UploadMediaResponse> => {
    const LARGE_FILE_THRESHOLD = 5 * 1024 * 1024; // 5MB
    const fileSize = file.fileSize || 0;

    if (fileSize > LARGE_FILE_THRESHOLD) {
        return uploadLargeMedia(profileId, file, options);
    } else {
        return uploadMedia(profileId, file, options);
    }
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
