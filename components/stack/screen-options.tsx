import { interpolate, interpolateColor } from "react-native-reanimated";
import { ScreenInterpolationProps } from "react-native-screen-transitions";
import { BlankStackNavigationOptions } from "react-native-screen-transitions/blank-stack";

// Open spring: snappy, fast settle — user feels instant response
const SNAPPY_OPEN_SPRING = {
    stiffness: 1000,
    damping: 500,
    mass: 3,
    overshootClamping: true
}

// Close spring: smooth enough for the screen to visibly slide off-screen
// High stiffness + high damping kills the animation in 1-2 frames when velocity is large.
// Use lighter spring so the dismiss gesture always produces a visible slide-out.
const SMOOTH_CLOSE_SPRING = {
    stiffness: 300,
    damping: 35,
    mass: 1,
    overshootClamping: true
}

const PARALLAX_SPRING_OPEN = {
    stiffness: 800,
    damping: 80,
    mass: 1,
    overshootClamping: true
}

// Lighter spring for close — ensures visible slide-out even on fast flings
const PARALLAX_SPRING_CLOSE = {
    stiffness: 350,
    damping: 38,
    mass: 1,
    overshootClamping: true
}

export const getFullScreenSheetScale = (): BlankStackNavigationOptions => {
    return {
        experimental_enableHighRefreshRate: false,
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
        // Bug workaround: gestureVelocityImpact=0.15 (default=0.3) reduces false-positive
        // dismiss when a system overlay (e.g. Android image picker) is dismissed and
        // triggers a spurious beforeRemove nav event intercepted by the library.
        // The lower value requires more deliberate user intent to dismiss.
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