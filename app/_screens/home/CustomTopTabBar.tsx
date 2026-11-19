import { FlexText } from "@/components/FlexText";
import React, { useEffect, useMemo } from "react";
import { Animated, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import type { NavigationState, Route, SceneRendererProps } from "react-native-tab-view";
import { useThemeContext } from "../../../context/ThemeContext";
import { createCommonStyles } from "../../../styles/common";

type CustomTopTabBarProps = SceneRendererProps & {
    navigationState: NavigationState<Route>;
    tabBgOpacity: Animated.AnimatedInterpolation<string | number>; // Animated background opacity (inverse of carousel visibility)
    tabOpacity: Animated.Value;
    iconColor?: string; // Static color for labels (black/white or theme color)
};

const CustomTopTabBar: React.FC<CustomTopTabBarProps> = ({
    navigationState,
    jumpTo,
    tabBgOpacity,
    tabOpacity,
    iconColor,
}) => {
    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);

    // Create animated values for each tab indicator
    const indicatorAnims = useMemo(
        () => navigationState.routes.map((_: Route, index: number) => new Animated.Value(navigationState.index === index ? 1 : 0)),
        [navigationState.routes.length]
    );

    useEffect(() => {
        // Animate all indicators
        const animations = navigationState.routes.map((_: Route, index: number) =>
            Animated.spring(indicatorAnims[index], {
                toValue: navigationState.index === index ? 1 : 0,
                useNativeDriver: true,
                friction: 8,
                tension: 100,
            })
        );

        Animated.parallel(animations).start();
    }, [navigationState.index, indicatorAnims, navigationState.routes]);

    return (
        <Animated.View style={{
            paddingHorizontal: 12,
            marginTop: -5,
            opacity: tabOpacity,
        }}>
            <View
                style={{
                    borderRadius: 999,
                    overflow: 'hidden',
                }}
            >
                <Animated.View
                    style={{
                        ...StyleSheet.absoluteFill,
                        backgroundColor: colors.surfaceContainerLow + "E6",
                        opacity: tabBgOpacity,
                    }}
                />
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ flexGrow: 0 }}
                    contentContainerStyle={{ padding: 12 }}
                >
                    {navigationState.routes.map((route, index) => {
                        const label = route.title ?? route.key;
                        const isFocused = navigationState.index === index;

                        const onPress = () => {
                            if (!isFocused) {
                                jumpTo(route.key);
                            }
                        };

                        // Use provided iconColor if available, otherwise use theme colors
                        // For focused: full opacity, for unfocused: reduced opacity
                        const textColor = iconColor || (isFocused ? colors.onSurface : colors.onSurfaceVariant);

                        return (
                            <TouchableOpacity
                                key={route.key}
                                style={styles.tabItem}
                                onPress={onPress}
                                accessibilityRole="button"
                                accessibilityState={isFocused ? { selected: true } : {}}
                            >
                                <FlexText
                                    style={[
                                        common.label,
                                        {
                                            color: textColor,
                                            fontWeight: isFocused ? "600" : "400",
                                            opacity: isFocused ? 1 : 0.6,
                                        },
                                    ]}
                                >
                                    {label}
                                </FlexText>
                                <Animated.View
                                    style={[
                                        styles.activeIndicator,
                                        {
                                            backgroundColor: colors.primary,
                                            opacity: indicatorAnims[index],
                                            transform: [{ scaleX: indicatorAnims[index] }],
                                        },
                                    ]}
                                />
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    tabItem: {
        paddingRight: 16,
    },
    activeIndicator: {
        width: '100%',
        height: 2,
        backgroundColor: 'orange',
        borderRadius: 999,
    },
});

export default React.memo(CustomTopTabBar);
