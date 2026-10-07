import { Blur, Canvas, Group, Image, Paint, Rect, useImage, vec } from "@shopify/react-native-skia";
import React, { memo, useEffect, useMemo, useState } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withDelay,
    withSequence,
    withTiming
} from "react-native-reanimated";

import { useThemeContext } from "@/context/ThemeContext";
import { fourhands } from "@/experimental/theme";
import { useSimpleAudio } from "@/hooks/useSimpleAudio";

export interface ThemeOverlayProps {
    themeData?: typeof fourhands;
    logoSource?: any;
    audioSource?: any;
    durationMs?: number;
    tintColor?: string;
    onFinishIntro?: () => void;
}

export const ThemeOverlay: React.FC<ThemeOverlayProps> = memo(({
    themeData = fourhands,
    logoSource,
    audioSource,
    durationMs = 4200,
    tintColor,
    onFinishIntro,
}) => {
    const { width, height } = useWindowDimensions();
    const { colors, theme } = useThemeContext();

    // ─── Audio Playback (Single Playback via Global Simple Audio) ─────────
    // Audio plays once on profile open, continues past the intro,
    // and stops/restarts when the user exits and re-enters the profile.
    const audio = audioSource ?? themeData?.audio ?? fourhands.audio;
    const { play } = useSimpleAudio(audio, {
        id: "profile-theme-audio",
    });

    useEffect(() => {
        play();
    }, [play]);

    // ─── Visual Intro State & Skia Animation ─────────────────────────────
    const [isVisualActive, setIsVisualActive] = useState(true);

    const resolvedLogo = logoSource ?? themeData?.logo ?? fourhands.logo;
    const logoImage = useImage(resolvedLogo);

    const logoWidth = Math.min(width * 0.62, 260);
    const logoHeight = logoWidth * (50 / 160);
    const logoX = (width - logoWidth) / 2;
    const logoY = (height - logoHeight) / 2;
    const center = useMemo(() => vec(width / 2, height / 2), [width, height]);

    // Animation values:
    // 1. Scale down from 1.45 -> 1.0
    const scale = useSharedValue(1.45);
    // 2. Offset from left (-50) -> 0 (center)
    const translateX = useSharedValue(-50);
    // 3. Blur from 28 -> 0
    const blur = useSharedValue(28);
    // 4. Logo opacity
    const logoOpacity = useSharedValue(0);
    // 5. Overlay tint opacity
    const overlayOpacity = useSharedValue(1);

    const finishIntro = () => {
        setIsVisualActive(false);
        onFinishIntro?.();
    };

    useEffect(() => {
        if (!logoImage) return;

        // Reset to initial values
        scale.value = 1.45;
        translateX.value = -50;
        blur.value = 28;
        logoOpacity.value = 0;
        overlayOpacity.value = 1;

        // Trigger on next frame so initial frame paints before animating
        const raf = requestAnimationFrame(() => {
            const entranceEasing = Easing.bezier(0.22, 1, 0.36, 1);
            const fadeOutDuration = 800;
            const holdDuration = Math.max(1200, durationMs - 1800 - fadeOutDuration);

            scale.value = withSequence(
                withTiming(1.0, { duration: 1800, easing: entranceEasing }),
                withDelay(
                    holdDuration,
                    withTiming(0.95, { duration: fadeOutDuration, easing: Easing.inOut(Easing.cubic) })
                )
            );

            translateX.value = withTiming(0, {
                duration: 1800,
                easing: entranceEasing,
            });

            blur.value = withTiming(0, {
                duration: 1700,
                easing: Easing.bezier(0.25, 1, 0.5, 1),
            });

            logoOpacity.value = withSequence(
                withTiming(1, { duration: 700, easing: Easing.out(Easing.quad) }),
                withDelay(
                    1100 + holdDuration,
                    withTiming(0, { duration: fadeOutDuration, easing: Easing.inOut(Easing.cubic) })
                )
            );

            // Entire overlay fade out at the end
            overlayOpacity.value = withDelay(
                Math.max(0, durationMs - fadeOutDuration),
                withTiming(0, { duration: fadeOutDuration, easing: Easing.inOut(Easing.cubic) }, (finished) => {
                    if (finished) {
                        runOnJS(finishIntro)();
                    }
                })
            );
        });

        return () => cancelAnimationFrame(raf);
    }, [logoImage, durationMs]);

    // Skia Derived Values
    const transform = useDerivedValue(() => [
        { translateX: translateX.value },
        { scale: scale.value },
    ]);
    const blurVal = useDerivedValue(() => Math.max(0, blur.value));
    const logoOpacityVal = useDerivedValue(() => logoOpacity.value);
    const overlayOpacityVal = useDerivedValue(() => overlayOpacity.value);

    const resolvedTintColor =
        tintColor ??
        (theme === "dark"
            ? "rgba(10, 10, 14, 0.94)"
            : "rgba(18, 18, 24, 0.90)");

    const containerAnimatedStyle = useAnimatedStyle(() => ({
        opacity: overlayOpacity.value,
    }));

    return (
        <>
            {isVisualActive && (
                <Animated.View
                    style={[StyleSheet.absoluteFill, styles.container, containerAnimatedStyle]}
                    pointerEvents="box-none"
                >
                    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
                        {/* Full Screen Tint Background */}
                        <Rect
                            x={0}
                            y={0}
                            width={width}
                            height={height}
                            color={resolvedTintColor}
                            opacity={overlayOpacityVal}
                        />

                        {/* Logo centered with Blur, Scale-down, and TranslateX into center */}
                        {logoImage && (
                            <Group
                                origin={center}
                                transform={transform}
                                opacity={logoOpacityVal}
                                layer={
                                    <Paint>
                                        <Blur blur={blurVal} mode="clamp" />
                                    </Paint>
                                }
                            >
                                <Image
                                    image={logoImage}
                                    x={logoX}
                                    y={logoY}
                                    width={logoWidth}
                                    height={logoHeight}
                                    fit="contain"
                                />
                            </Group>
                        )}
                    </Canvas>
                </Animated.View>
            )}
        </>
    );
});

const styles = StyleSheet.create({
    container: {
        zIndex: 99999,
        elevation: 99999,
    },
});

export default ThemeOverlay;
