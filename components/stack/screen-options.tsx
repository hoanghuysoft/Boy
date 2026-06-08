import { interpolate } from "react-native-reanimated";
import { ScreenInterpolationProps } from "react-native-screen-transitions";
import { BlankStackNavigationOptions } from "react-native-screen-transitions/blank-stack";

const SNAPPY_SPRING = {
    stiffness: 1000,
    damping: 500,
    mass: 3,
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