import { interpolate, interpolateColor } from "react-native-reanimated";
import { ScreenInterpolationProps } from "react-native-screen-transitions";
import { BlankStackNavigationOptions } from "react-native-screen-transitions/blank-stack";

// Open spring: robust and snappy
const SNAPPY_OPEN_SPRING = {
    stiffness: 1000,
    damping: 500,
    mass: 3,
    overshootClamping: true,
    restSpeedThreshold: 0.02,
    restDisplacementThreshold: 0.002,
}

// Close spring: slightly OVERDAMPED (damping 45 > critical 40)
// This prevents the spring from bouncing below 0 when it settles,
// which fixes the "glitch" where the background screen scales out and in again.
// overshootClamping=false is still kept to prevent instant cancellation on frame drops.
const SMOOTH_CLOSE_SPRING = {
    stiffness: 400,
    damping: 45,
    mass: 1,
    overshootClamping: false,
    restSpeedThreshold: 0.02,
    restDisplacementThreshold: 0.002,
}

const PARALLAX_SPRING_OPEN = {
    stiffness: 800,
    damping: 80,
    mass: 1,
    overshootClamping: true
}

// Lighter spring for close — ensures visible slide-out even on fast flings
// Overdamped (damping 45 > critical 37) to prevent bounce glitch.
const PARALLAX_SPRING_CLOSE = {
    stiffness: 350,
    damping: 45,
    mass: 1,
    overshootClamping: false,
    restSpeedThreshold: 0.02,
    restDisplacementThreshold: 0.002,
}

export const getFullScreenSheetScale = (): BlankStackNavigationOptions => {
    return {
        experimental_enableHighRefreshRate: false,
        gestureEnabled: true,
        gestureDirection: "vertical" as const,
        screenStyleInterpolator: ({
            insets: { top },
            layouts: {
                screen: { height },
            },
            progress,
            next,
        }: ScreenInterpolationProps
        ) => {
            "worklet";
            const scale = interpolate(progress, [0, 1, 2], [1, 1, 0.96], "clamp");
            const translateY = interpolate(progress, [0, 1, 2], [height, 0, top - 14]);
            const opacity = interpolate(progress, [0, 1, 2], [0, 0.4, 0.4], "clamp");

            // Background screen scale effect
            const previousScale = interpolate(progress, [0, 1, 2], [1, 0.94, 0.94], "clamp");
            const previousBorderRadius = interpolate(progress, [0, 1, 2], [0, 20, 20], "clamp");
            const previousTranslateY = interpolate(progress, [0, 1, 2], [0, 10, 10], "clamp");

            return {
                content: {
                    style: {
                        transform: [{ scale }, { translateY }],
                        borderRadius: 24,
                    },
                },
                backdrop: {
                    style: {
                        backgroundColor: 'black',
                        opacity: opacity,
                    },
                },
                _ROOT_CONTAINER: {
                    style: {
                        transform: [
                            { scale: !next ? previousScale : 1 },
                            { translateY: !next ? previousTranslateY : 0 }
                        ],
                        borderRadius: !next ? previousBorderRadius : 0,
                        overflow: 'hidden',
                    },
                },
            }
        },
        gestureVelocityImpact: 0.15,
        transitionSpec: {
            open: SNAPPY_OPEN_SPRING,
            close: SMOOTH_CLOSE_SPRING,
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
        experimental_enableHighRefreshRate: false,
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
        // Limit gesture activation to left edge (20px) to prevent conflict
        // with MaterialTopTabNavigator's full-screen horizontal swipe.
        // This mirrors iOS standard back-gesture behavior.
        gestureActivationArea: "edge" as const,
        gestureResponseDistance: 20,
        // Lower velocity impact = more deliberate swipe needed → fewer false dismissals
        gestureVelocityImpact: 0.2,
        transitionSpec: {
            open: PARALLAX_SPRING_OPEN,
            close: PARALLAX_SPRING_CLOSE,
        }
    }
}

/**
 * Smooth scale zoom and fade transition. 
 * Ideal for lightweight sub-screens or modals.
 */
export const getScaleFadeTransition = (): BlankStackNavigationOptions => {
    return {
        experimental_enableHighRefreshRate: false,
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
            open: PARALLAX_SPRING_OPEN,
            close: PARALLAX_SPRING_CLOSE,
        }
    }
}