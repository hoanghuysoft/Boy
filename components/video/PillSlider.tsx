import React, { useEffect, useRef, useState } from "react";
import { Animated, GestureResponderEvent, PanResponder, StyleSheet, View } from "react-native";

export interface PillSliderProps {
    value: number;
    minimumValue: number;
    maximumValue: number;
    onValueChange?: (value: number) => void;
    onSlidingStart?: () => void;
    onSlidingComplete?: (value: number) => void;
    trackHeight?: number;
    trackColor?: string;
    progressColor?: string;
    thumbSize?: number;
}

const PillSlider: React.FC<PillSliderProps> = ({
    value,
    minimumValue,
    maximumValue,
    onValueChange,
    onSlidingStart,
    onSlidingComplete,
    trackHeight = 8,
    trackColor = 'rgba(255, 255, 255, 0.3)',
    progressColor = '#FFFFFF',
    thumbSize = 16,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragValue, setDragValue] = useState(value);
    const [optimisticValue, setOptimisticValue] = useState<number | null>(null);
    const sliderWidthRef = useRef(0);
    const thumbScale = useRef(new Animated.Value(0)).current;

    // References for PanResponder to access latest props/state without closure staleness
    const stateRef = useRef({
        value,
        minimumValue,
        maximumValue,
        onValueChange,
        onSlidingStart,
        onSlidingComplete,
        isDragging,
        dragValue,
        optimisticValue, // Add optimisticValue to stateRef
    });

    // Update ref when props/state change
    useEffect(() => {
        stateRef.current = {
            value,
            minimumValue,
            maximumValue,
            onValueChange,
            onSlidingStart,
            onSlidingComplete,
            isDragging,
            dragValue,
            optimisticValue, // Add optimisticValue to stateRef
        };

        // Clear optimistic value if external value catches up
        if (optimisticValue !== null) {
            const diff = Math.abs(value - optimisticValue);
            // If the value is close enough (within 1% or 1 second typically), clear the override
            const range = maximumValue - minimumValue;
            const threshold = range > 0 ? range * 0.05 : 1;
            if (diff < threshold) {
                setOptimisticValue(null);
            }
        }
    }, [value, minimumValue, maximumValue, onValueChange, onSlidingStart, onSlidingComplete, isDragging, dragValue, optimisticValue]);

    // Animate thumb on drag state change
    useEffect(() => {
        Animated.spring(thumbScale, {
            toValue: isDragging ? 1 : 0,
            useNativeDriver: true,
            friction: 8,
            tension: 100,
        }).start();
    }, [isDragging]);

    const calculateValue = (locationX: number, isMove: boolean) => {
        const { minimumValue, maximumValue, onValueChange } = stateRef.current;
        const width = sliderWidthRef.current;
        if (width <= 0) return stateRef.current.dragValue;

        const clampedX = Math.max(0, Math.min(locationX, width));
        const newProgress = clampedX / width;
        const newValue = minimumValue + newProgress * (maximumValue - minimumValue);

        if (onValueChange) {
            onValueChange(newValue);
        }

        return newValue;
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt: GestureResponderEvent) => {
                const { onSlidingStart } = stateRef.current;
                setIsDragging(true);
                setOptimisticValue(null); // Clear any previous optimistic value
                if (onSlidingStart) onSlidingStart();
                const newVal = calculateValue(evt.nativeEvent.locationX, false);
                setDragValue(newVal);
            },
            onPanResponderMove: (evt: GestureResponderEvent) => {
                const newVal = calculateValue(evt.nativeEvent.locationX, true);
                setDragValue(newVal);
            },
            onPanResponderRelease: (evt: GestureResponderEvent) => {
                const { onSlidingComplete } = stateRef.current;
                const newVal = calculateValue(evt.nativeEvent.locationX, true);

                // Set optimistic value to prevent jump back
                setOptimisticValue(newVal);
                setIsDragging(false);
                if (onSlidingComplete) onSlidingComplete(newVal);
            },
            onPanResponderTerminate: () => {
                const { onSlidingComplete, dragValue } = stateRef.current;
                setOptimisticValue(dragValue);
                setIsDragging(false);
                if (onSlidingComplete) onSlidingComplete(dragValue);
            },
            onPanResponderTerminationRequest: () => false,
            onShouldBlockNativeResponder: () => true,
        })
    ).current;

    // Render logic
    const displayValue = isDragging ? dragValue : (optimisticValue ?? value);
    const progress = (maximumValue - minimumValue) > 0
        ? (displayValue - minimumValue) / (maximumValue - minimumValue)
        : 0;

    // Clamp progress for styling
    const clampedProgress = Math.max(0, Math.min(1, progress));

    return (
        <View
            style={sliderStyles.container}
            onLayout={(e) => {
                sliderWidthRef.current = e.nativeEvent.layout.width;
            }}
            {...panResponder.panHandlers}
        >
            <View
                pointerEvents="none"
                style={[
                    sliderStyles.track,
                    {
                        height: trackHeight,
                        backgroundColor: trackColor,
                        borderRadius: trackHeight / 2,
                    }
                ]}
            />
            <View
                pointerEvents="none"
                style={[
                    sliderStyles.progress,
                    {
                        height: trackHeight,
                        backgroundColor: progressColor,
                        borderRadius: trackHeight / 2,
                        width: `${clampedProgress * 100}%`,
                    }
                ]}
            />
            {/* Thumb */}
            <Animated.View
                pointerEvents="none"
                style={[
                    sliderStyles.thumb,
                    {
                        width: thumbSize,
                        height: thumbSize,
                        borderRadius: thumbSize / 2,
                        backgroundColor: progressColor,
                        left: `${clampedProgress * 100}%`,
                        marginLeft: -thumbSize / 2, // Center the thumb
                        transform: [{ scale: thumbScale }],
                        top: '50%',
                        marginTop: -thumbSize / 2,
                    }
                ]}
            />
        </View>
    );
};

const sliderStyles = StyleSheet.create({
    container: {
        width: '100%',
        justifyContent: 'center',
        position: 'relative',
        minHeight: 30,
        marginVertical: 5 // Add some vertical margin for touch area
    },
    track: {
        position: 'absolute',
        left: 0,
        right: 0,
    },
    progress: {
        position: 'absolute',
        left: 0,
    },
    thumb: {
        position: 'absolute',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    }
});

export default PillSlider;

