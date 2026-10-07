import SpinButton from "@/components/ui/micro-interactions/spin-button";
import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { ThemeColors } from "../../context/ThemeContext";
import { FlexText } from "../FlexText";
import { createStyles } from "./styles";

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

    const buttonBgColor = canSubmit ? colors.primary : colors.surfaceContainerHigh;
    const buttonTextColor = canSubmit ? colors.onPrimary : colors.onSurfaceVariant;

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
                <FlexText style={[common.bodySmall, { color: colors.onSurfaceVariant, marginTop: 2 }]} numberOfLines={1}>
                    {t('create.header.subtitle')}
                </FlexText>
            </View>

            <SpinButton
                idleText={t('create.action.post')}
                activeText={t('create.action.posting', 'Posting...')}
                controlled
                isActive={isSubmitting}
                disabled={!canSubmit || isSubmitting}
                onPress={onSubmit}
                animationConfig={{
                    spring: {
                        damping: 50,
                        stiffness: 250,
                        mass: 1,
                    },
                }}
                colors={{
                    idle: { background: buttonBgColor, text: buttonTextColor },
                    active: { background: colors.primary, text: colors.onPrimary },
                }}
                spinnerConfig={{
                    color: colors.onPrimary,
                    containerBackground: colors.primary,
                }}
                buttonStyle={{
                    paddingHorizontal: 16,
                }}
            />
        </View>
    );
});

CreateScreenHeader.displayName = "CreateScreenHeader";
