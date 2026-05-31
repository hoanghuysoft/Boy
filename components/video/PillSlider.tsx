import { Host, Slider } from '@expo/ui/jetpack-compose';
import {
    fillMaxWidth,
} from '@expo/ui/jetpack-compose/modifiers';
import React, { useRef } from 'react';
import { View } from 'react-native';

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
    const [optimisticValue, setOptimisticValue] = React.useState<number | null>(null);

    // If optimistic value is heavily matched by the real incoming value prop, drop the optimistic override during render
    if (optimisticValue !== null) {
        const diff = Math.abs(value - optimisticValue);
        const dataRange = maximumValue - minimumValue;
        const threshold = dataRange > 0 ? dataRange * 0.05 : 1; // within 5%
        if (diff < threshold) {
            setOptimisticValue(null);
        }
    }

    // Use optimistic value if it exists, otherwise fall back to pure external prop
    const displayValue = optimisticValue !== null ? optimisticValue : value;

    // Normalizing ranges exactly to 0 - 1 for Jetpack Compose Slider
    const range = Math.max(0.001, maximumValue - minimumValue);
    const progress = Math.max(0, Math.min(1, (displayValue - minimumValue) / range));

    const lastValueRef = useRef(displayValue);
    const isDraggingRef = useRef(false);

    const handleValueChange = (newProgress: number) => {
        const newValue = minimumValue + newProgress * range;
        lastValueRef.current = newValue;

        // Simulate onSlidingStart on the very first drag tick
        if (!isDraggingRef.current) {
            isDraggingRef.current = true;
            if (onSlidingStart) onSlidingStart();
        }

        // Set the optimistic tracker to instantly lock sliding interactions visually
        setOptimisticValue(newValue);

        if (onValueChange) {
            onValueChange(newValue);
        }
    };

    // Native Jetpack Compose requires Hexadecimal colors (#AARRGGBB or #RRGGBB).
    // React Native's rgba(...) will crash Color.parseColor().
    // We convert commonly used rgba(255,255,255,0.3) manually to hex, or default to semi-transparent white.
    const safeTrackColor = trackColor.includes('rgba') ? '#4DFFFFFF' : trackColor;
    const safeProgressColor = progressColor.includes('rgba') ? '#FFFFFFFF' : progressColor;

    return (
        <View style={{ width: '100%', justifyContent: 'center', minHeight: 30, marginVertical: 5 }}>
            <Host matchContents={{ vertical: true }}>
                <Slider
                    modifiers={[fillMaxWidth()]}
                    value={progress}
                    onValueChange={handleValueChange}
                    onValueChangeFinished={() => {
                        isDraggingRef.current = false;
                        if (onSlidingComplete) {
                            onSlidingComplete(lastValueRef.current);
                        }
                    }}
                    colors={{
                        thumbColor: safeProgressColor,
                        activeTrackColor: safeProgressColor,
                    }}
                />
            </Host>
        </View>
    );
};

export default PillSlider;

