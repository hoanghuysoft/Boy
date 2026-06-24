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

// ─── Constants ──────────────────────────────────────────────────────
const TRACK_H = 2;
const THUMB = 12;
const THUMB_DRAG = 20;
const THUMB_CONTAINER_SIZE = 44; // Dedicated large hit box for thumb
const ANIM_MS = 150;

interface VideoPlayerSeekBarProps {
    currentTime: number;
    duration: number;
    buffered?: number;
    onSeek?: (seconds: number) => void;
    onSeekingChange?: (seeking: boolean) => void;
    controlsVisible: boolean;
    isFullscreen: boolean;
}

export const VideoPlayerSeekBar = React.memo(({
    currentTime,
    duration,
    buffered = 0,
    onSeek,
    onSeekingChange,
    controlsVisible,
    isFullscreen,
}: VideoPlayerSeekBarProps) => {
    const validDuration = typeof duration === "number" && !isNaN(duration) && duration > 0 ? duration : 100;
    const progress = Math.min(1, Math.max(0, currentTime / validDuration));
    const bufferedPct = Math.min(100, Math.max(0, buffered * 100));

    // ─── Shared values (UI thread) ────────────────────────────────────────────
    const fillWidthPct = useSharedValue(progress * 100);      // Thumb position
    const trackFillWidthPct = useSharedValue(progress * 100); // Red progress fill position
    const controlsActive = useSharedValue(controlsVisible ? 1 : 0);
    const isDragging = useSharedValue(false);

    useEffect(() => {
        controlsActive.value = withTiming(controlsVisible ? 1 : 0, { duration: ANIM_MS });
    }, [controlsVisible]);

    const isDraggingRef = useRef(false);
    useEffect(() => {
        if (!isDraggingRef.current) {
            const pct = Math.min(100, Math.max(0, progress * 100));
            fillWidthPct.value = pct;
            trackFillWidthPct.value = pct;
        }
    }, [progress]);

    // ─── Refs ─────────────────────────────────────────────────────────────────
    const trackLayoutRef = useRef({ width: 1 });
    const onSeekRef = useRef(onSeek);
    const onSeekingChangeRef = useRef(onSeekingChange);
    const durationRef = useRef(validDuration);
    const startFillPctRef = useRef(0);

    onSeekRef.current = onSeek;
    onSeekingChangeRef.current = onSeekingChange;
    durationRef.current = validDuration;

    const endDrag = useRef(() => {
        // Instantly snap track fill to thumb position on release
        trackFillWidthPct.value = fillWidthPct.value;

        onSeekingChangeRef.current?.(false);
        isDraggingRef.current = false;
        isDragging.value = false;
    }).current;

    const panResponder = useRef(
        PanResponder.create({
            // Gestures are attached directly to the thumb, so we always accept touches when controls are visible
            onStartShouldSetPanResponder: () => controlsActive.value > 0.4 && !!onSeekRef.current,
            onStartShouldSetPanResponderCapture: () => controlsActive.value > 0.4 && !!onSeekRef.current,
            onMoveShouldSetPanResponder: () => isDraggingRef.current,
            onPanResponderGrant: () => {
                startFillPctRef.current = fillWidthPct.value;
                isDraggingRef.current = true;
                isDragging.value = true;
                onSeekingChangeRef.current?.(true);
            },
            onPanResponderMove: (evt, gestureState) => {
                const { width: trackW } = trackLayoutRef.current;
                if (trackW <= 0) return;
                // Delta drag calculation using accumulated gesture distance
                const deltaPct = (gestureState.dx / trackW) * 100;
                const newPct = Math.max(0, Math.min(100, startFillPctRef.current + deltaPct));
                // Only update the thumb position during drag
                fillWidthPct.value = newPct;
                onSeekRef.current?.(newPct / 100 * durationRef.current);
            },
            onPanResponderRelease: endDrag,
            onPanResponderTerminate: endDrag,
        }),
    ).current;

    // ─── Animated styles ──────────────────────────────────────────────────────

    const fillStyle = useAnimatedStyle(() => {
        const isWhite = controlsActive.value < 0.5 && !isFullscreen;
        return {
            width: `${trackFillWidthPct.value}%` as any,
            backgroundColor: withTiming(isWhite ? "#FFFFFF" : "#FF0000", { duration: ANIM_MS }),
        };
    });

    const thumbContainerStyle = useAnimatedStyle(() => {
        return {
            left: `${fillWidthPct.value}%` as any,
            opacity: withTiming(controlsActive.value, { duration: ANIM_MS }),
        };
    });

    const thumbDotStyle = useAnimatedStyle(() => {
        const size = isDragging.value ? THUMB_DRAG : THUMB;
        return {
            width: withTiming(size, { duration: ANIM_MS }),
            height: withTiming(size, { duration: ANIM_MS }),
            borderRadius: withTiming(size / 2, { duration: ANIM_MS }),
        };
    });

    return (
        <View style={styles.container} pointerEvents={controlsVisible ? "box-none" : "none"}>
            {/* Track container */}
            <View
                style={styles.trackContainer}
                onLayout={(e) => {
                    const { width } = e.nativeEvent.layout;
                    if (width > 0) trackLayoutRef.current.width = width;
                }}
            >
                {/* Base track */}
                <View style={styles.track}>
                    <View style={[styles.bufferedFill, { width: `${bufferedPct}%` }]} />
                    <Reanimated.View style={[styles.progressFill, fillStyle]} />
                </View>
            </View>

            {/* Split Thumb: Touch handling is isolated to this 44x44 container */}
            <Reanimated.View
                style={[styles.thumbContainer, thumbContainerStyle]}
                {...panResponder.panHandlers}
            >
                <Reanimated.View style={[styles.thumbDot, thumbDotStyle]} />
            </Reanimated.View>
        </View>
    );
});

VideoPlayerSeekBar.displayName = "VideoPlayerSeekBar";

const styles = StyleSheet.create({
    container: {
        height: 12, // container matches the active hover zone
        width: "100%",
        overflow: "visible",
        justifyContent: "flex-end",
    },
    trackContainer: {
        width: "100%",
        height: 12,
        justifyContent: "flex-end",
    },
    track: {
        width: "100%",
        bottom: 0, // Pinned exactly at bottom of container
        height: TRACK_H,
        backgroundColor: "rgba(255,255,255,0.25)",
        borderRadius: TRACK_H / 2,
        overflow: "hidden",
    },
    bufferedFill: {
        position: "absolute",
        left: 0, top: 0, bottom: 0,
        backgroundColor: "rgba(255,255,255,0.45)",
        borderRadius: TRACK_H / 2,
    },
    progressFill: {
        position: "absolute",
        left: 0, top: 0, bottom: 0,
        borderRadius: TRACK_H / 2,
    },
    thumbContainer: {
        position: "absolute",
        width: THUMB_CONTAINER_SIZE,
        height: THUMB_CONTAINER_SIZE,
        justifyContent: "center",
        alignItems: "center",
        bottom: -(THUMB_CONTAINER_SIZE / 2) + TRACK_H / 2, // Centered perfectly on track
        transform: [
            { translateX: -THUMB_CONTAINER_SIZE / 2 },
        ],
        overflow: "visible",
        zIndex: 99,
    },
    thumbDot: {
        backgroundColor: "#FF0000",
    },
});
