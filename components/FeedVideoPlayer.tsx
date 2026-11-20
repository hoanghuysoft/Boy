import PauseIcon from "@/assets/images/svg/pause.svg";
import PlayIcon from "@/assets/images/svg/play.svg";
import SoundMuteIcon from "@/assets/images/svg/sound-mute-1.svg";
import SoundIcon from "@/assets/images/svg/sound.svg";
import { buildCachedVideoSource } from "@/services/videoCache";
import { useFeedVideoStore } from '@/stores/feedVideo';
import { useSettingsStore } from '@/stores/settings';
import { BlueskyVideoView } from '@bsky.app/video';
import { useEventListener } from "expo";
import { type BufferOptions, useVideoPlayer, VideoView } from "expo-video";
import { Spinner } from "panelui-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

const ASPECT_RATIO = 3 / 4;

const FEED_BUFFER_OPTIONS: BufferOptions = {
    preferredForwardBufferDuration: Platform.OS === 'ios' ? 0 : 15,
    minBufferForPlayback: 1,
    maxBufferBytes: 0,
    prioritizeTimeOverSizeThreshold: true,
};

interface FeedVideoPlayerProps {
    videoUrl: string;
}

interface ActivePlayerHandle {
    togglePlayback: () => void;
    toggleMuted: () => void;
    enterFullscreen: () => void;
}

interface ActiveFeedVideoProps {
    videoUrl: string;
    isMuted: boolean;
    onLoadingChange: (loading: boolean) => void;
    onPlayingChange: (playing: boolean) => void;
    onTimeRemainingChange: (remaining: number) => void;
    onError: (err: string) => void;
}

const ActiveFeedVideo = React.memo(
    React.forwardRef<ActivePlayerHandle, ActiveFeedVideoProps>(
        ({ videoUrl, isMuted, onLoadingChange, onPlayingChange, onTimeRemainingChange, onError }, ref) => {
            const videoViewRef = useRef<VideoView>(null);
            const enteredFullscreenMutedRef = useRef(isMuted);

            const videoSource = useMemo(() => buildCachedVideoSource(videoUrl), [videoUrl]);

            const player = useVideoPlayer(videoSource, (p) => {
                p.loop = true;
                p.muted = isMuted;
                p.timeUpdateEventInterval = 0.5;
                p.bufferOptions = FEED_BUFFER_OPTIONS;
                p.play();
            });

            useEffect(() => {
                try {
                    player.muted = isMuted;
                } catch { }
            }, [player, isMuted]);

            useEventListener(player, 'statusChange', ({ status, error }) => {
                if (status === 'loading') {
                    onLoadingChange(true);
                } else if (status === 'readyToPlay') {
                    onLoadingChange(false);
                } else if (status === 'error') {
                    onLoadingChange(false);
                    if (error?.message) onError(error.message);
                }
            });

            useEventListener(player, 'playingChange', ({ isPlaying }) => {
                onPlayingChange(isPlaying);
                if (isPlaying) onLoadingChange(false);
            });

            useEventListener(player, 'mutedChange', ({ muted }) => {
                useFeedVideoStore.getState().setMuted(muted);
            });

            useEventListener(player, 'timeUpdate', ({ currentTime }) => {
                const dur = player.duration ?? 0;
                if (dur > 0) {
                    onTimeRemainingChange(Math.max(0, Math.round(dur - currentTime)));
                }
            });

            React.useImperativeHandle(ref, () => ({
                togglePlayback: () => {
                    try {
                        if (player.playing) player.pause();
                        else player.play();
                    } catch { }
                },
                toggleMuted: () => {
                    try {
                        const next = !player.muted;
                        player.muted = next;
                        useFeedVideoStore.getState().setMuted(next);
                    } catch { }
                },
                enterFullscreen: () => {
                    try {
                        enteredFullscreenMutedRef.current = player.muted;
                        player.muted = false;
                        useFeedVideoStore.getState().setMuted(false);
                        if (!player.playing) player.play();
                        videoViewRef.current?.enterFullscreen();
                    } catch { }
                },
            }), [player]);

            return (
                <VideoView
                    ref={videoViewRef}
                    player={player}
                    style={styles.video}
                    contentFit="cover"
                    nativeControls={false}
                    surfaceType={Platform.OS === 'android' ? 'textureView' : 'surfaceView'}
                    onFirstFrameRender={() => onLoadingChange(false)}
                    onFullscreenExit={() => {
                        try {
                            if (enteredFullscreenMutedRef.current) {
                                player.muted = true;
                                useFeedVideoStore.getState().setMuted(true);
                            }
                        } catch { }
                    }}
                />
            );
        },
    ),
);
ActiveFeedVideo.displayName = 'ActiveFeedVideo';

