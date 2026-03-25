import { Ionicons } from "@expo/vector-icons";
import React, { useRef } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withTiming,
} from "react-native-reanimated";

const SEEK_SECONDS = 5;
const DOUBLE_TAP_DELAY = 300;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface LongPressSpeedZoneProps {
    onShowControls: () => void;
    setPlaybackRate: (rate: number) => void;
    onDoubleTap: (direction: "forward" | "backward") => void;
}

interface TapIndicatorProps {
    direction: "forward" | "backward";
    animatedStyle: any;
}

const TapIndicator: React.FC<TapIndicatorProps> = ({ direction, animatedStyle }) => {
    const isForward = direction === "forward";
    const chevrons = [0.35, 0.65, 1] as const;

    return (
        <Animated.View
            pointerEvents="none"
            style={[styles.tapZone, isForward ? styles.tapZoneRight : styles.tapZoneLeft, animatedStyle]}
        >
            {/* Chevron row */}
            <View style={[styles.chevronRow, isForward ? null : styles.chevronRowReversed]}>
                {chevrons.map((alpha, i) => (
                    <Ionicons
                        key={i}
                        name={isForward ? "chevron-forward" : "chevron-back"}
                        size={26}
                        color={`rgba(255,255,255,${alpha})`}
                        style={styles.chevron}
                    />
                ))}
            </View>
            {/* Seconds badge */}
            <View style={styles.secondsBadge}>
                <Text style={styles.secondsText}>{SEEK_SECONDS} sec</Text>
            </View>
        </Animated.View>
    );
};

export const LongPressSpeedZone: React.FC<LongPressSpeedZoneProps> = ({
    onShowControls,
    setPlaybackRate,
    onDoubleTap,
}) => {
    const longPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wasLongPressRef = useRef(false);
    const lastTapTimeRef = useRef<number>(0);
    const doubleTapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const backwardOpacity = useSharedValue(0);
    const forwardOpacity = useSharedValue(0);

    const backwardStyle = useAnimatedStyle(() => ({
        opacity: backwardOpacity.value,
        transform: [{ scale: 0.7 + backwardOpacity.value * 0.3 }],
    }));

    const forwardStyle = useAnimatedStyle(() => ({
        opacity: forwardOpacity.value,
        transform: [{ scale: 0.7 + forwardOpacity.value * 0.3 }],
    }));

    const flashIndicator = (target: typeof backwardOpacity) => {
        target.value = withSequence(
            withTiming(1, { duration: 80, easing: Easing.out(Easing.cubic) }),
            withTiming(1, { duration: 380 }),
            withTiming(0, { duration: 200, easing: Easing.in(Easing.quad) }),
        );
    };

    return (
        <View
            style={StyleSheet.absoluteFill}
            onTouchStart={() => {
                wasLongPressRef.current = false;
                longPressTimeoutRef.current = setTimeout(() => {
                    wasLongPressRef.current = true;
                    setPlaybackRate(2);
                }, 300);
            }}
            onTouchEnd={(e) => {
                if (longPressTimeoutRef.current) {
                    clearTimeout(longPressTimeoutRef.current);
                    longPressTimeoutRef.current = null;
                }

                if (!wasLongPressRef.current) {
                    const now = Date.now();

                    if (now - lastTapTimeRef.current < DOUBLE_TAP_DELAY) {
                        if (doubleTapTimeoutRef.current) {
                            clearTimeout(doubleTapTimeoutRef.current);
                            doubleTapTimeoutRef.current = null;
                        }

                        const pageX = e.nativeEvent.pageX;
                        if (pageX < SCREEN_WIDTH / 2) {
                            onDoubleTap("backward");
                            flashIndicator(backwardOpacity);
                        } else {
                            onDoubleTap("forward");
                            flashIndicator(forwardOpacity);
                        }

                        lastTapTimeRef.current = 0;
                    } else {
                        lastTapTimeRef.current = now;
                        doubleTapTimeoutRef.current = setTimeout(() => {
                            onShowControls();
                        }, DOUBLE_TAP_DELAY);
                    }
                }

                setPlaybackRate(1);
                wasLongPressRef.current = false;
            }}
            onTouchCancel={() => {
                if (longPressTimeoutRef.current) {
                    clearTimeout(longPressTimeoutRef.current);
                    longPressTimeoutRef.current = null;
                }
                if (doubleTapTimeoutRef.current) {
                    clearTimeout(doubleTapTimeoutRef.current);
                    doubleTapTimeoutRef.current = null;
                }
                setPlaybackRate(1);
                wasLongPressRef.current = false;
            }}
        >
            <TapIndicator direction="backward" animatedStyle={backwardStyle} />
            <TapIndicator direction="forward" animatedStyle={forwardStyle} />
        </View>
    );
};

const styles = StyleSheet.create({
    tapZone: {
        position: "absolute",
        top: 0,
        bottom: 0,
        width: SCREEN_WIDTH / 2,
        justifyContent: "center",
        alignItems: "center",
        gap: 10,
    },
    tapZoneLeft: {
        left: 0,
    },
    tapZoneRight: {
        right: 0,
    },
    chevronRow: {
        flexDirection: "row",
        alignItems: "center",
        marginLeft: -8,
    },
    chevronRowReversed: {
        flexDirection: "row-reverse",
        marginLeft: 0,
        marginRight: -8,
    },
    chevron: {
        marginHorizontal: -4,
    },
    secondsBadge: {
        backgroundColor: "rgba(255,255,255,0.18)",
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.25)",
    },
    secondsText: {
        color: "white",
        fontSize: 13,
        fontWeight: "600",
        letterSpacing: 0.3,
    },
});
