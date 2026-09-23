import { FlexText } from "@/components/FlexText";
import { useReanimatedTrueSheet } from "@lodev09/react-native-true-sheet/reanimated";
import { MaterialTopTabBarProps } from "expo-router/build/react-navigation/material-top-tabs";
import React from "react";
import { StyleSheet, TouchableOpacity, View, useWindowDimensions } from "react-native";
import Reanimated, { useAnimatedStyle } from "react-native-reanimated";

interface ShotsTopTabBarProps extends MaterialTopTabBarProps {
    insets: any;
    t: any;
}

export const ShotsTopTabBar = ({ state, navigation, insets, t }: ShotsTopTabBarProps) => {
    const { height: screenHeight } = useWindowDimensions();
    // Hide the tab bar when comment sheet is open
    const { animatedPosition } = useReanimatedTrueSheet();
    const tabBarStyle = useAnimatedStyle(() => {
        // animatedPosition ≈ SCREEN_HEIGHT when sheet is dismissed, smaller when open
        const isSheetOpen = animatedPosition.value < screenHeight - 10;
        return {
            opacity: isSheetOpen ? 0 : 1,
            pointerEvents: isSheetOpen ? 'none' : 'auto',
        };
    });

    return (
        <Reanimated.View style={[styles.topHeader, { paddingTop: insets.top + 16 }, tabBarStyle]}>
            <View style={styles.tabContainer}>
                {state.routes.map((route: any, index: number) => {
                    const isFocused = state.index === index;
                    const title = route.name === 'random' ? t('shots.tabs.following') : t('shots.tabs.thisDay');

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

                    return (
                        <TouchableOpacity
                            key={route.key}
                            style={[styles.headerTab, isFocused ? styles.activeTab : styles.inactiveTab]}
                            onPress={onPress}
                            activeOpacity={0.8}
                        >
                            <FlexText style={[styles.headerTitle, isFocused ? styles.activeTabTitle : styles.inactiveTabTitle]}>
                                {title}
                            </FlexText>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </Reanimated.View>
    );
};

// ─── Styles ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    topHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 8,
        zIndex: 10,
    },
    tabContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        borderRadius: 24,
        padding: 4,
        gap: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    headerTab: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    activeTab: {
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    inactiveTab: {
        backgroundColor: 'transparent',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    activeTabTitle: {
        color: '#000000',
    },
    inactiveTabTitle: {
        color: '#ffffff',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
});
