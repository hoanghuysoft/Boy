import { useEventListener } from "expo";
import { VideoPlayer } from "expo-video";
import React, { useCallback, useMemo, useState } from "react";
import {
    Platform,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    clamp,
    interpolate,
    runOnJS,
    useAnimatedReaction,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

function formatTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}

export interface ShotSeekBarProps {
    player: VideoPlayer;
    isActive: boolean;
    bottom: number;
    onSeekingChange?: (seeking: boolean) => void;
}

export const ShotSeekBar = React.memo(function ShotSeekBar({
    player,
    isActive,
    bottom,
    onSeekingChange,
}: ShotSeekBarProps) {
    const { width: screenWidth } = useWindowDimensions();
    const currentTimeSV = useSharedValue(0);
    const durationSV = useSharedValue(0);
    const isSeekingSV = useSharedValue(false);
    const seekProgressSV = useSharedValue(0);
    const seekingAnimationSV = useSharedValue(0);

    const [currentSeekTime, setCurrentSeekTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // Sync numeric seconds for floating bubble display
    useAnimatedReaction(
        () => Math.round(seekProgressSV.value),
        (progress, prevProgress) => {
            if (progress !== prevProgress) {
                runOnJS(setCurrentSeekTime)(progress);
            }
        }
    );

    // Listen to timeUpdate directly from active player
    useEventListener(player, "timeUpdate", (evt) => {
        if (!isActive || !player) return;
        const dur = player.duration;
        if (dur > 0 && Number.isFinite(dur)) {
            setDuration(Math.round(dur));
            durationSV.value = dur;
        }
        if (!isSeekingSV.value) {
            currentTimeSV.value = evt.currentTime;
        }
    });

    const handleSeekEnd = useCallback((newTime: number) => {
        if (player) {
            try {
                player.currentTime = newTime;
            } catch { }
        }
        setTimeout(() => {
            isSeekingSV.value = false;
            seekingAnimationSV.value = withTiming(0, { duration: 300 });
        }, 50);
        onSeekingChange?.(false);
    }, [player, onSeekingChange, isSeekingSV, seekingAnimationSV]);

    const scrubPanGesture = useMemo(() => {
        return Gesture.Pan()
            .activeOffsetX([-10, 10])
            .failOffsetY([-10, 10])
            .onStart(() => {
                'worklet';
                seekProgressSV.value = currentTimeSV.value;
                isSeekingSV.value = true;
                seekingAnimationSV.value = withTiming(1, { duration: 200 });
                if (onSeekingChange) {
                    runOnJS(onSeekingChange)(true);
                }
            })
            .onUpdate((evt) => {
                'worklet';
                const progress = evt.x / screenWidth;
                const dur = durationSV.value;
                seekProgressSV.value = clamp(progress * dur, 0, dur);
            })
            .onEnd((evt) => {
                'worklet';
                const progress = evt.x / screenWidth;
                const dur = durationSV.value;
                const newTime = clamp(progress * dur, 0, dur);
                seekProgressSV.value = newTime;
                runOnJS(handleSeekEnd)(newTime);
            });
    }, [screenWidth, onSeekingChange, handleSeekEnd, currentTimeSV, durationSV, isSeekingSV, seekProgressSV, seekingAnimationSV]);

    // Center time preview bubble animation (smooth scale & fade)
    const timePreviewStyle = useAnimatedStyle(() => {
        return {
            opacity: seekingAnimationSV.value,
            transform: [
                {
                    scale: interpolate(seekingAnimationSV.value, [0, 1], [0.85, 1]),
                },
            ],
        };
    });

    // Expanding track styles (1.5px default -> 4.5px when dragging)
    const trackStyle = useAnimatedStyle(() => {
        return {
            height: interpolate(seekingAnimationSV.value, [0, 1], [1.5, 4.5]),
        };
    });

    const progressBarStyle = useAnimatedStyle(() => {
        const cur = isSeekingSV.value ? seekProgressSV.value : currentTimeSV.value;
        const dur = durationSV.value;
        const pct = dur > 0 ? clamp((cur / dur) * 100, 0, 100) : 0;
        return {
            width: `${pct}%`,
            height: interpolate(seekingAnimationSV.value, [0, 1], [1.5, 4.5]),
            opacity: interpolate(seekingAnimationSV.value, [0, 1], [0.85, 1]),
        };
    });

    if (!isActive || !player) return null;

    return (
        <>
            {/* Big floating time preview pill in center of screen */}
            <Animated.View
                style={[
                    styles.timePreviewContainer,
                    timePreviewStyle,
                ]}
                pointerEvents="none"
            >
                <View style={styles.timePreviewPill}>
                    <Text style={styles.timeBold}>{formatTime(currentSeekTime)}</Text>
                    <Text style={styles.timeDivider}> / </Text>
                    <Text style={styles.timeDuration}>{formatTime(duration)}</Text>
                </View>
            </Animated.View>

            {/* Gesture-enabled Scrubber Bar at bottom */}
            <GestureDetector gesture={scrubPanGesture}>
                <View style={[styles.scrubberArea, { bottom }]}>
                    <View style={styles.trackContainer}>
                        {/* Background track */}
                        <Animated.View style={[styles.trackBg, trackStyle]} />
                        {/* Filled progress bar */}
                        <Animated.View style={[styles.trackFill, progressBarStyle]} />
                    </View>
                </View>
            </GestureDetector>
        </>
    );
});

ShotSeekBar.displayName = 'ShotSeekBar';

// ─── Styles ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    scrubberArea: {
        position: "absolute",
        left: 0,
        right: 0,
        paddingVertical: 14,
        paddingHorizontal: 0,
        zIndex: 1100,
        justifyContent: "center",
    },
    trackContainer: {
        width: "100%",
        position: "relative",
        justifyContent: "center",
    },
    trackBg: {
        width: "100%",
        backgroundColor: "rgba(255, 255, 255, 0.25)",
        borderRadius: 2,
    },
    trackFill: {
        position: "absolute",
        left: 0,
        top: 0,
        backgroundColor: "#ffffff",
        borderRadius: 2,
    },
    timePreviewContainer: {
        position: "absolute",
        top: "45%",
        alignSelf: "center",
        zIndex: 1200,
    },
    timePreviewPill: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        borderRadius: 30,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "rgba(255, 255, 255, 0.2)",
    },
    timeBold: {
        color: "#ffffff",
        fontSize: 24,
        fontWeight: "700",
        fontVariant: Platform.select({ ios: ["tabular-nums"], default: undefined }),
    },
    timeDivider: {
        color: "rgba(255, 255, 255, 0.6)",
        fontSize: 20,
        fontWeight: "400",
        marginHorizontal: 4,
    },
    timeDuration: {
        color: "rgba(255, 255, 255, 0.75)",
        fontSize: 24,
        fontWeight: "600",
        fontVariant: Platform.select({ ios: ["tabular-nums"], default: undefined }),
    },
});
