import { BlurMask } from "@/components/blur mask/BlurMask";
import { useThemeContext } from "@/context/ThemeContext";
import { useCarouselQuery } from "@/services/carousel";
import { Canvas, ImageShader, Image as SkiaImage, LinearGradient as SkiaLinearGradient, useAnimatedImageValue, useImage, vec } from "@shopify/react-native-skia";
import { LinearGradient } from "expo-linear-gradient";
import _ from "lodash";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Dimensions, StyleSheet } from "react-native";
import { easeGradient } from "react-native-easing-gradient";
import { useSharedValue } from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CAROUSEL_HEIGHT = SCREEN_HEIGHT * 0.28; // 28% of screen height
const BLUR_HEIGHT = CAROUSEL_HEIGHT * 0.5; // Blur only bottom 50% of carousel
const AUTO_SCROLL_INTERVAL = 5000; // 5 seconds

// Helper to check if URL is a GIF
const isGifUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    const lowercaseUrl = url.toLowerCase();
    return lowercaseUrl.endsWith('.gif') || lowercaseUrl.includes('.gif?');
};

// Component for static images
const StaticCarouselImage = memo(({ imageUrl }: { imageUrl: string }) => {
    const image = useImage(imageUrl);

    if (!image) return null;

    return (
        <>
            {/* Main carousel image */}
            <Canvas style={StyleSheet.absoluteFill}>
                <SkiaImage
                    image={image}
                    x={0}
                    y={0}
                    width={SCREEN_WIDTH}
                    height={CAROUSEL_HEIGHT}
                    fit="cover"
                />
            </Canvas>

            {/* Blur overlay at bottom */}
            <Canvas
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: BLUR_HEIGHT,
                }}
                pointerEvents="none"
            >
                <BlurMask
                    mask={
                        <SkiaLinearGradient
                            start={vec(0, 0)}
                            end={vec(0, BLUR_HEIGHT)}
                            colors={["transparent", "black"]}
                        />
                    }
                >
                    <ImageShader
                        image={image}
                        x={0}
                        y={-(CAROUSEL_HEIGHT - BLUR_HEIGHT)}
                        width={SCREEN_WIDTH}
                        height={CAROUSEL_HEIGHT}
                        fit="cover"
                        tx="clamp"
                        ty="clamp"
                    />
                </BlurMask>
            </Canvas>
        </>
    );
});

// Component for animated GIFs
const AnimatedCarouselImage = memo(({ imageUrl }: { imageUrl: string }) => {
    const isPaused = useSharedValue(false);
    const animatedImage = useAnimatedImageValue(imageUrl, isPaused);

    if (!animatedImage) return null;

    return (
        <>
            {/* Main carousel image */}
            <Canvas style={StyleSheet.absoluteFill}>
                <SkiaImage
                    image={animatedImage}
                    x={0}
                    y={0}
                    width={SCREEN_WIDTH}
                    height={CAROUSEL_HEIGHT}
                    fit="cover"
                />
            </Canvas>

            {/* Blur overlay at bottom */}
            <Canvas
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: BLUR_HEIGHT,
                }}
                pointerEvents="none"
            >
                <BlurMask
                    mask={
                        <SkiaLinearGradient
                            start={vec(0, 0)}
                            end={vec(0, BLUR_HEIGHT)}
                            colors={["transparent", "black"]}
                        />
                    }
                >
                    <ImageShader
                        image={animatedImage}
                        x={0}
                        y={-(CAROUSEL_HEIGHT - BLUR_HEIGHT)}
                        width={SCREEN_WIDTH}
                        height={CAROUSEL_HEIGHT}
                        fit="cover"
                        tx="clamp"
                        ty="clamp"
                    />
                </BlurMask>
            </Canvas>
        </>
    );
});

// Combined carousel image that chooses between static and animated
const SkiaCarouselImage = memo(({ imageUrl }: { imageUrl: string | undefined }) => {
    if (!imageUrl) return null;

    // Use animated component for GIFs, static for other images
    if (isGifUrl(imageUrl)) {
        return <AnimatedCarouselImage imageUrl={imageUrl} />;
    }

    return <StaticCarouselImage imageUrl={imageUrl} />;
});

