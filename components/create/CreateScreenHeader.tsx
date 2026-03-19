import { FontAwesome } from "@expo/vector-icons";
import React, { memo } from "react";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import { ThemeColors } from "../../context/ThemeContext";
import { FlexText } from "../FlexText";
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
    subtitle?: string;
}

export const CreateScreenHeader = memo(({
    colors,
    common,
    topPadding,
    canSubmit,
    isSubmitting,
    onSubmit,
    subtitle = "Share something with your followers",
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
        <View>
            <FlexText style={[common.heading, { fontSize: 28 }]}>Create Post</FlexText>
            <FlexText style={[common.bodySmall, { color: colors.muted, marginTop: 2 }]}>
                {subtitle}
            </FlexText>
        </View>
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
                    <FlexText style={createStyles.submitButtonText}>Post</FlexText>
                </>
            )}
        </TouchableOpacity>
    </View>
));

CreateScreenHeader.displayName = "CreateScreenHeader";
