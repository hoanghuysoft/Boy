import { Ionicons } from "@expo/vector-icons";
import React, { memo } from "react";
import { TextInput, TouchableOpacity, View } from "react-native";
import { ThemeColors } from "../../context/ThemeContext";
import { createStyles } from "./styles";
import { COLORS } from "./types";

// ============================================================================
// LocationInput Component
// ============================================================================

interface LocationInputProps {
    visible: boolean;
    location: string;
    onLocationChange: (location: string) => void;
    onClose: () => void;
    colors: ThemeColors;
    common: any;
}

export const LocationInput = memo(({
    visible,
    location,
    onLocationChange,
    onClose,
    colors,
    common,
}: LocationInputProps) => {
    if (!visible) return null;

    return (
        <View
            style={[
                createStyles.locationSection,
                { backgroundColor: colors.card, borderColor: colors.divider },
            ]}
        >
            <Ionicons name="location-outline" size={18} color={COLORS.primary} />
            <TextInput
                style={[common.body, createStyles.locationInput, { color: colors.text }]}
                placeholder="Add location..."
                placeholderTextColor={colors.muted}
                value={location}
                onChangeText={onLocationChange}
            />
            <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={18} color={colors.muted} />
            </TouchableOpacity>
        </View>
    );
});

LocationInput.displayName = "LocationInput";
