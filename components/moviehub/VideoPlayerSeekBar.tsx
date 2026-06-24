import React, { useEffect, useRef } from "react";
import {
    PanResponder,
    StyleSheet,
    View,
} from "react-native";
import Reanimated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

// ─── Constants ───────────────────────────────────────
const SEEK_BAR_HEIGHT = 2; // Base height of the progress track
const SEEK_BAR_HIT_SLOP = 12;
const SEEK_BAR_AREA_HEIGHT = SEEK_BAR_HEIGHT + 2 * SEEK_BAR_HIT_SLOP; // 26px
const SEEK_TRACK_ANIM_DURATION = 150;

interface VideoPlayerSeekBarProps {
    /** Playback current time in seconds */
    currentTime: number;
    /** Total duration in seconds */
    duration: number;
    /** Called when user seeks to a new time in seconds */
    onSeek?: (seconds: number) => void;
    /** Called when seeking state changes */
    onSeekingChange?: (seeking: boolean) => void;
    /** Whether player controls are currently visible */
    controlsVisible: boolean;
    /** Whether the player is currently in fullscreen mode */
    isFullscreen: boolean;
}

export const VideoPlayerSeekBar = React.memo(({
    currentTime,
    duration,
    onSeek,
    onSeekingChange,
    controlsVisible,
    isFullscreen,
}: VideoPlayerSeekBarProps) => {
    const validDuration = typeof duration === "number" && !isNaN(duration) && duration > 0 ? duration : 100;
    const progress = Math.min(1, Math.max(0, currentTime / validDuration));

    // ─── Reanimated shared values drive animations on UI thread ────────────────
    const fillWidthPct = useSharedValue(progress * 100);
    const controlsActive = useSharedValue(controlsVisible ? 1 : 0);
    const isDraggingShared = useSharedValue(false);

    // Sync controls visibility reactively
    useEffect(() => {
        controlsActive.value = withTiming(controlsVisible ? 1 : 0, { duration: SEEK_TRACK_ANIM_DURATION });
    }, [controlsVisible]);

    // Sync Reanimated value when progress updates from player (not during drag)
    const isDraggingRef = useRef(false);
    useEffect(() => {
        if (!isDraggingRef.current) {
            fillWidthPct.value = Math.min(100, Math.max(0, progress * 100));
        }
    }, [progress]);

    const trackLayoutRef = useRef({ x: 0, width: 1 });
    const seekTrackRef = useRef<View>(null);
    const onSeekRef = useRef(onSeek);
    const progressRef = useRef(progress);
    const onSeekingChangeRef = useRef(onSeekingChange);
    const durationRef = useRef(validDuration);

    onSeekRef.current = onSeek;
    progressRef.current = progress;
    onSeekingChangeRef.current = onSeekingChange;
    durationRef.current = validDuration;

    const hideSeekState = useRef(() => {
        onSeekingChangeRef.current?.(false);
        isDraggingRef.current = false;
        isDraggingShared.value = false;
    }).current;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => controlsActive.value > 0.5 && !!onSeekRef.current,
            onStartShouldSetPanResponderCapture: () => controlsActive.value > 0.5 && !!onSeekRef.current,
            onMoveShouldSetPanResponder: () => controlsActive.value > 0.5 && !!onSeekRef.current,
            onPanResponderGrant: (evt) => {
                const seek = onSeekRef.current;
                if (!seek) return;
                isDraggingRef.current = false;
                const { locationX } = evt.nativeEvent;
                const { width: trackW } = trackLayoutRef.current;
                const p =
                    trackW > 0
                        ? Math.max(0, Math.min(1, locationX / trackW))
                        : progressRef.current;

                // Update fill on UI thread immediately
                fillWidthPct.value = p * 100;
                seek(p * durationRef.current);
                onSeekingChangeRef.current?.(true);
            },
            onPanResponderMove: (evt) => {
                const seek = onSeekRef.current;
                if (!seek) return;
                if (!isDraggingRef.current) {
                    isDraggingRef.current = true;
                    isDraggingShared.value = true;
                }
                const moveX = evt.nativeEvent.pageX;
                const { x: trackX, width: trackW } = trackLayoutRef.current;
                const p =
                    trackW > 0
                        ? Math.max(0, Math.min(1, (moveX - trackX) / trackW))
                        : progressRef.current;

                // Update fill on UI thread — NO JS setState, zero lag
                fillWidthPct.value = p * 100;
                seek(p * durationRef.current);
            },
            onPanResponderRelease: () => {
                hideSeekState();
            },
            onPanResponderTerminate: () => {
                hideSeekState();
            },
        }),
    ).current;

    // ─── Animated styles driven entirely on UI thread ─────────────────────────
    const fillStyle = useAnimatedStyle(() => {
        const isWhite = (controlsActive.value < 0.5) && !isFullscreen;
        const targetColor = isWhite ? "#FFFFFF" : "#FF0000";
        return {
            width: `${fillWidthPct.value}%` as any,
            backgroundColor: withTiming(targetColor, { duration: SEEK_TRACK_ANIM_DURATION }),
        };
    });

    const trackStyle = useAnimatedStyle(() => {
        // Controls hidden: scale = 1.0 (2px height)
        // Controls visible: scale = 1.5 (3px height)
        // Active dragging: scale = 2.5 (5px height)
        const baseScale = 1.0 + controlsActive.value * 0.5;
        const dragMultiplier = isDraggingShared.value ? 1.6 : 1.0;
        return {
            transform: [
                { scaleY: withTiming(baseScale * dragMultiplier, { duration: SEEK_TRACK_ANIM_DURATION }) }
            ],
        };
    });

    const thumbStyle = useAnimatedStyle(() => {
        // Controls hidden: scale = 0 (hidden)
        // Controls visible: scale = 1.0 (10px diameter)
        // Active dragging: scale = 1.4 (14px diameter)
        const baseScale = controlsActive.value;
        const dragMultiplier = isDraggingShared.value ? 1.4 : 1.0;
        return {
            left: `${fillWidthPct.value}%` as any,
            transform: [
                { translateX: -5 },
                { translateY: 4 }, // Centering the 10px thumb vertically on the bottom 2px track
                { scale: withTiming(baseScale * dragMultiplier, { duration: SEEK_TRACK_ANIM_DURATION }) }
            ],
            opacity: withTiming(controlsActive.value, { duration: SEEK_TRACK_ANIM_DURATION }),
        };
    });

    return (
        <View 
            style={styles.container}
            pointerEvents={controlsVisible ? "box-none" : "none"}
        >
            {/* Seek bar track hit area */}
            <View
                ref={seekTrackRef}
                pointerEvents="box-only"
                style={styles.seekBarHitArea}
                onLayout={(e) => {
                    const { width } = e.nativeEvent.layout;
                    if (width > 0) {
                        trackLayoutRef.current.width = width;
                    }
                    seekTrackRef.current?.measureInWindow((x, _y, w) => {
                        if (w > 0) {
                            trackLayoutRef.current = { x, width: w };
                        }
                    });
                }}
                {...(onSeek ? panResponder.panHandlers : {})}
            >
                <Reanimated.View
                    style={[
                        styles.seekBarTrack,
                        trackStyle,
                    ]}
                >
                    {/* Reanimated fill — updates on UI thread, no JS re-render lag */}
                    <Reanimated.View style={[styles.seekBarFill, fillStyle]} />
                </Reanimated.View>

                {/* Reanimated red circle thumb */}
                <Reanimated.View style={[styles.seekBarThumb, thumbStyle]} />
            </View>
        </View>
    );
});

VideoPlayerSeekBar.displayName = 'VideoPlayerSeekBar';

// ─── Styles ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        height: SEEK_BAR_AREA_HEIGHT,
        width: "100%",
        position: "relative",
        justifyContent: "center",
    },
    seekBarHitArea: {
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        justifyContent: "center",
        paddingHorizontal: 0, // 100% edge-to-edge, no padding
    },
    seekBarTrack: {
        height: SEEK_BAR_HEIGHT,
        backgroundColor: "rgba(255,255,255,0.25)",
        borderRadius: SEEK_BAR_HEIGHT / 2,
        overflow: "hidden",
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
    },
    seekBarFill: {
        height: "100%",
        borderRadius: SEEK_BAR_HEIGHT / 2,
    },
    seekBarThumb: {
        position: "absolute",
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "#FF0000",
        bottom: 0,
    },
});
