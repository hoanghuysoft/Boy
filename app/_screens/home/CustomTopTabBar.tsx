import { FlexText } from "@/components/FlexText";
import { MaterialTopTabBarProps } from "expo-router/build/react-navigation/material-top-tabs";
import React, { useEffect, useRef } from "react";
import { Animated, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useThemeContext } from "../../../context/ThemeContext";
import { createCommonStyles } from "../../../styles/common";

interface CustomTopTabBarProps extends MaterialTopTabBarProps {
    tabBgOpacity: Animated.AnimatedInterpolation<string | number>; // Animated background opacity (inverse of carousel visibility)
    tabOpacity: Animated.Value;
    iconColor?: string; // Static color for labels (black/white or theme color)
}

const CustomTopTabBar: React.FC<CustomTopTabBarProps> = ({
    state,
    descriptors,
    navigation,
    tabBgOpacity,
    tabOpacity,
    iconColor,
}) => {
    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);

    // Create animated values for each tab indicator
    const indicatorAnims = useRef(
        state.routes.map((_: {}, index: number) => new Animated.Value(state.index === index ? 1 : 0))
    ).current;

    useEffect(() => {
        // Animate all indicators
        const animations = state.routes.map((_: {}, index: number) =>
            Animated.spring(indicatorAnims[index], {
                toValue: state.index === index ? 1 : 0,
                useNativeDriver: true,
                friction: 8,
                tension: 100,
            })
        );

        Animated.parallel(animations).start();
    }, [state.index]);

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
                        backgroundColor: colors.tabBar + "E6",
                        opacity: tabBgOpacity,
                    }}
                />
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ flexGrow: 0 }}
                    contentContainerStyle={{ padding: 12 }}
                >
                    {state.routes.map((route, index) => {
                        const { options } = descriptors[route.key];
                        const label = options.tabBarLabel !== undefined
                            ? options.tabBarLabel
                            : options.title !== undefined
                                ? options.title
                                : route.name;

                        const isFocused = state.index === index;

                        const onPress = () => {
                            const event = navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            });

                            if (!isFocused && !event.defaultPrevented) {
                                navigation.navigate(route.name);
                            }
                        };

                        // Use provided iconColor if available, otherwise use theme colors
                        // For focused: full opacity, for unfocused: reduced opacity
                        const textColor = iconColor || (isFocused ? colors.text : colors.muted);

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
                                    {typeof label === 'string' ? label : route.name}
                                </FlexText>
                                <Animated.View
                                    style={[
                                        styles.activeIndicator,
                                        {
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

export default CustomTopTabBar;
