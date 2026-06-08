import { interpolate, interpolateColor } from "react-native-reanimated";
import { ScreenInterpolationProps } from "react-native-screen-transitions";
import { BlankStackNavigationOptions } from "react-native-screen-transitions/blank-stack";

const SNAPPY_SPRING = {
    stiffness: 1000,
    damping: 500,
    mass: 3,
    overshootClamping: true
}

const PARALLAX_SPRING = {
    stiffness: 800,
    damping: 80,
    mass: 1,
    overshootClamping: true
}

export const getFullScreenSheetScale = (): BlankStackNavigationOptions => {
    return {
        experimental_enableHighRefreshRate: true,
        gestureEnabled: true,
        gestureDirection: "vertical" as const,
        screenStyleInterpolator: ({
            insets: { top, bottom, left, right },
            layouts: {
                screen: { height, width },
            },
            progress,
        }: ScreenInterpolationProps
        ) => {
            "worklet";
            const scale = interpolate(progress, [0, 1, 2], [1, 1, 0.96], "clamp");
            const translateY = interpolate(
                progress,
                [0, 1, 2],
                [height, 0, top - 14],
                "clamp",
            );
            return {
                content: {
                    style: {
                        transform: [{ scale }, { translateY }],
                        borderRadius: 24,
                        overflow: 'hidden',
                    },
                },
                backdrop: {
                    style: {
                        backgroundColor: 'transparent',
                    },
                },
            }
        },
        transitionSpec: {
            open: SNAPPY_SPRING,
            close: SNAPPY_SPRING
        }
    }
}

/**
 * Premium Parallax slide transition. 
 * Pushes from the right, with the behind screen scaling down slightly, 
 * shifting left for parallax, rounding its corners, and fading beneath a dark overlay.
 */
export const getParallaxSlideTransition = (): BlankStackNavigationOptions => {
    return {
        experimental_enableHighRefreshRate: true,
        gestureEnabled: true,
        gestureDirection: "horizontal" as const,
        screenStyleInterpolator: ({
            layouts: {
                screen: { width },
            },
            progress,
        }: ScreenInterpolationProps) => {
            "worklet";
            const scale = interpolate(progress, [0, 1, 2], [1, 1, 0.95], "clamp");
            const translateX = interpolate(
                progress,
                [0, 1, 2],
                [width, 0, -width * 0.25],
                "clamp",
            );
            const borderRadius = interpolate(
                progress,
                [0, 1, 2],
                [0, 0, 24],
                "clamp",
            );
            const opacity = interpolate(
                progress,
                [0, 1, 2],
                [1, 1, 0.75],
                "clamp",
            );
            const backdropColor = interpolateColor(
                progress,
                [0, 1, 2],
                ["rgba(0,0,0,0)", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.4)"]
            );

            return {
                content: {
                    style: {
                        transform: [{ scale }, { translateX }],
                        borderRadius,
                        opacity,
                        overflow: 'hidden',
                    },
                },
                backdrop: {
                    style: {
                        backgroundColor: backdropColor,
                    },
                },
            };
        },
        transitionSpec: {
            open: PARALLAX_SPRING,
            close: PARALLAX_SPRING
        }
    }
}

/**
 * Smooth scale zoom and fade transition. 
 * Ideal for lightweight sub-screens or modals.
 */
export const getScaleFadeTransition = (): BlankStackNavigationOptions => {
    return {
        experimental_enableHighRefreshRate: true,
        gestureEnabled: true,
        gestureDirection: "horizontal" as const,
        screenStyleInterpolator: ({
            progress,
        }: ScreenInterpolationProps) => {
            "worklet";
            const scale = interpolate(progress, [0, 1, 2], [0.92, 1, 0.92], "clamp");
            const opacity = interpolate(
                progress,
                [0, 1, 2],
                [0, 1, 0],
                "clamp",
            );
            const backdropColor = interpolateColor(
                progress,
                [0, 1, 2],
                ["rgba(0,0,0,0)", "rgba(0,0,0,0.35)", "rgba(0,0,0,0.35)"]
            );

            return {
                content: {
                    style: {
                        transform: [{ scale }],
                        opacity,
                    },
                },
                backdrop: {
                    style: {
                        backgroundColor: backdropColor,
                    },
                },
            };
        },
        transitionSpec: {
            open: PARALLAX_SPRING,
            close: PARALLAX_SPRING
        }
    }
}