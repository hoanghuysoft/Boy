import Ionicons from "@react-native-vector-icons/ionicons/static";
import { MapPoint } from "@solar-icons/react-native/Bold";
import React, { memo } from "react";
import { TextInput, TouchableOpacity, View } from "react-native";
import { ThemeColors } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
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
    const { t } = useTranslation();

    if (!visible) return null;

    return (
        <View
            style={[
                createStyles.locationSection,
                { backgroundColor: colors.card, borderColor: colors.divider },
            ]}
        >
            <MapPoint size={24} color={COLORS.primary} />
            <TextInput
                style={[common.body, createStyles.locationInput, { color: colors.text }]}
                placeholder={t('create.form.locationPlaceholder')}
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
