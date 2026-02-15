import VerifiedIcon from "@/icons/verified";
import { GhostSmileBold, GhostSmileOutline, HeartUnlockBold, HeartUnlockOutline } from '@solar-icons/react-native';
import React, { memo } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { ThemeColors } from "../../context/ThemeContext";
import { Profile } from "../../types/profile";
import { createStyles } from "./styles";
import { COLORS } from "./types";

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
        <Text
            style={[
                common.caption,
                { color: isActive ? activeColor : colors.muted, fontWeight: "500" },
            ]}
        >
            {label}
        </Text>
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
    onToggleGhost: () => void;
    onToggleAdult: () => void;
}

export const CreateProfileHeader = memo(({
    profile,
    colors,
    common,
    isGhost,
    isAdult,
    onToggleGhost,
    onToggleAdult,
}: CreateProfileHeaderProps) => (
    <View style={createStyles.profileRow}>
        <Image
            source={{ uri: profile.avatar_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png" }}
            style={[createStyles.profileAvatar]}
        />
        <View>
            <View style={[common.row, { gap: 4 }]}>
                <Text style={[common.subheading, { color: colors.text }]} numberOfLines={1}>
                    {profile.name}
                </Text>
                {profile.is_verified && <VerifiedIcon size={14} backgroundColor={colors.verify} />}
            </View>
            <View style={createStyles.postOptionsRow}>
                <PostOptionBadge
                    icon="ghost-smile-outline"
                    iconActive="ghost-smile-bold"
                    label="Ghost"
                    isActive={isGhost}
                    onPress={onToggleGhost}
                    colors={colors}
                    common={common}
                    activeColor={COLORS.primary}
                />
                <PostOptionBadge
                    icon="heart-unlock-outline"
                    iconActive="heart-unlock"
                    label="Sensitive"
                    isActive={isAdult}
                    onPress={onToggleAdult}
                    colors={colors}
                    common={common}
                    activeColor={COLORS.error}
                />
            </View>
        </View>
    </View>
));

CreateProfileHeader.displayName = "CreateProfileHeader";
