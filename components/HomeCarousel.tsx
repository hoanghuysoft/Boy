import { BlurMask } from "@/components/blur mask/BlurMask";
import { useThemeContext } from "@/context/ThemeContext";
import { isGifUrl } from "@/utils/checkGif";
import { useHomeCarouselViewModel } from "@/viewmodels/HomeCarouselViewModel";
import {
    Canvas,
    ImageShader,
    Image as SkiaImage,
    LinearGradient as SkiaLinearGradient,
    useAnimatedImageValue,
    useImage,
    vec
} from "@shopify/react-native-skia";
import { LinearGradient } from "expo-linear-gradient";
import React, { memo, useMemo } from "react";
import { Animated, StyleSheet } from "react-native";
import { easeGradient } from "react-native-easing-gradient";
import { useSharedValue } from "react-native-reanimated";

// Component for static images
const StaticCarouselImage = memo(({ imageUrl, screenWidth, carouselHeight, blurHeight }: { imageUrl: string; screenWidth: number; carouselHeight: number; blurHeight: number }) => {
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
                    width={screenWidth}
                    height={carouselHeight}
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
                    height: blurHeight,
                }}
                pointerEvents="none"
            >
                <BlurMask
                    mask={
                        <SkiaLinearGradient
                            start={vec(0, 0)}
                            end={vec(0, blurHeight)}
                            colors={["transparent", "black"]}
                        />
                    }
                >
                    <ImageShader
                        image={image}
                        x={0}
                        y={-(carouselHeight - blurHeight)}
                        width={screenWidth}
                        height={carouselHeight}
                        fit="cover"
                        tx="clamp"
                        ty="clamp"
                    />
                </BlurMask>
            </Canvas>
        </>
    );
});
StaticCarouselImage.displayName = "StaticCarouselImage";

const AnimatedCarouselImage = memo(({ imageUrl, screenWidth, carouselHeight, blurHeight }: { imageUrl: string; screenWidth: number; carouselHeight: number; blurHeight: number }) => {
    const isPaused = useSharedValue(false);
    const animatedImage = useAnimatedImageValue(imageUrl, isPaused);

    if (!animatedImage) return null;

    return (
        <>
            <Canvas style={StyleSheet.absoluteFill}>
                <SkiaImage
                    image={animatedImage}
                    x={0}
                    y={0}
                    width={screenWidth}
                    height={carouselHeight}
                    fit="cover"
                />
            </Canvas>

            <Canvas
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: blurHeight,
                }}
                pointerEvents="none"
            >
                <BlurMask
                    mask={
                        <SkiaLinearGradient
                            start={vec(0, 0)}
                            end={vec(0, blurHeight)}
                            colors={["transparent", "black"]}
                        />
                    }
                >
                    <ImageShader
                        image={animatedImage}
                        x={0}
                        y={-(carouselHeight - blurHeight)}
                        width={screenWidth}
                        height={carouselHeight}
                        fit="cover"
                        tx="clamp"
                        ty="clamp"
                    />
                </BlurMask>
            </Canvas>
        </>
    );
});
AnimatedCarouselImage.displayName = "AnimatedCarouselImage";

const SkiaCarouselImage = memo(({ imageUrl, screenWidth, carouselHeight }: { imageUrl: string | undefined, screenWidth: number, carouselHeight: number }) => {
    const blurHeight = carouselHeight * 0.5;
    if (!imageUrl) return null;
    if (isGifUrl(imageUrl)) {
        return <AnimatedCarouselImage imageUrl={imageUrl} screenWidth={screenWidth} carouselHeight={carouselHeight} blurHeight={blurHeight} />;
    }
    return <StaticCarouselImage imageUrl={imageUrl} screenWidth={screenWidth} carouselHeight={carouselHeight} blurHeight={blurHeight} />;
});
SkiaCarouselImage.displayName = "SkiaCarouselImage";

const ColorGradientOverlay = memo(({ carouselHeight }: { carouselHeight: number }) => {
    const { theme } = useThemeContext();
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
                height: carouselHeight * 0.4,
            }}
        />
    );
});
ColorGradientOverlay.displayName = "ColorGradientOverlay";

interface HomeCarouselProps {
    animatedVisibility?: Animated.Value;
}

const HomeCarousel = memo(({ animatedVisibility }: HomeCarouselProps) => {
    const {
        currentImageUrl,
        SCREEN_WIDTH,
        CAROUSEL_HEIGHT,
    } = useHomeCarouselViewModel(animatedVisibility);

    const animatedStyle = useMemo(() => {
        if (!animatedVisibility) return {};
        return {
            opacity: animatedVisibility,
            transform: [
                {
                    translateY: animatedVisibility.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-CAROUSEL_HEIGHT * 0.3, 0],
                    }),
                },
                {
                    scale: animatedVisibility.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.95, 1],
                    }),
                },
            ],
        };
    }, [animatedVisibility, CAROUSEL_HEIGHT]);

    return (
        <Animated.View style={[{
            width: SCREEN_WIDTH,
            height: CAROUSEL_HEIGHT,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
        }, animatedStyle]}>
            <SkiaCarouselImage
                imageUrl={currentImageUrl}
                screenWidth={SCREEN_WIDTH}
                carouselHeight={CAROUSEL_HEIGHT}
            />
            <ColorGradientOverlay carouselHeight={CAROUSEL_HEIGHT} />
        </Animated.View>
    )
});
HomeCarousel.displayName = "HomeCarousel";

export default HomeCarousel;