export const FeedVideoPlayer: React.FC<FeedVideoPlayerProps> = React.memo(({ videoUrl }) => {
    const { width: screenWidth } = useWindowDimensions();
    const videoHeight = screenWidth / ASPECT_RATIO;
    const isMuted = useFeedVideoStore(s => s.isMuted);
    const setEnded = useFeedVideoStore(s => s.setEnded);
    const disableAutoplay = useSettingsStore(s => s.disableAutoplay);
    const activeVideoRef = useRef<ActivePlayerHandle>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isViewportActive, setIsViewportActive] = useState(false);
    const [isManualActive, setIsManualActive] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);

    const isActive = (isViewportActive && !disableAutoplay) || isManualActive;

    const handleTogglePlayback = useCallback(() => {
        if (activeVideoRef.current) {
            activeVideoRef.current.togglePlayback();
        } else {
            setIsLoading(true);
            setIsManualActive(true);
        }
    }, []);

    const handleEnterFullscreen = useCallback(() => {
        activeVideoRef.current?.enterFullscreen();
    }, []);

    const formattedTime = React.useMemo(() => {
        if (isNaN(timeRemaining) || timeRemaining < 0) return '0:00';
        const mins = Math.floor(timeRemaining / 60);
        const secs = Math.floor(timeRemaining % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }, [timeRemaining]);

    if (!videoUrl) {
        return null;
    }

    return (
        <View style={[styles.container, { width: screenWidth, height: videoHeight }]}>
            <BlueskyVideoView
                url={videoUrl}
                autoplay={false}
                beginMuted={isMuted}
                style={StyleSheet.absoluteFill}
                onActiveChange={e => {
                    const active = e.nativeEvent.isActive;
                    setIsViewportActive(active);
                    if (!active) {
                        setIsManualActive(false);
                        setIsPlaying(false);
                        setEnded(true);
                    } else if (!disableAutoplay) {
                        setIsLoading(true);
                    }
                }}
                accessibilityLabel="Video"
                accessibilityHint=""
            />

            {isActive && (
                <ActiveFeedVideo
                    ref={activeVideoRef}
                    videoUrl={videoUrl}
                    isMuted={isMuted}
                    onLoadingChange={setIsLoading}
                    onPlayingChange={setIsPlaying}
                    onTimeRemainingChange={setTimeRemaining}
                    onError={err => console.warn('[FeedVideoPlayer] Error:', err)}
                />
            )}

            {/* Controls overlay: visible when video is active and not loading. */}
            {isActive && !isLoading && (
                <>
                    {/* Fullscreen tap area */}
                    <Pressable
                        onPress={handleEnterFullscreen}
                        style={StyleSheet.absoluteFill}
                    />
                    {/* Play/Pause Button */}
                    <Pressable
                        onPress={handleTogglePlayback}
                        style={{
                            position: 'absolute',
                            left: 12,
                            bottom: 12,
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 10,
                        }}
                    >
                        {isPlaying ? (
                            <PauseIcon width={16} height={16} color="#ffffff" />
                        ) : (
                            <PlayIcon width={16} height={16} color="#ffffff" />
                        )}
                    </Pressable>
                    {/* Time remaining badge */}
                    <View
                        style={{
                            position: 'absolute',
                            left: 56,
                            bottom: 12,
                            height: 36,
                            paddingHorizontal: 12,
                            borderRadius: 18,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 10,
                        }}
                    >
                        <Text
                            style={{
                                color: '#ffffff',
                                fontSize: 12,
                                fontWeight: '600',
                                fontVariant: ['tabular-nums'],
                            }}
                        >
                            {formattedTime}
                        </Text>
                    </View>
                    {/* Mute/Unmute Button */}
                    <Pressable
                        onPress={() => activeVideoRef.current?.toggleMuted()}
                        style={{
                            position: 'absolute',
                            right: 12,
                            bottom: 12,
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 10,
                        }}
                    >
                        {isMuted ? (
                            <SoundMuteIcon width={16} height={16} color="#ffffff" />
                        ) : (
                            <SoundIcon width={16} height={16} color="#ffffff" />
                        )}
                    </Pressable>
                </>
            )}

            {/* Loading spinner overlay — matches Bluesky's pattern */}
            {isActive && isLoading && (
                <View style={styles.loadingOverlay} pointerEvents="none">
                    <Spinner size="lg" color="white" />
                </View>
            )}

            {/* Thumbnail overlay when not active (native manages this, but we
                add a play button hint for UX consistency) */}
            {!isActive && (
                <Pressable
                    onPress={handleTogglePlayback}
                    style={styles.inactiveOverlay}
                >
                    <View style={styles.playButton}>
                        <PlayIcon width={28} height={28} color="#ffffff" />
                    </View>
                </Pressable>
            )}
        </View>
    );
});
FeedVideoPlayer.displayName = 'FeedVideoPlayer';

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#000',
    },
    video: {
        width: '100%',
        height: '100%',
        borderRadius: 4,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inactiveOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    playButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
