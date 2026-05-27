import { useThemeContext } from "@/context/ThemeContext";
import { useHomeCarouselViewModel } from "@/viewmodels/HomeCarouselViewModel";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { memo, useCallback, useMemo } from "react";
import { Animated, StyleSheet } from "react-native";

interface CarouselImageProps {
    imageUrl: string | undefined;
    onImageLoaded?: () => void;
}

const CarouselImage = memo(({ imageUrl, onImageLoaded }: CarouselImageProps) => {
    if (!imageUrl) return null;

    return (
        <Image
            source={{ uri: imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            onLoad={onImageLoaded}
        />
    );
});
CarouselImage.displayName = "CarouselImage";

const ColorGradientOverlay = memo(({ carouselHeight }: { carouselHeight: number }) => {
    const { theme } = useThemeContext();
    const overlayHeight = carouselHeight * 0.8;

    // Explicitly define the 0-opacity starting colors to prevent muddy gray banding
    const transparentColor = theme === "light" ? "rgba(246, 246, 246, 0)" : "rgba(0, 0, 0, 0)";
    const midColor1 = theme === "light" ? "rgba(246, 246, 246, 0.35)" : "rgba(0, 0, 0, 0.35)";
    const midColor2 = theme === "light" ? "rgba(246, 246, 246, 0.8)" : "rgba(0, 0, 0, 0.8)";
    const solidColor = theme === "light" ? "rgba(246, 246, 246, 1)" : "rgba(0, 0, 0, 1)";

    return (
        <LinearGradient
            colors={[transparentColor, midColor1, midColor2, solidColor]}
            locations={[0, 0.4, 0.75, 1]}
            style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: overlayHeight,
            }}
            pointerEvents="none"
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
        analyzeImageLuminance,
        SCREEN_WIDTH,
        CAROUSEL_HEIGHT,
    } = useHomeCarouselViewModel(animatedVisibility);

    // Only fire text-color analysis once the image is actually loaded,
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
            <CarouselImage
                imageUrl={currentImageUrl}
                onImageLoaded={handleImageLoaded}
            />
            <ColorGradientOverlay carouselHeight={CAROUSEL_HEIGHT} />
        </Animated.View>
    );
});
HomeCarousel.displayName = "HomeCarousel";

export default HomeCarousel;