import {
    Home2Outlined,
    Home2Solid,
    PlusOutlined,
    PlusSolid,
    Search1Outlined,
    Search1Solid,
    User4Outlined,
    User4Solid
} from "@lineiconshq/free-icons";
import { Lineicons } from "@lineiconshq/react-native-lineicons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeContext } from "../../context/ThemeContext";
import { useScrollStore } from "../../stores/scroll";

type TabName = "index" | "search" | "chat" | "profile";

interface TabConfig {
    name: TabName;
    label: string;
    iconOutlined: any;
    iconSolid: any;
}

const tabs: TabConfig[] = [
    {
        name: "index",
        label: "Home",
        iconOutlined: Home2Outlined,
        iconSolid: Home2Solid,
    },
    {
        name: "search",
        label: "Search",
        iconOutlined: Search1Outlined,
        iconSolid: Search1Solid,
    },
    {
        name: "chat",
        label: "Create",
        iconOutlined: PlusOutlined,
        iconSolid: PlusSolid,
    },
    {
        name: "profile",
        label: "Profile",
        iconOutlined: User4Outlined,
        iconSolid: User4Solid,
    },
];

const AnimatedTabButton = ({
    route,
    isFocused,
    tabConfig,
    color,
    onPress,
    onLongPress,
    descriptors,
    colors,
}: {
    route: any;
    isFocused: boolean;
    tabConfig: TabConfig;
    color: string;
    onPress: () => void;
    onLongPress: () => void;
    descriptors: any;
    colors: any;
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
        Animated.spring(iconScaleAnim, {
            toValue: 0.85,
            useNativeDriver: true,
            friction: 5,
            tension: 100,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(iconScaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            friction: 5,
            tension: 100,
        }).start();
    };

    return (
        <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={descriptors[route.key].options.tabBarAccessibilityLabel}
            style={[
                styles.tabBarItem,
                isFocused && {
                    backgroundColor: colors.card + "CC",
                },
            ]}
            onPress={() => {
                handlePressOut();
                onPress();
            }}
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
                <Lineicons
                    icon={isFocused ? tabConfig.iconSolid : tabConfig.iconOutlined}
                    size={24}
                    color={color}
                    strokeWidth={5}
                />
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

export const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
    const { colors, theme } = useThemeContext();
    const insets = useSafeAreaInsets();
    const bottomSpacing = 13 + insets.bottom;

    return (
        <View
            style={[
                styles.tabBarContainer,
                {
                    marginBottom: bottomSpacing,
                },
            ]}
        >
            <View style={styles.blurContainer}>
                <View style={[styles.tabBarContent, { backgroundColor: colors.tabBar + "E6" }]}>
                    {state.routes.map((route, index) => {
                        const isFocused = state.index === index;
                        // Map route names to tab config
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
                            navigation.emit({
                                type: "tabLongPress",
                                target: route.key,
                            });
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
                            />
                        );
                    })}
                </View>
            </View>
        </View>
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
        shadowOffset: {
            width: 0,
            height: 10,
        },
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
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 999,
        gap: 2,
    },
    tabBarLabel: {
        fontSize: 12,
        marginTop: 2,
    },
});
