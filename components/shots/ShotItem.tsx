import { FlexText } from "@/components/FlexText";
import { getCachedUri } from "@/services/videoCache";
import { VideoItem } from "@/types/video";
import { useReanimatedTrueSheet } from "@lodev09/react-native-true-sheet/reanimated";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import MaterialIcons from "@react-native-vector-icons/material-icons/static";
import { Image as ExpoImage } from "expo-image";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    AppState,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from "react-native";
import Reanimated, { useAnimatedStyle } from "react-native-reanimated";
import { useEvent, useVideoPlayer, VideoView } from "react-native-video";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "./constants";
import { FloatingHeart } from "./FloatingHeart";
import { ShotSeekBar } from "./ShotSeekBar";

// ─── Props ──────────────────────────────────────────────────────────
export interface ShotItemProps {
    item: VideoItem;
    isActive: boolean;
    shouldPreload: boolean;
    isFocused: boolean;
    itemHeight: number;
    isMuted: boolean;
    isPaused: boolean;
    isLiked: boolean;
    likeCount: number;
    onToggleMute: () => void;
    onLikePress: () => void;
    onCommentPress: () => void;
    onSeekingChange?: (seeking: boolean) => void;
    colors: any;
    insets: any;
}

// ─── Component ──────────────────────────────────────────────────────
export const ShotItem = React.memo(function ShotItem({
    item,
    isActive,
    shouldPreload,
    isFocused,
    itemHeight,
    isMuted,
    isPaused: externalPaused,
    isLiked,
    likeCount,
    onToggleMute,
    onLikePress,
    onCommentPress,
    onSeekingChange,
    colors,
    insets,
}: ShotItemProps) {
    // ─── Per-item URI resolution ────────────────────────────────
    const [resolvedUri, setResolvedUri] = useState(item.media_url);

    useEffect(() => {
        let cancelled = false;
        getCachedUri(item.media_url).then(uri => {
            if (!cancelled) setResolvedUri(uri);
        });
        return () => { cancelled = true; };
    }, [item.media_url]);

    // ─── Local user-paused state (reference pattern: per-item toggle) ──
    const [userPaused, setUserPaused] = useState(false);
    const isActiveRef = useRef(isActive);
    const userPausedRef = useRef(userPaused);
    const wasActiveRef = useRef(isActive);
    const videoIdRef = useRef(item.id);

    useEffect(() => {
        isActiveRef.current = isActive;
    }, [isActive]);

    useEffect(() => {
        userPausedRef.current = userPaused;
    }, [userPaused]);

    // ─── Shrink via animatedPosition (UI-thread) ─────────────────────
    const { animatedPosition } = useReanimatedTrueSheet();
    const videoAreaStyle = useAnimatedStyle(() => {
        const minHeight = SCREEN_HEIGHT * 0.4;
        return {
            height: Math.max(animatedPosition.value, minHeight),
        };
    });

    // ─── Player setup (reference pattern: replaceSourceAsync + preload) ──
    const player = useVideoPlayer(resolvedUri || '', (p) => {
        p.loop = true;
        p.muted = true;
    });

    // ─── Source management & preloading (from reference VideoViewComponent) ──
    useEffect(() => {
        if (!player) return;

        const currentUri = player.source?.uri;

        if (shouldPreload || isActive) {
            if (!currentUri || currentUri !== resolvedUri) {
                player
                    .replaceSourceAsync({ uri: resolvedUri })
                    .then(() => {
                        try {
                            player.preload();
                        } catch { }
                    })
                    .catch(() => { });
            } else if (player.status === "idle") {
                try {
                    player.preload();
                } catch { }
            }
        }
    }, [shouldPreload, isActive, player, resolvedUri]);

    // ─── Active state management (from reference VideoViewComponent) ──
    useEffect(() => {
        if (!player) return;

        if (item.id !== videoIdRef.current) {
            videoIdRef.current = item.id;
        }

        const wasActive = wasActiveRef.current;
        wasActiveRef.current = isActive;
        const becameActive = isActive && !wasActive;
        const becameInactive = !isActive && wasActive;

        if (becameActive) {
            setUserPaused(false);

            if (player.status === "readyToPlay") {
                if (AppState.currentState === "active" && isFocused) {
                    if (!player.isPlaying) {
                        if (player.currentTime < 0.1) {
                            player.currentTime = 0;
                        }
                        player.muted = isMuted;
                        player.play();
                    } else {
                        player.muted = isMuted;
                    }
                }
            } else {
                if (!player.isPlaying && player.currentTime < 0.1) {
                    player.currentTime = 0;
                }
            }
        } else if (becameInactive) {
            // No-op on deactivation, handled below
        }

        const appState = AppState.currentState;
        const shouldPlay = isActive && !userPaused && !externalPaused && appState === "active" && isFocused;

        if (shouldPlay && player.status === "readyToPlay") {
            if (!player.isPlaying) {
                player.muted = isMuted;
                player.play();
            } else {
                player.muted = isMuted;
            }
        } else if (!shouldPlay) {
            player.muted = true;
            if (player.isPlaying) {
                player.pause();
            }
            if (shouldPreload && !isActive && !userPaused) {
                player.currentTime = 0;
            }
        }
    }, [isActive, userPaused, externalPaused, player, shouldPreload, item.id, isFocused, isMuted]);

    // ─── AppState listener (from reference VideoViewComponent) ──
    useEffect(() => {
        const subscription = AppState.addEventListener(
            "change",
            (state) => {
                if (!player) return;
                const currentIsActive = isActiveRef.current;
                const currentUserPaused = userPausedRef.current;
                if (currentIsActive && state === "active" && !currentUserPaused && isFocused) {
                    player.muted = isMuted;
                    player.play();
                } else {
                    player.muted = true;
                    player.pause();
                }
            },
        );
        return () => subscription.remove();
    }, [player, isFocused, isMuted]);

    // Synchronize mute state
    useEffect(() => {
        if (isActive && player) {
            player.muted = isMuted;
        }
    }, [isMuted, player, isActive]);

    // ─── Status change handler (from reference: auto-play when ready) ──
    useEvent(player, "onStatusChange", () => {
        const currentIsActive = isActiveRef.current;
        const currentUserPaused = userPausedRef.current;

        if (
            currentIsActive &&
            !currentUserPaused &&
            !externalPaused &&
            AppState.currentState === "active" &&
            isFocused &&
            player.status === "readyToPlay" &&
            !player.isPlaying
        ) {
            player.muted = isMuted;
            player.play();
        }
    });

    // ─── Progress tracking (from reference VideoViewComponent) ──────
    const [progress, setProgress] = useState(0);

    useEvent(player, "onProgress", () => {
        if (!isActiveRef.current) return;
        const dur = player.duration;
        const cur = player.currentTime;
        if (dur > 0 && Number.isFinite(cur)) {
            setProgress(Math.min(1, Math.max(0, cur / dur)));
        }
    });

    const handleSeek = useCallback(
        (p: number) => {
            if (!isActive || !player) return;
            const dur = player.duration;
            if (dur > 0 && Number.isFinite(dur)) {
                const t = Math.max(0, Math.min(1, p)) * dur;
                player.seekTo(t);
                setProgress(p);
            }
        },
        [isActive, player],
    );

    const duration = useMemo(
        () => player?.duration ?? 0,
        [player?.duration],
    );

    // ─── Double tap to like / single tap to pause ──────────────────
    const [hearts, setHearts] = useState<{ id: number, x: number, y: number }[]>([]);
    const lastTapTime = useRef(0);
    const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleVideoPress = (e: any) => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        if (singleTapTimer.current) {
            clearTimeout(singleTapTimer.current);
            singleTapTimer.current = null;
        }

        if (now - lastTapTime.current < DOUBLE_TAP_DELAY) {
            if (!isLiked) {
                onLikePress();
            }
            const { locationX, locationY } = e.nativeEvent;
            setHearts(prev => [...prev, { id: now + Math.random(), x: locationX, y: locationY }]);
            lastTapTime.current = now;
        } else {
            lastTapTime.current = now;
            singleTapTimer.current = setTimeout(() => {
                setUserPaused(prev => !prev); // Toggle local pause
                singleTapTimer.current = null;
            }, DOUBLE_TAP_DELAY);
        }
    };

    const removeHeart = useCallback((id: number) => {
        setHearts(prev => prev.filter(h => h.id !== id));
    }, []);

    return (
        <View style={[styles.itemContainer, { height: itemHeight }]}>
            {/* Video area — clips equally from top and bottom as sheet rises */}
            <Reanimated.View style={[styles.videoArea, videoAreaStyle]}>
                {/* Fixed full-screen inner view, centered by parent → symmetric clip */}
                <View style={styles.videoContent}>
                    <VideoView
                        player={player}
                        style={StyleSheet.absoluteFill}
                        resizeMode="contain"
                        controls={false}
                    />
                </View>
            </Reanimated.View>

            {/* Tap to pause/play / double tap to like — covers the full item */}
            <TouchableWithoutFeedback onPress={handleVideoPress}>
                <View style={StyleSheet.absoluteFill} />
            </TouchableWithoutFeedback>

            {/* Render Floating Hearts */}
            {hearts.map(heart => (
                <FloatingHeart
                    key={heart.id}
                    x={heart.x}
                    y={heart.y}
                    onComplete={() => removeHeart(heart.id)}
                />
            ))}

            {/* Paused indicator */}
            {(userPaused || externalPaused) && isActive && (
                <View style={styles.pausedOverlay} pointerEvents="none">
                    <Ionicons name="play" size={64} color="rgba(255,255,255,0.8)" />
                </View>
            )}

            {/* Seek bar (from reference VideoOverlay — PanResponder-based) */}
            {isActive && (
                <ShotSeekBar
                    progress={progress}
                    duration={duration}
                    onSeek={handleSeek}
                    onSeekingChange={onSeekingChange}
                    bottom={insets.bottom + 95}
                />
            )}

            {/* Bottom info */}
            <View style={[styles.bottomInfo, { paddingBottom: insets.bottom + 100 }]} pointerEvents="box-none">
                <View style={styles.captionArea}>
                    <TouchableOpacity onPress={() => router.push(`/profile/${item.profile_id}`)}>
                        <FlexText style={styles.captionUsername}>@{item.profile_name}</FlexText>
                    </TouchableOpacity>
                    {item.caption && (
                        <FlexText style={styles.captionDesc} numberOfLines={2}>
                            {item.caption}
                        </FlexText>
                    )}
                </View>
            </View>

            {/* Right side actions */}
            <View style={[styles.rightActions, { bottom: insets.bottom + 110 }]}>
                {/* Mute/Unmute */}
                <TouchableOpacity style={styles.actionButton} onPress={onToggleMute}>
                    <Ionicons
                        name={isMuted ? "volume-mute" : "volume-high"}
                        size={34}
                        color="rgba(255,255,255,0.88)"
                    />
                    <FlexText style={styles.actionText}>
                        {isMuted ? "Muted" : "Mute"}
                    </FlexText>
                </TouchableOpacity>

                {/* Like */}
                <TouchableOpacity style={styles.actionButton} onPress={onLikePress} hitSlop={10}>
                    <Ionicons
                        name="heart"
                        size={34}
                        color={isLiked ? "#ff4d6d" : "rgba(255,255,255,0.88)"}
                    />
                    <FlexText style={[styles.actionText, isLiked && { color: '#ff4d6d' }]}>
                        {likeCount > 0 ? likeCount : 0}
                    </FlexText>
                </TouchableOpacity>

                {/* Comments */}
                <TouchableOpacity style={styles.actionButton} onPress={onCommentPress} hitSlop={10}>
                    <Ionicons
                        name="chatbubble"
                        size={34}
                        color="rgba(255,255,255,0.88)"
                    />
                    <FlexText style={styles.actionText}>
                        {item.comment_count > 0 ? item.comment_count : 0}
                    </FlexText>
                </TouchableOpacity>

                {/* Share (placeholder) */}
                <TouchableOpacity style={styles.actionButton}>
                    <MaterialIcons
                        name="share"
                        size={34}
                        color="rgba(255,255,255,0.88)"
                    />
                    <FlexText style={styles.actionText}>Share</FlexText>
                </TouchableOpacity>

                {/* Profile Avatar */}
                <TouchableOpacity
                    onPress={() => router.push(`/profile/${item.profile_id}`)}
                    style={styles.avatarContainer}
                >
                    {item.profile_avatar ? (
                        <ExpoImage
                            source={{ uri: item.profile_avatar }}
                            style={styles.avatarImage}
                            contentFit="cover"
                        />
                    ) : (
                        <Ionicons
                            name="person"
                            size={20}
                            color="rgba(255,255,255,0.6)"
                        />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.isActive === nextProps.isActive &&
        prevProps.shouldPreload === nextProps.shouldPreload &&
        prevProps.isMuted === nextProps.isMuted &&
        prevProps.isPaused === nextProps.isPaused &&
        prevProps.isFocused === nextProps.isFocused &&
        prevProps.itemHeight === nextProps.itemHeight &&
        prevProps.item.id === nextProps.item.id &&
        prevProps.item.comment_count === nextProps.item.comment_count &&
        prevProps.isLiked === nextProps.isLiked &&
        prevProps.likeCount === nextProps.likeCount
    );
});

ShotItem.displayName = 'ShotItem';

// ─── Styles ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    itemContainer: {
        width: SCREEN_WIDTH,
        backgroundColor: '#000',
        overflow: "hidden",
    },
    videoArea: {
        width: SCREEN_WIDTH,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoContent: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
    },
    pausedOverlay: {
        ...StyleSheet.absoluteFill,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomInfo: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 14,
        zIndex: 1000,
    },
    captionArea: {
        paddingRight: 88,
    },
    captionUsername: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "700",
        marginBottom: 4,
        textShadowColor: "rgba(0,0,0,0.8)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    captionDesc: {
        color: "rgba(255,255,255,0.92)",
        fontSize: 13,
        lineHeight: 18,
        textShadowColor: "rgba(0,0,0,0.8)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    rightActions: {
        position: 'absolute',
        right: 14,
        alignItems: 'center',
        gap: 18,
    },
    actionButton: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionText: {
        color: "rgba(255,255,255,0.88)",
        fontSize: 12,
        marginTop: 4,
        fontWeight: "600",
        textShadowColor: "rgba(0,0,0,0.8)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    avatarContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.2)",
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.4)",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        marginTop: 4,
    },
    avatarImage: {
        width: "100%",
        height: "100%",
    },
});
