import React, { useRef } from "react";
import { StyleSheet, View } from "react-native";

interface LongPressSpeedZoneProps {
    onShowControls: () => void;
    setPlaybackRate: (rate: number) => void;
}

export const LongPressSpeedZone: React.FC<LongPressSpeedZoneProps> = ({
    onShowControls,
    setPlaybackRate,
}) => {
    const longPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wasLongPressRef = useRef(false);

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
            onTouchEnd={() => {
                // Clear timer
                if (longPressTimeoutRef.current) {
                    clearTimeout(longPressTimeoutRef.current);
                    longPressTimeoutRef.current = null;
                }
                // Only show controls if it was a quick tap (not a long press)
                if (!wasLongPressRef.current) {
                    onShowControls();
                }
                // Reset speed and flag
                setPlaybackRate(1);
                wasLongPressRef.current = false;
            }}
            onTouchCancel={() => {
                // Clear timer and reset
                if (longPressTimeoutRef.current) {
                    clearTimeout(longPressTimeoutRef.current);
                    longPressTimeoutRef.current = null;
                }
                setPlaybackRate(1);
                wasLongPressRef.current = false;
            }}
        />
    );
};
