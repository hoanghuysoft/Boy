import FontAwesome from "@react-native-vector-icons/fontawesome/static";
import React, { memo } from "react";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import { ThemeColors } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
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
}: CreateScreenHeaderProps) => {
    const { t } = useTranslation();
    
    return (
    <View
        style={[
            createStyles.header,
            {
                backgroundColor: colors.background,
                paddingTop: topPadding,
            },
        ]}
    >
        <View style={{ flex: 1, flexShrink: 1, marginRight: 12 }}>
            <FlexText style={[common.heading, { fontSize: 28 }]} numberOfLines={1}>
                {t('create.header.title')}
            </FlexText>
            <FlexText style={[common.bodySmall, { color: colors.muted, marginTop: 2 }]} numberOfLines={1}>
                {t('create.header.subtitle')}
            </FlexText>
        </View>

        <TouchableOpacity
            style={[
                createStyles.submitButton,
                {
                    backgroundColor: canSubmit ? COLORS.primary : colors.divider,
                    flexShrink: 0,
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
                    <FlexText
                        style={createStyles.submitButtonText}
                        numberOfLines={1}
                    >
                        {t('create.action.post')}
                    </FlexText>
                </>
            )}
        </TouchableOpacity>
    </View>
);});

CreateScreenHeader.displayName = "CreateScreenHeader";
