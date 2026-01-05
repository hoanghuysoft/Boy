import { useIsFocused } from "@react-navigation/native";
import React, { useState } from "react";
import { LayoutChangeEvent, StyleSheet } from "react-native";
import Animated, {
    Easing,
    FadeIn,
    FadeOut,
    cancelAnimation,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";

const SNOWFLAKE_TYPES = ["❄", "❅", "❆"];

type SnowflakeConfig = {
    xRatio: number;
    size: number;
    durationRatio: number;
    startYRatio: number;
    swing: number;
    opacity: number;
    type: string;
    rotationDuration: number;
    rotateClockwise: boolean;
};

type FallSpeed = "slow" | "medium" | "fast";

const FALL_DURATIONS: Record<FallSpeed, [number, number]> = {
    fast: [2000, 4000],
    medium: [4000, 8000],
    slow: [8000, 15000],
};

function generateSnowflakes(count: number): SnowflakeConfig[] {
    return new Array(count).fill(null).map(() => ({
        xRatio: Math.random(),
        size: 10 + Math.random() * 8,
        durationRatio: Math.random(),
        startYRatio: Math.random(),
        swing: 10 + Math.random() * 20,
        opacity: 0.4 + Math.random() * 0.6,
        type: SNOWFLAKE_TYPES[Math.floor(Math.random() * 3)],
        rotationDuration: 2000 + Math.random() * 8000,
        rotateClockwise: Math.random() > 0.5,
    }));
}

type SnowEmitterProps = {
    snowflakesCount?: number;
    fallSpeed?: FallSpeed;
};

export default function SnowEmitter({
    snowflakesCount = 50,
    fallSpeed = "medium",
}: SnowEmitterProps) {
    const [dimensions, setDimensions] = useState<{
        width: number;
        height: number;
    } | null>(null);
    const isFocused = useIsFocused();

    const snowflakes = React.useMemo(
        () => generateSnowflakes(snowflakesCount),
        [snowflakesCount]
    );

    const onLayout = (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setDimensions({ width, height });
    };

    // Don't render snowflakes when tab is not focused
    if (!isFocused) {
        return null;
    }

    return (
        <Animated.View
            style={styles.container}
            entering={FadeIn}
            exiting={FadeOut}
            pointerEvents="none"
            onLayout={onLayout}
        >
            {dimensions &&
                snowflakes.map((flake, index) => (
                    <SnowflakeItem
                        key={index}
                        config={flake}
                        dimensions={dimensions}
                        fallSpeed={fallSpeed}
                    />
                ))}
        </Animated.View>
    );
}

type SnowflakeItemProps = {
    config: SnowflakeConfig;
    dimensions: { width: number; height: number };
    fallSpeed: FallSpeed;
};

function SnowflakeItem({ config, dimensions, fallSpeed }: SnowflakeItemProps) {
    const { width, height } = dimensions;
    const [minDuration, maxDuration] = FALL_DURATIONS[fallSpeed];

    const duration =
        minDuration + config.durationRatio * (maxDuration - minDuration);
    const startY = config.startYRatio * height - config.size;
    const x = config.xRatio * width;

    const remainingRatio = 1 - (startY + config.size) / (height + config.size);
    const initialDuration = duration * remainingRatio;

    const translateY = useSharedValue(startY);
    const translateX = useSharedValue(0);
    const rotation = useSharedValue(0);

    React.useEffect(() => {
        const fullFall = withRepeat(
            withTiming(height + config.size, {
                duration: duration,
                easing: Easing.linear,
            }),
            -1,
            false
        );

        if (initialDuration > 0) {
            translateY.value = withTiming(
                height + config.size,
                {
                    duration: initialDuration,
                    easing: Easing.linear,
                },
                () => {
                    translateY.value = -config.size;
                    translateY.value = fullFall;
                }
            );
        } else {
            translateY.value = fullFall;
        }

        translateX.value = withRepeat(
            withTiming(config.swing, {
                duration: 2000 + Math.random() * 2000,
                easing: Easing.inOut(Easing.ease),
            }),
            -1,
            true
        );

        rotation.value = withRepeat(
            withTiming(1, {
                duration: config.rotationDuration,
                easing: Easing.linear,
            }),
            -1,
            false
        );

        // Cleanup function to cancel all animations when component unmounts
        return () => {
            cancelAnimation(translateY);
            cancelAnimation(translateX);
            cancelAnimation(rotation);
        };
    }, [duration, height, width, config, initialDuration]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
            { translateX: translateX.value },
            {
                rotateZ: `${interpolate(
                    rotation.value,
                    [0, 1],
                    config.rotateClockwise ? [0, 360] : [360, 0]
                )}deg`,
            },
        ],
    }));

    return (
        <Animated.Text
            style={[
                styles.snowflake,
                {
                    left: x,
                    fontSize: config.size,
                    opacity: config.opacity,
                },
                animatedStyle,
            ]}
        >
            {config.type}
        </Animated.Text>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        overflow: "hidden",
    },
    snowflake: {
        position: "absolute",
        color: "white",
    },
});