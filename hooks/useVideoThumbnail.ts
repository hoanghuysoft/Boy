import * as VideoThumbnails from 'expo-video-thumbnails';
import { useEffect, useState } from 'react';

// In-memory cache to avoid regenerating thumbnails
// Key: video URL, Value: generated thumbnail URI
const thumbnailCache = new Map<string, string>();

// Track pending generations to avoid duplicate requests
const pendingGenerations = new Map<string, Promise<string | null>>();

/**
 * Generate a thumbnail for a video URL with caching
 * Returns the cached/generated thumbnail or null if failed
 */
export const generateVideoThumbnail = async (videoUrl: string): Promise<string | null> => {
    // Check cache first
    const cached = thumbnailCache.get(videoUrl);
    if (cached) {
        return cached;
    }

    // Check if there's already a pending generation for this URL
    const pending = pendingGenerations.get(videoUrl);
    if (pending) {
        return pending;
    }

    // Create new generation promise
    const generationPromise = (async () => {
        try {
            const { uri } = await VideoThumbnails.getThumbnailAsync(videoUrl, {
                time: 1000, // Get thumbnail at 1 second
                quality: 0.7, // Good quality but not too heavy
            });

            // Cache the result
            thumbnailCache.set(videoUrl, uri);
            pendingGenerations.delete(videoUrl);
            return uri;
        } catch (error) {
            console.warn('Failed to generate video thumbnail:', error);
            pendingGenerations.delete(videoUrl);
            return null;
        }
    })();

    pendingGenerations.set(videoUrl, generationPromise);
    return generationPromise;
};

/**
 * Hook to get video thumbnail with automatic generation if needed
 * Priority: thumbnail_url > generated thumbnail > placeholder
 */
export const useVideoThumbnail = (
    videoUrl: string | undefined,
    thumbnailUrl: string | undefined | null,
    placeholderUrl: string
): string => {
    // If we already have a thumbnail URL from the API, use it
    const [displayUrl, setDisplayUrl] = useState<string>(
        thumbnailUrl || placeholderUrl
    );

    useEffect(() => {
        // If thumbnail URL exists, use it directly
        if (thumbnailUrl) {
            setDisplayUrl(thumbnailUrl);
            return;
        }

        // No thumbnail URL - try to generate one
        if (videoUrl) {
            // Check cache synchronously first
            const cached = thumbnailCache.get(videoUrl);
            if (cached) {
                setDisplayUrl(cached);
                return;
            }

            // Generate thumbnail
            generateVideoThumbnail(videoUrl).then((generatedUri) => {
                if (generatedUri) {
                    setDisplayUrl(generatedUri);
                } else {
                    setDisplayUrl(placeholderUrl);
                }
            });
        } else {
            setDisplayUrl(placeholderUrl);
        }
    }, [videoUrl, thumbnailUrl, placeholderUrl]);

    return displayUrl;
};

/**
 * Prefetch video thumbnails for a list of videos
 * Used for batch processing (e.g., when grid loads)
 */
export const prefetchVideoThumbnails = async (videos: { url: string; thumbnail_url?: string | null }[]) => {
    const videosWithoutThumbnails = videos.filter(v => !v.thumbnail_url);

    // Generate thumbnails in parallel (but limit concurrency)
    const batchSize = 3;
    for (let i = 0; i < videosWithoutThumbnails.length; i += batchSize) {
        const batch = videosWithoutThumbnails.slice(i, i + batchSize);
        await Promise.all(batch.map(v => generateVideoThumbnail(v.url)));
    }
};

export default useVideoThumbnail;
