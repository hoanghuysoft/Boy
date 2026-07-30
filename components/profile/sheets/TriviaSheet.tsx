import { FlexText } from "@/components/FlexText";
import { ModalBottomSheet } from "@swmansion/react-native-bottom-sheet";
import React, { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from "../../../context/ThemeContext";
import { createCommonStyles } from "../../../styles/common";
import { ProfileDetail } from "../../../types/profiledetail";
import { useSheetBackHandler } from "./useSheetBackHandler";

interface TriviaSheetProps {
    profile?: ProfileDetail | null;
    trivia?: string | null;
}

export interface TriviaSheetHandle {
    present: () => void;
    dismiss: () => void;
}

export const TriviaSheet = memo(forwardRef<TriviaSheetHandle, TriviaSheetProps>(({ profile, trivia: propTrivia }, ref) => {
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const { t } = useTranslation();
    const inset = useSafeAreaInsets();

    const [index, setIndex] = useState(0);
    const wasOpenRef = useRef(false);

    const controllerRef = useRef<TriviaSheetHandle>({
        present: () => {
            wasOpenRef.current = true;
            setIndex(1);
        },
        dismiss: () => {
            setIndex(0);
        }
    });

    useImperativeHandle(ref, () => ({
        present: () => controllerRef.current.present(),
        dismiss: () => controllerRef.current.dismiss(),
    }), []);

    const { onDidPresent, onDidDismiss } = useSheetBackHandler(controllerRef as any);

    useEffect(() => {
        if (index > 0) {
            onDidPresent();
        } else {
            onDidDismiss();
        }
    }, [index, onDidPresent, onDidDismiss]);

    const handleIndexChange = useCallback((newIndex: number) => {
        if (newIndex > 0) {
            wasOpenRef.current = true;
        }
        setIndex(newIndex);
    }, []);

    const handleSettle = useCallback((settledIndex: number) => {
        if (settledIndex === 0 && wasOpenRef.current) {
            wasOpenRef.current = false;
        }
    }, []);

    const triviaText = profile?.trivia;

    return (
        <ModalBottomSheet
            index={index}
            onIndexChange={handleIndexChange}
            onSettle={handleSettle}
            detents={[0, 'content']}
            scrimColor={colors.scrim}
            scrimOpacities={[0, 0.5, 1]}
            extendUnderStatusBar
            surface={
                <View
                    style={[
                        StyleSheet.absoluteFill,
                        {
                            backgroundColor: colors.surfaceContainerLow,
                            borderTopLeftRadius: 32,
                            borderTopRightRadius: 32,
                            overflow: 'hidden',
                        },
                    ]}
                />
            }
        >
            <View style={[styles.grabber, { backgroundColor: colors.onSurfaceVariant, marginTop: inset.top + 12 }]} />
            <ScrollView nestedScrollEnabled style={{ flex: 1, paddingHorizontal: 12, paddingTop: 4 }}>

                {/* Header */}
                <View style={{ marginBottom: 24 }}>
                    <FlexText style={[common.heading, { fontSize: 24 }]}>{t('profile.sheets.trivia.title', 'Trivia')}</FlexText>
                    {profile?.name ? (
                        <FlexText style={[common.bodySmall, { color: colors.onSurfaceVariant, marginTop: 4 }]}>
                            {t('profile.sheets.trivia.subtitleWithName', { name: profile.name, defaultValue: `Trivia & fun facts about ${profile.name}` })}
                        </FlexText>
                    ) : (
                        <FlexText style={[common.bodySmall, { color: colors.onSurfaceVariant, marginTop: 4 }]}>
                            {t('profile.sheets.trivia.subtitleDefault', 'Personal notes & fun facts')}
                        </FlexText>
                    )}
                </View>

                {/* Content */}
                {triviaText && triviaText.trim() ? (
                    <View style={{ marginBottom: 24 }}>
                        <FlexText style={[common.body, { color: colors.text, fontSize: 16, lineHeight: 24 }]}>
                            {triviaText}
                        </FlexText>
                    </View>
                ) : (
                    <FlexText style={[common.bodySmall, { color: colors.muted, textAlign: 'center', marginVertical: 24 }]}>
                        {t('profile.sheets.trivia.noInformation', 'No trivia added yet')}
                    </FlexText>
                )}

                <View style={{ height: inset.bottom + 20 }} />
            </ScrollView>
        </ModalBottomSheet>
    );
}));

TriviaSheet.displayName = 'TriviaSheet';

const styles = StyleSheet.create({
    grabber: {
        alignSelf: 'center',
        width: 40,
        height: 5,
        borderRadius: 2.5,
    },
});
