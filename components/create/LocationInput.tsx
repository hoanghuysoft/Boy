import Ionicons from "@react-native-vector-icons/ionicons/static";
import { MapPoint } from "@solar-icons/react-native/Bold";
import React, { memo } from "react";
import { TextInput, TouchableOpacity, View } from "react-native";
import { ThemeColors } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { createStyles } from "./styles";

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
                { backgroundColor: colors.tertiaryContainer },
            ]}
        >
            <MapPoint size={24} color={colors.onTertiaryContainer} />
            <TextInput
                style={[common.body, createStyles.locationInput, { color: colors.onTertiaryContainer }]}
                placeholder={t('create.form.locationPlaceholder')}
                placeholderTextColor={colors.onTertiaryContainer}
                value={location}
                onChangeText={onLocationChange}
            />
            <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={18} color={colors.onTertiaryContainer} />
            </TouchableOpacity>
        </View>
    );
});

LocationInput.displayName = "LocationInput";