// Color gradient overlay - memoized with useMemo for gradient calculation
const ColorGradientOverlay = memo(() => {
    const { theme } = useThemeContext();

    // Memoize gradient calculation - only recalculate when theme changes
    const { colors, locations } = useMemo(() => easeGradient({
        colorStops: {
            0: {
                color: "transparent",
            },
            1: {
                color: theme === "light"
                    ? "rgba(241, 241, 243, 1)"
                    : "rgba(0,0,0,1)",
            },
        },
        extraColorStopsPerTransition: 12,
    }), [theme]);

    return (
        <LinearGradient
            pointerEvents="none"
            colors={colors as [string, string, ...string[]]}
            locations={locations as [number, number, ...number[]]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: CAROUSEL_HEIGHT * 0.4,
            }}
        />
    );
});

interface HomeCarouselProps {
    animatedVisibility?: Animated.Value; // Animated value for smooth show/hide and auto-scroll control
}

const HomeCarousel = memo(({ animatedVisibility }: HomeCarouselProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const { theme } = useThemeContext();
    const { data: carouselData = [] } = useCarouselQuery();

    // Filter to only include active carousel items
    const activeCarouselData = useMemo(
        () => carouselData.filter(item => item.is_active),
        [carouselData]
    );

    // Get current image URL for carousel and blur overlay
    const currentImageUrl = activeCarouselData[currentIndex]?.image_url;

    // Track remaining indices for random non-repeating selection
    const remainingIndicesRef = useRef<number[]>([]);
    const currentIndexRef = useRef(currentIndex);
    currentIndexRef.current = currentIndex;

    // Function to get next random index without repeating
    const getNextRandomIndex = useCallback(() => {
        // If no remaining indices, reset with all indices
        if (remainingIndicesRef.current.length === 0) {
            remainingIndicesRef.current = _.range(activeCarouselData.length);
        }

        // Remove current index from remaining if present (to avoid showing same image twice in a row)
        const indicesToUse = _.without(remainingIndicesRef.current, currentIndexRef.current);
        const finalIndices = indicesToUse.length > 0 ? indicesToUse : remainingIndicesRef.current;

        // Pick random index from remaining using lodash sample
        const nextIndex = _.sample(finalIndices) ?? 0;

        // Remove the picked index from remaining
        _.pull(remainingIndicesRef.current, nextIndex);

        return nextIndex;
    }, [activeCarouselData.length]); // Only depend on data length, use ref for currentIndex

    // Track visibility via animated value listener (avoids re-renders from state)
    const isVisibleRef = useRef(true);

    // Single effect for auto-scroll management
    useEffect(() => {
        if (activeCarouselData.length === 0) return;

        const startAutoScroll = () => {
            if (intervalRef.current) return; // Already running
            intervalRef.current = setInterval(() => {
                const nextIndex = getNextRandomIndex();
                setCurrentIndex(nextIndex);
            }, AUTO_SCROLL_INTERVAL);
        };

        const stopAutoScroll = () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };

        // Start initially
        startAutoScroll();

        // Listen to visibility changes
        let listenerId: string | undefined;
        if (animatedVisibility) {
            listenerId = animatedVisibility.addListener(({ value }) => {
                const shouldBeVisible = value > 0.5;
                if (isVisibleRef.current !== shouldBeVisible) {
                    isVisibleRef.current = shouldBeVisible;
                    if (shouldBeVisible) {
                        startAutoScroll();
                    } else {
                        stopAutoScroll();
                    }
                }
            });
        }

        return () => {
            stopAutoScroll();
            if (listenerId && animatedVisibility) {
                animatedVisibility.removeListener(listenerId);
            }
        };
    }, [activeCarouselData.length, animatedVisibility, getNextRandomIndex]); // Include getNextRandomIndex

    const animatedStyle = useMemo(() => {
        if (!animatedVisibility) return {};
        return {
            opacity: animatedVisibility,
            transform: [
                {
                    translateY: animatedVisibility.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-CAROUSEL_HEIGHT * 0.3, 0], // Slide up when hiding
                    }),
                },
                {
                    scale: animatedVisibility.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.95, 1], // Slight scale down when hiding
                    }),
                },
            ],
        };
    }, [animatedVisibility]);

    return (
        <Animated.View style={[{
            width: SCREEN_WIDTH,
            height: CAROUSEL_HEIGHT,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
        }, animatedStyle]}>
            <SkiaCarouselImage imageUrl={currentImageUrl} />
            <ColorGradientOverlay />
        </Animated.View>
    )
});

export default HomeCarousel;