import { FlexText } from "@/components/FlexText";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import React, { forwardRef, memo, useImperativeHandle, useRef } from "react";
import { useTranslation } from 'react-i18next';
import { ScrollView, type ScrollViewInstance, View } from "react-native";
import { useThemeContext } from "../../../context/ThemeContext";
import { createCommonStyles } from "../../../styles/common";

interface BioSheetProps {
    bio?: string | null;
}

export const BioSheet = memo(forwardRef<TrueSheet, BioSheetProps>(({ bio }, ref) => {
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const { t } = useTranslation();
    const sheetRef = useRef<TrueSheet>(null);
    const scrollRef = useRef<ScrollViewInstance>(null);

    useImperativeHandle(ref, () => ({
        present: (index?: number, animated?: boolean) => {
            return sheetRef.current?.present(index, animated) || Promise.resolve();
        },
        dismiss: (animated?: boolean) => {
            return sheetRef.current?.dismiss(animated) || Promise.resolve();
        },
        resize: (index: number) => {
            return sheetRef.current?.resize(index) || Promise.resolve();
        },
        dismissStack: (animated?: boolean) => {
            return sheetRef.current?.dismissStack(animated) || Promise.resolve();
        },
    } as any), []);

    if (!bio) return null;

    return (
        <TrueSheet
            ref={sheetRef}
            scrollableRef={scrollRef}
            style={{ flex: 1 }}
            backgroundColor={theme === 'dark' ? colors.containerContent : '#ffffff'}
            grabberOptions={{
                color: colors.muted || "#C4C4C4",
                height: 5,
                width: 40,
            }}
            cornerRadius={32}
            detents={[0.5, 0.9]}
        >
            <ScrollView
                ref={scrollRef}
                contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 }}
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
