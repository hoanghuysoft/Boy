import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import {
    AddCircleBold,
    AddCircleOutline,
    HomeBold,
    HomeOutline,
    UserRoundedBold,
    UserRoundedOutline,
    VideoLibraryBold,
    VideoLibraryOutline
} from "@solar-icons/react-native";
import { SquircleView } from "expo-squircle-view";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Reanimated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeContext } from "../../context/ThemeContext";
import { useScrollStore } from "../../stores/scroll";

type TabName = "index" | "shots" | "search" | "chat" | "profile";

interface TabConfig {
    name: TabName;
    label: string;
    IconOutlined: any;
    IconSolid: any;
}

const tabs: TabConfig[] = [
    { name: "index", label: "Home", IconOutlined: HomeOutline, IconSolid: HomeBold },
    { name: "shots", label: "Shots", IconOutlined: VideoLibraryOutline, IconSolid: VideoLibraryBold },
    { name: "chat", label: "Create", IconOutlined: AddCircleOutline, IconSolid: AddCircleBold },
    { name: "profile", label: "Profile", IconOutlined: UserRoundedOutline, IconSolid: UserRoundedBold },
];

// ─── Animated Tab Button ─────────────────────────────────────────────
const AnimatedTabButton = ({
    route,
    isFocused,
    tabConfig,
    color,
    onPress,
    onLongPress,
    descriptors,
    colors,
    onLayout,
}: {
    route: any;
    isFocused: boolean;
    tabConfig: TabConfig;
    color: string;
    onPress: () => void;
    onLongPress: () => void;
    descriptors: any;
    colors: any;
    onLayout: (x: number, width: number) => void;
}) => {
    const scaleAnim = useRef(new Animated.Value(isFocused ? 1 : 0.95)).current;
    const opacityAnim = useRef(new Animated.Value(isFocused ? 1 : 0.6)).current;
    const iconScaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: isFocused ? 1 : 0.95,
                useNativeDriver: true,
                friction: 7,
                tension: 40,
            }),
            Animated.spring(opacityAnim, {
                toValue: isFocused ? 1 : 0.6,
                useNativeDriver: true,
                friction: 7,
                tension: 40,
            }),
        ]).start();
    }, [isFocused]);

    const handlePressIn = () => {
        Animated.spring(iconScaleAnim, { toValue: 0.85, useNativeDriver: true, friction: 5, tension: 100 }).start();
    };
    const handlePressOut = () => {
        Animated.spring(iconScaleAnim, { toValue: 1, useNativeDriver: true, friction: 5, tension: 100 }).start();
    };

    const Icon = isFocused ? tabConfig.IconSolid : tabConfig.IconOutlined;

    return (
        <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={descriptors[route.key].options.tabBarAccessibilityLabel}
            // Active tab gets more flex → pill is wider → proper capsule shape
            style={[styles.tabBarItem, { flex: isFocused ? 1.6 : 1 }]}
            onLayout={(e) => {
                const { x, width } = e.nativeEvent.layout;
                onLayout(x, width);
            }}
            onPress={() => { handlePressOut(); onPress(); }}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onLongPress={onLongPress}
            activeOpacity={1}
        >
            <Animated.View
                style={{
                    transform: [{ scale: Animated.multiply(scaleAnim, iconScaleAnim) }],
                    opacity: opacityAnim,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Icon size={24} color={color} />
                <Text
                    style={[
                        styles.tabBarLabel,
                        {
                            color,
                            fontWeight: isFocused ? "bold" : "normal",
                        },
                    ]}
                >
                    {tabConfig.label}
                </Text>
            </Animated.View>
        </TouchableOpacity>
    );
};

// ─── Custom Tab Bar ───────────────────────────────────────────────────
export const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
    const { colors } = useThemeContext();
    const insets = useSafeAreaInsets();
    const bottomSpacing = 13 + insets.bottom;

    // Per-tab measured layout — updated via onLayout callbacks
    const tabLayouts = useRef<Array<{ x: number; width: number }>>(
        state.routes.map(() => ({ x: 0, width: 0 }))
    );

    // Reanimated shared values — animate on the native UI thread
    const pillX = useSharedValue(0);
    const pillWidth = useSharedValue(0);

    const springConfig = { damping: 18, stiffness: 180, mass: 1 };

    const animatePill = (index: number) => {
        const layout = tabLayouts.current[index];
        if (!layout || layout.width === 0) return;

        pillX.value = withSpring(layout.x, springConfig);
        pillWidth.value = withSpring(layout.width, springConfig);
    };

    useEffect(() => {
        animatePill(state.index);
    }, [state.index]);

    const pillStyle = useAnimatedStyle(() => ({
        left: pillX.value,
        width: pillWidth.value,
    }));

    return (
        <SquircleView
            cornerSmoothing={100}
            preserveSmoothing
            style={[styles.tabBarContainer, { marginBottom: bottomSpacing }]}
        >
            <SquircleView cornerSmoothing={100} preserveSmoothing style={styles.blurContainer}>
                <View style={[styles.tabBarContent, { backgroundColor: colors.tabBar }]}>

                    {/* Pill — runs on native UI thread via reanimated */}
                    <Reanimated.View
                        style={[{
                            position: 'absolute',
                            top: 5,
                            bottom: 5,
                            zIndex: 0,
                        }, pillStyle]}
                    >
                        <SquircleView
                            cornerSmoothing={100}
                            preserveSmoothing
                            style={{
                                flex: 1,
                                backgroundColor: colors.card + "CC",
                                borderRadius: 999,
                            }}
                        />
                    </Reanimated.View>

                    {state.routes.map((route, index) => {
                        const isFocused = state.index === index;
                        const tabConfig = tabs.find((tab) => tab.name === route.name);
                        if (!tabConfig) return null;

                        const color = isFocused ? colors.tabActive : colors.tabInactive;

                        const onPress = () => {
                            const event = navigation.emit({
                                type: "tabPress",
                                target: route.key,
                                canPreventDefault: true,
                            });

                            if (isFocused) {
                                useScrollStore.getState().triggerScrollToTop(route.name);
                            }
                            if (!isFocused && !event.defaultPrevented) {
                                navigation.navigate(route.name);
                            }
                        };

                        const onLongPress = () => {
                            navigation.emit({ type: "tabLongPress", target: route.key });
                        };

                        return (
                            <AnimatedTabButton
                                key={route.key}
                                route={route}
                                isFocused={isFocused}
                                tabConfig={tabConfig}
                                color={color}
                                onPress={onPress}
                                onLongPress={onLongPress}
                                descriptors={descriptors}
                                colors={colors}
                                onLayout={(x, width) => {
                                    tabLayouts.current[index] = { x, width };
                                    // Immediately snap pill if this tab just became active
                                    if (isFocused) animatePill(index);
                                }}
                            />
                        );
                    })}
                </View>
            </SquircleView>
        </SquircleView>
    );
};

const styles = StyleSheet.create({
    tabBarContainer: {
        height: 67,
        position: "absolute",
        marginHorizontal: 16,
        borderRadius: 999,
        borderTopWidth: 0,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 8,
        bottom: 0,
        left: 0,
        right: 0,
        overflow: "hidden",
    },
    blurContainer: {
        flex: 1,
        borderRadius: 999,
        overflow: "hidden",
    },
    tabBarContent: {
        flex: 1,
        flexDirection: "row",
        paddingHorizontal: 5,
        paddingVertical: 5,
    },
    tabBarItem: {
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 999,
        paddingVertical: 4,
    },
    tabBarLabel: {
        fontSize: 13,
    },
});
