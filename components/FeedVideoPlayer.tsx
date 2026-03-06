import { useCachedVideoUri } from '@/hooks/useCachedVideoUri';
import { useFeedVideoStore } from '@/stores/feedVideo';
import React, { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, View } from 'react-native';
import Video, { OnLoadData, VideoRef } from 'react-native-video';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ASPECT_RATIO = 3 / 4;
const VIDEO_HEIGHT = SCREEN_WIDTH / ASPECT_RATIO;

/**
 * FeedVideoPlayer - A singleton video player for the feed.
 * 
 * This component is rendered INSIDE the VideoCarouselItem slot when it is the
 * active video. It does NOT float/overlay — it renders inline in the cell.
 * 
 * RecyclerListView recycling is safe because:
 * - The parent VideoCarouselItem conditionally renders this only when postId matches
 * - When the cell is recycled, PostMediaCarousel re-evaluates with new post data
 * - The store's activePostId won't match, so the old cell gets a thumbnail instead
 */
export const FeedVideoPlayer: React.FC = React.memo(() => {
    const videoRef = useRef<VideoRef>(null);
    const activeVideoUrl = useFeedVideoStore(s => s.activeVideoUrl);
    const isMuted = useFeedVideoStore(s => s.isMuted);
    const isEnded = useFeedVideoStore(s => s.isEnded);
    const setEnded = useFeedVideoStore(s => s.setEnded);
    const [isBuffering, setIsBuffering] = React.useState(true);

    // Resolve against video cache — if Shots already downloaded this video,
    // play from local storage for instant start.
    const resolvedVideoUrl = useCachedVideoUri(activeVideoUrl);

    // When the video ends, mark it as ended (show replay button, don't loop)
    const handleEnd = useCallback(() => {
        setEnded(true);
        videoRef.current?.seek(0);
    }, [setEnded]);

    const handleLoad = useCallback((_data: OnLoadData) => {
        setIsBuffering(false);
    }, []);

    const handleBuffer = useCallback(({ isBuffering: buffering }: { isBuffering: boolean }) => {
        setIsBuffering(buffering);
    }, []);

    // Reset buffering state when video URL changes
    useEffect(() => {
        if (activeVideoUrl) {
            setIsBuffering(true);
        }
    }, [activeVideoUrl]);

    if (!resolvedVideoUrl || isEnded) {
        return null;
    }

    return (
        <View style={styles.container} pointerEvents="none">
            <Video
                ref={videoRef}
                source={{ uri: resolvedVideoUrl }}
                style={styles.video}
                resizeMode="cover"
                controls={false}
                muted={isMuted}
                paused={false}
                repeat={false}
                onEnd={handleEnd}
                onLoad={handleLoad}
                onBuffer={handleBuffer}
                bufferConfig={{
                    minBufferMs: 2000,
                    maxBufferMs: 10000,
                    bufferForPlaybackMs: 500,
                    bufferForPlaybackAfterRebufferMs: 1000,
                }}
            />
            {isBuffering && (
                <View style={styles.bufferingOverlay}>
                    <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" />
                </View>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        width: SCREEN_WIDTH,
        height: VIDEO_HEIGHT,
        backgroundColor: '#000',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    bufferingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
