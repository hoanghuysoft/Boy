import VerifiedIcon from "@/icons/verified";
import { GhostSmileBold, GhostSmileOutline, HeartUnlockBold, HeartUnlockOutline } from '@solar-icons/react-native';
import React, { memo } from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemeColors, useThemeContext } from "../../context/ThemeContext";
import { Profile } from "../../types/profile";
import { useTranslation } from "react-i18next";
import { FlexText } from "../FlexText";
import { createStyles } from "./styles";
import { COLORS } from "./types";
import Ionicons from "@react-native-vector-icons/ionicons/static";

// ============================================================================
// PostOptionBadge Component
// ============================================================================

// ============================================================================
// PostOptionBadge Component
// ============================================================================

interface PostOptionBadgeProps {
    icon: string;
    iconActive: string;
    label: string;
    isActive: boolean;
    onPress: () => void;
    colors: ThemeColors;
    common: any;
    activeColor?: string;
}

const PostOptionBadge = memo(({
    icon,
    iconActive,
    label,
    isActive,
    onPress,
    colors,
    common,
    activeColor = COLORS.primary,
}: PostOptionBadgeProps) => (
    <TouchableOpacity
        style={[
            createStyles.optionBadge,
            {
                backgroundColor: isActive ? activeColor + "30" : colors.card,
                borderColor: isActive ? activeColor : colors.divider,
            },
        ]}
        onPress={onPress}
    >
        {isActive ? (
            iconActive === "ghost-smile-bold" ? <GhostSmileBold size={14} color={activeColor} /> : <HeartUnlockBold size={14} color={activeColor} />
        ) : (
            icon === "ghost-smile-outline" ? <GhostSmileOutline size={14} color={colors.muted} /> : <HeartUnlockOutline size={14} color={colors.muted} />
        )}
        <FlexText
            style={[
                common.caption,
                { color: isActive ? activeColor : colors.muted, fontWeight: "500" },
            ]}
        >
            {label}
        </FlexText>
    </TouchableOpacity>
));

PostOptionBadge.displayName = "PostOptionBadge";

// ============================================================================
// CreateProfileHeader Component
// ============================================================================

interface CreateProfileHeaderProps {
    profile: Profile;
    colors: ThemeColors;
    common: any;
    isGhost: boolean;
    isAdult: boolean;
    onToggleGhost?: () => void;
    onToggleAdult?: () => void;
    isAdmin?: boolean;
    onSwitchProfile?: () => void;
}

export const CreateProfileHeader = memo(({
    profile,
    colors,
    common,
    isGhost,
    isAdult,
    onToggleGhost,
    onToggleAdult,
    isAdmin,
    onSwitchProfile,
}: CreateProfileHeaderProps) => {
    const { t } = useTranslation();
    const { theme } = useThemeContext();

    const avatarContent = (
        <View style={profileHeaderStyles.avatarWrapper}>
            <Image
                source={{ uri: profile.avatar_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png" }}
                style={[createStyles.profileAvatar]}
            />
            {isAdmin && (
                <View
                    style={[
                        profileHeaderStyles.swapBadge,
                        { backgroundColor: theme === "dark" ? "#1c1c1e" : "#ffffff" },
                    ]}
                >
                    <Ionicons name="swap-horizontal" size={11} color={colors.text} />
                </View>
            )}
        </View>
    );

    return (
        <View style={createStyles.profileRow}>
            {isAdmin && onSwitchProfile ? (
                <TouchableOpacity onPress={onSwitchProfile} activeOpacity={0.75}>
                    {avatarContent}
                </TouchableOpacity>
            ) : (
                avatarContent
            )}
            <View>
                <View style={[common.row, { gap: 4 }]}>
                    <FlexText style={[common.subheading, { color: colors.text }]} numberOfLines={1}>
                        {profile.name}
                    </FlexText>
                    {profile.is_verified && <VerifiedIcon size={14} backgroundColor={colors.verify} />}
                </View>
                {(onToggleGhost || onToggleAdult) && (
                    <View style={createStyles.postOptionsRow}>
                        {onToggleGhost && (
                            <PostOptionBadge
                                icon="ghost-smile-outline"
                                iconActive="ghost-smile-bold"
                                label={t('create.form.ghost')}
                                isActive={isGhost}
                                onPress={onToggleGhost}
                                colors={colors}
                                common={common}
                                activeColor={COLORS.primary}
                            />
                        )}
                        {onToggleAdult && (
                            <PostOptionBadge
                                icon="heart-unlock-outline"
                                iconActive="heart-unlock"
                                label={t('create.form.sensitive')}
                                isActive={isAdult}
                                onPress={onToggleAdult}
                                colors={colors}
                                common={common}
                                activeColor={COLORS.error}
                            />
                        )}
                    </View>
                )}
            </View>
        </View>
    );
});

CreateProfileHeader.displayName = "CreateProfileHeader";

const profileHeaderStyles = StyleSheet.create({
    avatarWrapper: {
        position: "relative",
        overflow: "visible",
    },
    swapBadge: {
        position: "absolute",
        bottom: -2,
        right: -2,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: "center",
        alignItems: "center",
        elevation: 2,
    },
});
