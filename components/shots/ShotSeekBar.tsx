import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    PanResponder,
    StyleSheet,
    Text,
    View,
} from "react-native";

// ─── Constants (from reference VideoOverlay) ────────────────────────
const SEEK_BAR_HEIGHT = 3;
const SEEK_BAR_HIT_SLOP = 14;
const SEEK_BAR_AREA_HEIGHT = SEEK_BAR_HEIGHT + 2 * SEEK_BAR_HIT_SLOP;
const SEEK_TRACK_SCALE_DRAG = 3;
const SEEK_TRACK_ANIM_DURATION = 180;
const SEEK_TIMER_ANIM_DURATION = 200;
const SEEK_TIMER_OFFSET_ABOVE_BAR = 48;

function formatSeekTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}

interface ShotSeekBarProps {
    /** Playback progress 0–1 */
    progress: number;
    /** Total duration in seconds */
    duration: number;
    /** Called when user seeks to a new progress 0–1 */
    onSeek?: (progress: number) => void;
    /** Called when seeking state changes (to disable list scroll) */
    onSeekingChange?: (seeking: boolean) => void;
    /** Distance from the bottom of the container */
    bottom: number;
}

export const ShotSeekBar = React.memo(({
    progress,
    duration,
    onSeek,
    onSeekingChange,
    bottom,
}: ShotSeekBarProps) => {
    const [seekingProgress, setSeekingProgress] = useState<number | null>(null);
    const trackLayoutRef = useRef({ x: 0, width: 1 });
    const seekTrackRef = useRef<View>(null);
    const onSeekRef = useRef(onSeek);
    const progressRef = useRef(progress);
    const onSeekingChangeRef = useRef(onSeekingChange);
    const trackScaleY = useRef(new Animated.Value(1)).current;
    const seekTimerOpacity = useRef(new Animated.Value(0)).current;
    const isDraggingRef = useRef(false);

    onSeekRef.current = onSeek;
    progressRef.current = progress;
    onSeekingChangeRef.current = onSeekingChange;

    const displayProgress = seekingProgress !== null ? seekingProgress : progress;

    const hideSeekState = useRef(() => {
        onSeekingChangeRef.current?.(false);
        isDraggingRef.current = false;
        Animated.parallel([
            Animated.timing(trackScaleY, {
                toValue: 1,
                duration: SEEK_TRACK_ANIM_DURATION,
                useNativeDriver: true,
            }),
            Animated.timing(seekTimerOpacity, {
                toValue: 0,
                duration: SEEK_TIMER_ANIM_DURATION,
                useNativeDriver: true,
            }),
        ]).start();
    }).current;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => !!onSeekRef.current,
            onStartShouldSetPanResponderCapture: () => !!onSeekRef.current,
            onMoveShouldSetPanResponder: () => !!onSeekRef.current,
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
                setSeekingProgress(p);
                seek(p);
                onSeekingChangeRef.current?.(true);
                seekTimerOpacity.setValue(1);
            },
            onPanResponderMove: (evt) => {
                const seek = onSeekRef.current;
                if (!seek) return;
                if (!isDraggingRef.current) {
                    isDraggingRef.current = true;
                    Animated.timing(trackScaleY, {
                        toValue: SEEK_TRACK_SCALE_DRAG,
                        duration: SEEK_TRACK_ANIM_DURATION,
                        useNativeDriver: true,
                    }).start();
                }
                const moveX = evt.nativeEvent.pageX;
                const { x: trackX, width: trackW } = trackLayoutRef.current;
                const p =
                    trackW > 0
                        ? Math.max(0, Math.min(1, (moveX - trackX) / trackW))
                        : progressRef.current;
                setSeekingProgress(p);
                seek(p);
            },
            onPanResponderRelease: () => {
                setSeekingProgress(null);
                hideSeekState();
            },
            onPanResponderTerminate: () => {
                setSeekingProgress(null);
                hideSeekState();
            },
        }),
    ).current;

    return (
        <>
            {/* Seek bar track */}
            <View
                ref={seekTrackRef}
                pointerEvents="box-only"
                style={[
                    styles.seekBarHitArea,
                    { bottom },
                ]}
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
                <Animated.View
                    style={[
                        styles.seekBarTrack,
                        {
                            transform: [{ scaleY: trackScaleY }],
                        },
                    ]}
                >
                    <View
                        style={[
                            styles.seekBarFill,
                            {
                                width: `${
                                    Math.min(1, Math.max(0, displayProgress)) *
                                    100
                                }%`,
                            },
                        ]}
                    />
                </Animated.View>
            </View>

            {/* Seek timer bubble */}
            <Animated.View
                pointerEvents="none"
                style={[
                    styles.seekTimer,
                    {
                        bottom:
                            bottom +
                            SEEK_BAR_AREA_HEIGHT +
                            SEEK_TIMER_OFFSET_ABOVE_BAR,
                        opacity: seekTimerOpacity,
                    },
                ]}
            >
                <Text style={styles.seekTimerText}>
                    {formatSeekTime(
                        displayProgress * (duration > 0 ? duration : 0),
                    )}
                    {" / "}
                    {formatSeekTime(duration > 0 ? duration : 0)}
                </Text>
            </Animated.View>
        </>
    );
});

ShotSeekBar.displayName = 'ShotSeekBar';

// ─── Styles ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    seekBarHitArea: {
        position: "absolute",
        left: 0,
        right: 0,
        paddingVertical: SEEK_BAR_HIT_SLOP,
    },
    seekBarTrack: {
        height: SEEK_BAR_HEIGHT,
        backgroundColor: "rgba(255,255,255,0.3)",
        borderRadius: SEEK_BAR_HEIGHT / 2,
        overflow: "hidden",
    },
    seekBarFill: {
        height: "100%",
        backgroundColor: "#fff",
        borderRadius: SEEK_BAR_HEIGHT / 2,
    },
    seekTimer: {
        position: "absolute",
        alignSelf: "center",
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: "rgba(0,0,0,0.65)",
        borderRadius: 8,
    },
    seekTimerText: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "600",
    },
});
