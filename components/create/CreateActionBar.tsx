import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import React, { memo, useEffect, useRef } from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemeColors } from "../../context/ThemeContext";
import { DeezerTrack } from "../../services/deezer";
import { COLORS } from "./types";

// ============================================================================
// ActionButton Component
// ============================================================================

interface ActionButtonProps {
    icon: string;
    isActive: boolean;
    onPress: () => void;
    disabled?: boolean;
    colors: ThemeColors;
    isCommunityIcon?: boolean;
}

const ActionButton = memo(({
    icon,
    isActive,
    onPress,
    disabled = false,
    colors,
    isCommunityIcon = false,
}: ActionButtonProps) => (
    <TouchableOpacity
        style={[
            styles.actionButton,
            {
                backgroundColor: isActive ? COLORS.primary + "20" : "transparent",
            },
        ]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
    >
        {isCommunityIcon ? (
            <MaterialCommunityIcons
                name={icon as any}
                size={24}
                color={isActive ? COLORS.primary : colors.text}
            />
        ) : (
            <MaterialIcons
                name={icon as any}
                size={24}
                color={isActive ? COLORS.primary : colors.text}
            />
        )}
    </TouchableOpacity>
));

ActionButton.displayName = "ActionButton";

// ============================================================================
// CreateActionBar Component
// ============================================================================

interface CreateActionBarProps {
    colors: ThemeColors;
    bottomPadding: number;
    visible?: boolean;
    // Media
    selectedMediaCount: number;
    onPickMedia: () => void;
    // Location
    showLocationInput: boolean;
    hasLocation: boolean;
    onToggleLocation: () => void;
    // Music
    showMusicSearch: boolean;
    selectedTrack: DeezerTrack | null;
    onToggleMusic: () => void;
    // Links
    linksCount: number;
    onAddLink: () => void;
}

export const CreateActionBar = memo(({
    colors,
    bottomPadding,
    visible = true,
    selectedMediaCount,
    onPickMedia,
    showLocationInput,
    hasLocation,
    onToggleLocation,
    showMusicSearch,
    selectedTrack,
    onToggleMusic,
    linksCount,
    onAddLink,
}: CreateActionBarProps) => {
    const translateY = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(translateY, {
                toValue: visible ? 0 : 100,
                useNativeDriver: true,
                tension: 100,
                friction: 12,
            }),
            Animated.timing(opacity, {
                toValue: visible ? 1 : 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();
    }, [visible]);

    return (
        <Animated.View
            style={[
                styles.floatingContainer,
                {
                    bottom: bottomPadding + 16,
                    transform: [{ translateY }],
                    opacity,
                },
            ]}
            pointerEvents={visible ? "auto" : "none"}
        >
            <View
                style={[
                    styles.pillBar,
                    {
                        backgroundColor: colors.containerContent,
                        borderColor: colors.divider,
                    },
                ]}
            >
                <ActionButton
                    icon="image"
                    isActive={selectedMediaCount > 0}
                    onPress={onPickMedia}
                    disabled={selectedMediaCount >= 10}
                    colors={colors}
                />
                <ActionButton
                    icon="location-history"
                    isActive={showLocationInput || hasLocation}
                    onPress={onToggleLocation}
                    colors={colors}
                />
                <ActionButton
                    icon="music-circle"
                    isActive={showMusicSearch || selectedTrack !== null}
                    onPress={onToggleMusic}
                    colors={colors}
                    isCommunityIcon
                />
                <ActionButton
                    icon="link-circle"
                    isActive={linksCount > 0}
                    onPress={onAddLink}
                    isCommunityIcon
                    colors={colors}
                />
            </View>
        </Animated.View>
    );
});

CreateActionBar.displayName = "CreateActionBar";

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
    floatingContainer: {
        position: "absolute",
        left: 0,
        right: 0,
        alignItems: "center",
        zIndex: 100,
    },
    pillBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderRadius: 999,
        gap: 4,
        borderWidth: 0,
    },
    actionButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
    },
});
