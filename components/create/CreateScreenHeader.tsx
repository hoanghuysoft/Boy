import { FontAwesome } from "@expo/vector-icons";
import React, { memo } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { ThemeColors } from "../../context/ThemeContext";
import { createStyles } from "./styles";
import { COLORS } from "./types";

// ============================================================================
// CreateScreenHeader Component
// ============================================================================

interface CreateScreenHeaderProps {
    colors: ThemeColors;
    common: any;
    topPadding: number;
    canSubmit: boolean;
    isSubmitting: boolean;
    onSubmit: () => void;
}

export const CreateScreenHeader = memo(({
    colors,
    common,
    topPadding,
    canSubmit,
    isSubmitting,
    onSubmit,
}: CreateScreenHeaderProps) => (
    <View
        style={[
            createStyles.header,
            {
                backgroundColor: colors.background,
                paddingTop: topPadding,
            },
        ]}
    >
        <Text style={[common.headline, { color: colors.text }]}>Create Post</Text>
        <TouchableOpacity
            style={[
                createStyles.submitButton,
                {
                    backgroundColor: canSubmit ? COLORS.primary : colors.divider,
                },
            ]}
            onPress={onSubmit}
            disabled={!canSubmit}
        >
            {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
            ) : (
                <>
                    <FontAwesome name="send" size={16} color="#fff" />
                    <Text style={createStyles.submitButtonText}>Post</Text>
                </>
            )}
        </TouchableOpacity>
    </View>
));

CreateScreenHeader.displayName = "CreateScreenHeader";
