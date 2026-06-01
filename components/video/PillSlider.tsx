import React, { useRef, useEffect } from 'react';
import { View, Platform } from 'react-native';

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

let AndroidSlider: any = null;
let AndroidHost: any = null;
let fillMaxWidth: any = null;

let IOSSlider: any = null;
let IOSHost: any = null;
let tintModifier: any = null;

if (Platform.OS === 'android') {
    try {
        AndroidSlider = require('@expo/ui/jetpack-compose').Slider;
        AndroidHost = require('@expo/ui/jetpack-compose').Host;
        fillMaxWidth = require('@expo/ui/jetpack-compose/modifiers').fillMaxWidth;
    } catch (e) {
        console.error("Failed to load @expo/ui/jetpack-compose", e);
    }
} else if (Platform.OS === 'ios') {
    try {
        IOSSlider = require('@expo/ui/swift-ui').Slider;
        IOSHost = require('@expo/ui/swift-ui').Host;
        tintModifier = require('@expo/ui/swift-ui/modifiers').tint;
    } catch (e) {
        console.error("Failed to load @expo/ui/swift-ui", e);
    }
}

const PillSlider: React.FC<PillSliderProps> = ({
    value,
    minimumValue,
    maximumValue,
    onValueChange,
    onSlidingStart,
    onSlidingComplete,
    trackColor = 'rgba(255, 255, 255, 0.3)',
    progressColor = '#FFFFFF',
}) => {
    const isDraggingRef = useRef(false);
    const lastValueRef = useRef(value);

    // Keep track of the last value so callbacks have the latest value
    useEffect(() => {
        if (!isDraggingRef.current) {
            lastValueRef.current = value;
        }
    }, [value]);

    const safeMin = minimumValue;
    const safeMax = Math.max(minimumValue + 0.001, maximumValue);
    const clampedValue = Math.max(safeMin, Math.min(safeMax, value));

    const safeTrackColor = trackColor.startsWith('rgba') ? '#4DFFFFFF' : trackColor;
    const safeProgressColor = progressColor.startsWith('rgba') ? '#FFFFFFFF' : progressColor;

    if (Platform.OS === 'android' && AndroidSlider && AndroidHost) {
        const handleValueChange = (newValue: number) => {
            lastValueRef.current = newValue;
            if (!isDraggingRef.current) {
                isDraggingRef.current = true;
                onSlidingStart?.();
            }
            onValueChange?.(newValue);
        };

        const handleValueChangeFinished = () => {
            isDraggingRef.current = false;
            onSlidingComplete?.(lastValueRef.current);
        };

        return (
            <View style={{ width: '100%', justifyContent: 'center', minHeight: 30, marginVertical: 5 }}>
                <AndroidHost matchContents={{ vertical: true }} style={{ width: '100%' }}>
                    <AndroidSlider
                        modifiers={fillMaxWidth ? [fillMaxWidth()] : undefined}
                        value={clampedValue}
                        min={safeMin}
                        max={safeMax}
                        onValueChange={handleValueChange}
                        onValueChangeFinished={handleValueChangeFinished}
                        colors={{
                            thumbColor: safeProgressColor,
                            activeTrackColor: safeProgressColor,
                            inactiveTrackColor: safeTrackColor,
                        }}
                    />
                </AndroidHost>
            </View>
        );
    }

    if (Platform.OS === 'ios' && IOSSlider && IOSHost) {
        const handleValueChange = (newValue: number) => {
            lastValueRef.current = newValue;
            onValueChange?.(newValue);
        };

        const handleEditingChanged = (isEditing: boolean) => {
            if (isEditing) {
                isDraggingRef.current = true;
                onSlidingStart?.();
            } else {
                isDraggingRef.current = false;
                onSlidingComplete?.(lastValueRef.current);
            }
        };

        const modifiers = tintModifier ? [tintModifier(safeProgressColor)] : undefined;

        return (
            <View style={{ width: '100%', justifyContent: 'center', minHeight: 30, marginVertical: 5 }}>
                <IOSHost matchContents={{ vertical: true }} style={{ width: '100%' }}>
                    <IOSSlider
                        value={clampedValue}
                        min={safeMin}
                        max={safeMax}
                        onValueChange={handleValueChange}
                        onEditingChanged={handleEditingChanged}
                        modifiers={modifiers}
                    />
                </IOSHost>
            </View>
        );
    }

    // Fallback/Web/Mock Slider
    return (
        <View style={{ width: '100%', height: 30, backgroundColor: trackColor, borderRadius: 15, justifyContent: 'center', marginVertical: 5 }}>
            <View style={{ width: `${(clampedValue / safeMax) * 100}%`, height: '100%', backgroundColor: progressColor, borderRadius: 15 }} />
        </View>
    );
};

export default PillSlider;
