import { BlurMask } from "@/components/blur mask/BlurMask";
import { useThemeContext } from "@/context/ThemeContext";
import { isGifUrl } from "@/utils/checkGif";
import { useHomeCarouselViewModel } from "@/viewmodels/HomeCarouselViewModel";
import {
    Canvas,
    ImageShader,
    Rect,
    Image as SkiaImage,
    LinearGradient as SkiaLinearGradient,
    useAnimatedImageValue,
    useImage,
    vec
} from "@shopify/react-native-skia";
import React, { memo, useCallback, useEffect, useMemo } from "react";
import { Animated, StyleSheet, useWindowDimensions } from "react-native";
import { useSharedValue } from "react-native-reanimated";

// Component for static images
const StaticCarouselImage = memo(({ imageUrl, screenWidth, carouselHeight, blurHeight, onImageLoaded }: { imageUrl: string; screenWidth: number; carouselHeight: number; blurHeight: number; onImageLoaded?: () => void }) => {
    const image = useImage(imageUrl);

    useEffect(() => {
        if (image) onImageLoaded?.();
    }, [image]);

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

const AnimatedCarouselImage = memo(({ imageUrl, screenWidth, carouselHeight, blurHeight, onImageLoaded }: { imageUrl: string; screenWidth: number; carouselHeight: number; blurHeight: number; onImageLoaded?: () => void }) => {
    const isPaused = useSharedValue(false);
    const animatedImage = useAnimatedImageValue(imageUrl, isPaused);

    useEffect(() => {
        if (animatedImage) onImageLoaded?.();
    }, [animatedImage]);

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

const SkiaCarouselImage = memo(({ imageUrl, screenWidth, carouselHeight, onImageLoaded }: { imageUrl: string | undefined, screenWidth: number, carouselHeight: number, onImageLoaded?: () => void }) => {
    const blurHeight = carouselHeight * 0.5;
    if (!imageUrl) return null;
    if (isGifUrl(imageUrl)) {
        return <AnimatedCarouselImage imageUrl={imageUrl} screenWidth={screenWidth} carouselHeight={carouselHeight} blurHeight={blurHeight} onImageLoaded={onImageLoaded} />;
    }
    return <StaticCarouselImage imageUrl={imageUrl} screenWidth={screenWidth} carouselHeight={carouselHeight} blurHeight={blurHeight} onImageLoaded={onImageLoaded} />;
});
SkiaCarouselImage.displayName = "SkiaCarouselImage";

const ColorGradientOverlay = memo(({ carouselHeight }: { carouselHeight: number }) => {
    const { theme } = useThemeContext();
    const { width: screenWidth } = useWindowDimensions();
    const overlayHeight = carouselHeight * 0.5;

    // Explicitly define the 0-opacity starting colors to prevent muddy gray banding
    const transparentColor = theme === "light" ? "rgba(246, 246, 246, 0)" : "rgba(0, 0, 0, 0)";
    const midColor1 = theme === "light" ? "rgba(246, 246, 246, 0.2)" : "rgba(0, 0, 0, 0.2)";
    const midColor2 = theme === "light" ? "rgba(246, 246, 246, 0.7)" : "rgba(0, 0, 0, 0.7)";
    const solidColor = theme === "light" ? "rgba(246, 246, 246, 1)" : "rgba(0, 0, 0, 1)";

    return (
        <Canvas
            pointerEvents="none"
            style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: overlayHeight,
            }}
        >
            <Rect x={0} y={0} width={screenWidth} height={overlayHeight}>
                <SkiaLinearGradient
                    start={vec(0, 0)}
                    end={vec(0, overlayHeight)}
                    colors={[transparentColor, midColor1, midColor2, solidColor]}

                    positions={[0, 0.6, 0.85, 1]}
                />
            </Rect>
        </Canvas>
    );
});
ColorGradientOverlay.displayName = "ColorGradientOverlay";

interface HomeCarouselProps {
    animatedVisibility?: Animated.Value;
}

const HomeCarousel = memo(({ animatedVisibility }: HomeCarouselProps) => {
    const {
        currentImageUrl,
        analyzeImageLuminance,
        SCREEN_WIDTH,
        CAROUSEL_HEIGHT,
    } = useHomeCarouselViewModel(animatedVisibility);

    // Only fire text-color analysis once Skia confirms the image is actually painted,
    // so overlayColor never jumps ahead of the visible image.
    const handleImageLoaded = useCallback(() => {
        if (currentImageUrl) analyzeImageLuminance(currentImageUrl);
    }, [currentImageUrl, analyzeImageLuminance]);

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
                onImageLoaded={handleImageLoaded}
            />
            <ColorGradientOverlay carouselHeight={CAROUSEL_HEIGHT} />
        </Animated.View>
    )
});
HomeCarousel.displayName = "HomeCarousel";

export default HomeCarousel;