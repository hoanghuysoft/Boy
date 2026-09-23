import Ionicons from "@react-native-vector-icons/ionicons/static";
import React, { useEffect } from "react";
import Reanimated, { runOnJS, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from "react-native-reanimated";

interface FloatingHeartProps {
    id: number;
    x: number;
    y: number;
    onComplete: (id: number) => void;
}

const HEART_COLORS = [
    '#ff4d6d', // vibrant pink/red
    '#ff7eb3', // soft pink
    '#ff758f', // warm pink
    '#c9184a', // dark pink
    '#f72585', // magenta
    '#7209b7', // purple
    '#4cc9f0', // cyan
    '#ffb703', // yellow/orange
    '#fb8500', // orange
    '#ff006e', // bright neon pink
    '#8338ec', // bright purple
];

export const FloatingHeart = React.memo(({ id, x, y, onComplete }: FloatingHeartProps) => {
    const scale = useSharedValue(0);
    const translateY = useSharedValue(0);
    const translateX = useSharedValue(0);
    const opacity = useSharedValue(1);

    // Randomize heart trajectory, size, and color for an organic feel
    const randomRotation = React.useRef((Math.random() - 0.5) * 45).current; // -22.5 to 22.5 degrees
    const randomEndTranslateX = React.useRef((Math.random() - 0.5) * 120).current; // Drift left/right
    const randomEndTranslateY = React.useRef(-100 - Math.random() * 150).current; // Float up varying amounts
    const targetScale = React.useRef(0.8 + Math.random() * 0.6).current; // Size between 0.8 and 1.4
    const randomColor = React.useRef(HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)]).current;

    useEffect(() => {
        // Pop in
        scale.value = withSequence(
            withSpring(targetScale * 1.3, { damping: 10, stiffness: 200 }),
            withSpring(targetScale, { damping: 12, stiffness: 200 })
        );
        // Float up and drift horizontally
        translateY.value = withTiming(randomEndTranslateY, { duration: 1200 });
        translateX.value = withTiming(randomEndTranslateX, { duration: 1200 });
        
        // Fade out slightly later
        opacity.value = withSequence(
            withTiming(1, { duration: 800 }),
            withTiming(0, { duration: 400 }, (finished) => {
                if (finished) {
                    runOnJS(onComplete)(id);
                }
            })
        );
    }, []);

    const style = useAnimatedStyle(() => {
        return {
            position: 'absolute',
            left: x - 50, // center horizontally (icon size 100)
            top: y - 50,  // center vertically
            transform: [
                { translateY: translateY.value },
                { translateX: translateX.value },
                { scale: scale.value },
                { rotate: `${randomRotation}deg` }
            ],
            opacity: opacity.value,
        };
    });

    return (
        <Reanimated.View style={[style, { zIndex: 9999 }]} pointerEvents="none">
            <Ionicons name="heart" size={100} color={randomColor} />
        </Reanimated.View>
    );
});
FloatingHeart.displayName = 'FloatingHeart';
