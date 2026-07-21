import { FlexText } from "@/components/FlexText";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import React, { forwardRef, memo } from "react";
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from "../../../context/ThemeContext";
import { createCommonStyles } from "../../../styles/common";
import { useSheetBackHandler } from "./useSheetBackHandler";

interface BioSheetProps {
    bio?: string | null;
}

export const BioSheet = memo(forwardRef<TrueSheet, BioSheetProps>(({ bio }, ref) => {
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const { t } = useTranslation();
    const inset = useSafeAreaInsets();
    const backHandler = useSheetBackHandler(ref);

    if (!bio) return null;

    return (
        <TrueSheet
            ref={ref}
            scrollable={true}
            backgroundColor={theme === 'dark' ? colors.containerContent : '#ffffff'}
            grabberOptions={{
                color: colors.muted || "#C4C4C4",
                height: 5,
                width: 40,
            }}
            cornerRadius={32}
            detents={[0.5, 0.9]}
            onDidPresent={backHandler.onDidPresent}
            onDidDismiss={backHandler.onDidDismiss}
        >
            <ScrollView
                nestedScrollEnabled
                contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 + inset.bottom }}
                showsVerticalScrollIndicator={false}
            >
                <View style={{ marginBottom: 16 }}>
                    <FlexText style={[common.heading, { fontSize: 22 }]}>
                        {t('profile.sheets.bio.title', 'Bio')}
                    </FlexText>
                </View>
                <FlexText style={[common.body, { color: colors.text, fontSize: 16, lineHeight: 24 }]}>
                    {bio}
                </FlexText>
            </ScrollView>
        </TrueSheet>
    );
}));

BioSheet.displayName = 'BioSheet';
