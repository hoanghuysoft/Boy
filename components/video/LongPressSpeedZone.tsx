import React, { useRef } from "react";
import { StyleSheet, View, Dimensions } from "react-native";

interface LongPressSpeedZoneProps {
    onShowControls: () => void;
    setPlaybackRate: (rate: number) => void;
    onDoubleTap: (direction: "forward" | "backward") => void;
}

export const LongPressSpeedZone: React.FC<LongPressSpeedZoneProps> = ({
    onShowControls,
    setPlaybackRate,
    onDoubleTap,
}) => {
    const longPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wasLongPressRef = useRef(false);

    // Double tap state
    const lastTapTimeRef = useRef<number>(0);
    const doubleTapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    return (
        <View
            style={StyleSheet.absoluteFill}
            onTouchStart={() => {
                // Reset long press flag
                wasLongPressRef.current = false;
                // Start long press timer
                longPressTimeoutRef.current = setTimeout(() => {
                    wasLongPressRef.current = true;
                    setPlaybackRate(2);
                }, 300);
            }}
            onTouchEnd={(e) => {
                // Clear long press timer
                if (longPressTimeoutRef.current) {
                    clearTimeout(longPressTimeoutRef.current);
                    longPressTimeoutRef.current = null;
                }

                // If it was a quick tap, check for double tap
                if (!wasLongPressRef.current) {
                    const now = Date.now();
                    const DOUBLE_TAP_DELAY = 250;

                    if (now - lastTapTimeRef.current < DOUBLE_TAP_DELAY) {
                        // Confirmed Double Tap
                        if (doubleTapTimeoutRef.current) {
                            clearTimeout(doubleTapTimeoutRef.current);
                            doubleTapTimeoutRef.current = null;
                        }

                        // Determine left or right side based on touch coordinates
                        const pageX = e.nativeEvent.pageX;
                        const screenWidth = Dimensions.get("window").width;
                        if (pageX < screenWidth / 2) {
                            onDoubleTap("backward");
                        } else {
                            onDoubleTap("forward");
                        }

                        // Reset to avoid triple taps registering weirdly
                        lastTapTimeRef.current = 0;
                    } else {
                        // First tap of a potential double tap
                        lastTapTimeRef.current = now;

                        // Delay showing controls to wait and see if a second tap comes
                        doubleTapTimeoutRef.current = setTimeout(() => {
                            onShowControls();
                        }, DOUBLE_TAP_DELAY);
                    }
                }

                // Reset speed and flag
                setPlaybackRate(1);
                wasLongPressRef.current = false;
            }}
            onTouchCancel={() => {
                // Clear timers and reset
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
        />
    );
};
