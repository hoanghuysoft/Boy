import { useEventListener } from "expo";
import type { VideoPlayer } from "expo-video";
import React, { useEffect, useMemo, useRef } from "react";
import {
    StyleSheet,
    View,
} from "react-native";
import {
    Gesture,
    GestureDetector,
} from "react-native-gesture-handler";
import Reanimated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

// ─── Constants ──────────────────────────────────────────────────────
const TRACK_H = 2;
const THUMB = 12;
const THUMB_DRAG = 20;
const THUMB_CONTAINER_SIZE = 44;
const ANIM_MS = 150;

interface VideoPlayerSeekBarProps {
    player: VideoPlayer;
    onSeek?: (seconds: number) => void;
    onSeekingChange?: (seeking: boolean) => void;
    controlsVisible: boolean;
    isFullscreen: boolean;
}

export const VideoPlayerSeekBar = React.memo(({
    player,
    onSeek,
    onSeekingChange,
    controlsVisible,
    isFullscreen,
}: VideoPlayerSeekBarProps) => {
    // Initial calculation
    const initialDuration = player.duration || 100;
    const initialProgress = Math.min(1, Math.max(0, (player.currentTime || 0) / initialDuration));

    // ─── All shared values (safe to read/write from worklets) ─────────────────
    const fillWidthPct = useSharedValue(initialProgress * 100);
    const trackFillWidthPct = useSharedValue(initialProgress * 100);
    const controlsActive = useSharedValue(controlsVisible ? 1 : 0);
    const isDragging = useSharedValue(false);
    const trackWidth = useSharedValue(1);        // measures actual track width
    const startPct = useSharedValue(0);
    const durationSV = useSharedValue(initialDuration);
    const bufferedPctSV = useSharedValue(0);
    const isStabilizingSV = useSharedValue(false);
    const seekTargetTimeSV = useSharedValue(0);

    const stabilizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Sync controlsVisible prop to shared value
    useEffect(() => {
        controlsActive.value = withTiming(controlsVisible ? 1 : 0, { duration: ANIM_MS });
    }, [controlsVisible]);

    // Sync when player instance changes
    useEffect(() => {
        const dur = player.duration || 100;
        durationSV.value = dur;
        const ct = player.currentTime || 0;
        const pct = Math.min(100, Math.max(0, (ct / dur) * 100));

        if (!isDragging.value) {
            fillWidthPct.value = pct;
            trackFillWidthPct.value = pct;
        }

        try {
            const bp = player.bufferedPosition;
            if (typeof bp === "number" && !isNaN(bp) && dur > 0) {
                bufferedPctSV.value = (bp / dur) * 100;
            }
        } catch { }
    }, [player]);

    // Clean up stabilize timeout on unmount
    useEffect(() => {
        return () => {
            if (stabilizeTimeoutRef.current) {
                clearTimeout(stabilizeTimeoutRef.current);
            }
        };
    }, []);

    // ─── TimeUpdate listener: Updates bar and thumb entirely on UI thread ─────
    useEventListener(player, "timeUpdate", (evt) => {
        // Skip updates if user is actively dragging
        if (isDragging.value) return;

        // Stabilization filter: ignore stale updates right after seek release
        if (isStabilizingSV.value) {
            const target = seekTargetTimeSV.value;
            if (Math.abs(evt.currentTime - target) < 1.5) {
                isStabilizingSV.value = false;
            } else {
                return;
            }
        }

        const dur = player.duration || 100;
        durationSV.value = dur;

        const pct = Math.min(100, Math.max(0, (evt.currentTime / dur) * 100));
        fillWidthPct.value = pct;
        trackFillWidthPct.value = pct;

        try {
            const bp = player.bufferedPosition;
            if (typeof bp === "number" && !isNaN(bp) && dur > 0) {
                bufferedPctSV.value = (bp / dur) * 100;
            }
        } catch { }
    });

    // ─── JS-thread callbacks (called via runOnJS from worklets) ────────────────
    const handleSeekStart = () => {
        onSeekingChange?.(true);
    };

    const handleSeekUpdate = (time: number) => {
        onSeek?.(time);
    };

    const handleSeekEnd = (finalTime: number) => {
        onSeek?.(finalTime);
        onSeekingChange?.(false);

        // Set safety timer to release stabilization state if target is not reached
        if (stabilizeTimeoutRef.current) clearTimeout(stabilizeTimeoutRef.current);
        stabilizeTimeoutRef.current = setTimeout(() => {
            isStabilizingSV.value = false;
        }, 1500);
    };

    // ─── RNGH Pan Gesture (v2 builder API — must wrap in useMemo) ──────────────
    // The gesture detector is attached to the entire seekbar container.
    // Tapping or dragging anywhere on the container height will drive the seek.
    const thumbPanGesture = useMemo(() =>
        Gesture.Pan()
            .activateAfterLongPress(0)
            .minDistance(0)
            .onBegin(() => {
                startPct.value = fillWidthPct.value;
                isDragging.value = true;
                runOnJS(handleSeekStart)();
            })
            .onUpdate((e) => {
                const tw = trackWidth.value;
                if (tw <= 0) return;
                const translation = isFullscreen ? e.translationY : e.translationX;
                const deltaPct = (translation / tw) * 100;
                const newPct = Math.max(0, Math.min(100, startPct.value + deltaPct));
                fillWidthPct.value = newPct;

                const targetTime = (newPct / 100) * durationSV.value;
                runOnJS(handleSeekUpdate)(targetTime);
            })
            .onEnd(() => {
                // Freeze the visual fill width to match final drag position
                trackFillWidthPct.value = fillWidthPct.value;
                isDragging.value = false;

                const finalTime = (fillWidthPct.value / 100) * durationSV.value;
                isStabilizingSV.value = true;
                seekTargetTimeSV.value = finalTime;

                runOnJS(handleSeekEnd)(finalTime);
            })
            .onFinalize(() => {
                if (isDragging.value) {
                    trackFillWidthPct.value = fillWidthPct.value;
                    isDragging.value = false;

                    const finalTime = (fillWidthPct.value / 100) * durationSV.value;
                    isStabilizingSV.value = true;
                    seekTargetTimeSV.value = finalTime;

                    runOnJS(handleSeekEnd)(finalTime);
                }
            }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [isFullscreen]
    );

    // ─── Animated styles (all on UI thread) ───────────────────────────────────
    const fillStyle = useAnimatedStyle(() => {
        const isWhite = controlsActive.value < 0.5 && !isFullscreen;
        return {
            width: `${trackFillWidthPct.value}%` as any,
            backgroundColor: withTiming(isWhite ? "#FFFFFF" : "#FF0000", { duration: ANIM_MS }),
        };
    });

    const bufferedStyle = useAnimatedStyle(() => ({
        width: `${bufferedPctSV.value}%` as any,
    }));

    const thumbContainerStyle = useAnimatedStyle(() => ({
        left: `${fillWidthPct.value}%` as any,
        opacity: withTiming(controlsActive.value, { duration: ANIM_MS }),
    }));

    const thumbDotStyle = useAnimatedStyle(() => {
        const size = isDragging.value ? THUMB_DRAG : THUMB;
        return {
            width: withTiming(size, { duration: ANIM_MS }),
            height: withTiming(size, { duration: ANIM_MS }),
            borderRadius: withTiming(size / 2, { duration: ANIM_MS }),
        };
    });

    return (
        <GestureDetector gesture={thumbPanGesture}>
            <View
                style={[styles.container, { height: isFullscreen ? 20 : 20 }]}
                pointerEvents={controlsVisible ? "auto" : "none"}
            >
                {/* Track — measures width into shared value */}
                <View
                    style={[styles.trackContainer, { height: isFullscreen ? 20 : 20 }]}
                    onLayout={(e) => {
                        const w = e.nativeEvent.layout.width;
                        if (w > 0) trackWidth.value = w;
                    }}
                >
                    <View style={styles.track}>
                        <Reanimated.View style={[styles.bufferedFill, bufferedStyle]} />
                        <Reanimated.View style={[styles.progressFill, fillStyle]} />
                    </View>
                </View>

                {/* Thumb — visually rendered, moves with thumbContainerStyle */}
                <Reanimated.View style={[styles.thumbContainer, thumbContainerStyle]}>
                    <Reanimated.View style={[styles.thumbDot, thumbDotStyle]} />
                </Reanimated.View>
            </View>
        </GestureDetector>
    );
});

VideoPlayerSeekBar.displayName = "VideoPlayerSeekBar";

const styles = StyleSheet.create({
    container: {
        height: 44,
        width: "100%",
        overflow: "visible",
        justifyContent: "flex-end",
    },
    trackContainer: {
        width: "100%",
        height: 44,
        justifyContent: "flex-end",
    },
    track: {
        width: "100%",
        bottom: 0,
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
        bottom: -(THUMB_CONTAINER_SIZE / 2) + TRACK_H / 2,
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
