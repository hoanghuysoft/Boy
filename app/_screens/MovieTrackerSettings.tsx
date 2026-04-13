import { FlexText } from "@/components/FlexText";
import { ThemeColors, useThemeContext } from "@/context/ThemeContext";
import { TrackerSource, useMovieTrackerStore } from "@/stores/movieTracker";
import { createCommonStyles } from "@/styles/common";
import { Ionicons } from "@expo/vector-icons";
import { CheckCircleBold } from '@solar-icons/react-native';
import { router } from "expo-router";
import { SquircleView } from "expo-squircle-view";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Option definitions ───────────────────────────────────────────────────────

type ServiceOption = {
    value: TrackerSource;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    labelKey: 'showsOption' | 'moviedbOption';
    descKey: 'showsDesc' | 'moviedbDesc';
};

const SERVICE_OPTIONS: ServiceOption[] = [
    {
        value: 'shows',
        icon: 'server-outline',
        labelKey: 'showsOption',
        descKey: 'showsDesc',
    },
    {
        value: 'moviedb',
        icon: 'film-outline',
        labelKey: 'moviedbOption',
        descKey: 'moviedbDesc',
    },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

const MovieTrackerSettingsScreen = () => {
    const { colors, typography } = useThemeContext();
    const common = useMemo(() => createCommonStyles(colors, typography), [colors, typography]);
    const styles = useMemo(() => style(colors, common), [colors, common]);
    const inset = useSafeAreaInsets();
    const { t } = useTranslation();

    const { trackerSource, setTrackerSource } = useMovieTrackerStore();

    // Defer heavy rendering until after the push animation
    const [isReady, setIsReady] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setIsReady(true), 300);
        return () => clearTimeout(timer);
    }, []);

    if (!isReady) {
        return <View style={{ flex: 1, backgroundColor: colors.background }} />;
    }

    return (
        <ScrollView style={[common.screenPadding, { backgroundColor: colors.background }]}>
            <View style={{ position: 'absolute', top: inset.top, zIndex: 1000 }}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{
                        backgroundColor: colors.containerContent,
                        borderRadius: 999,
                        width: 40,
                        height: 40,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>
            <View style={{ marginTop: inset.top + 50 }} />

            <FlexText style={styles.title}>{t('serviceSettings.title')}</FlexText>
            <FlexText style={[common.bodySmall, { color: colors.muted, marginBottom: 16 }]}>
                {t('serviceSettings.subtitle')}
            </FlexText>

            <View style={styles.card}>
                {SERVICE_OPTIONS.map((option, index) => {
                    const active = trackerSource === option.value;
                    return (
                        <View key={option.value}>
                            {index > 0 && <View style={styles.divider} />}
                            <TouchableOpacity
                                style={styles.option}
                                onPress={() => setTrackerSource(option.value)}
                            >
                                <View style={styles.optionLeft}>
                                    <SquircleView
                                        cornerSmoothing={100}
                                        preserveSmoothing
                                        style={[
                                            styles.iconContainer,
                                            active && styles.iconContainerActive,
                                        ]}
                                    >
                                        <Ionicons
                                            name={option.icon}
                                            size={22}
                                            color={active ? '#fff' : colors.text}
                                        />
                                    </SquircleView>
                                    <View style={styles.optionText}>
                                        <FlexText style={common.body}>
                                            {t(`serviceSettings.${option.labelKey}`)}
                                        </FlexText>
                                        <FlexText style={[common.bodySmall, { color: colors.muted }]}>
                                            {t(`serviceSettings.${option.descKey}`)}
                                        </FlexText>
                                    </View>
                                </View>
                                {active && <CheckCircleBold size={24} color="#54d340" />}
                            </TouchableOpacity>
                        </View>
                    );
                })}
            </View>
        </ScrollView>
    );
};

const style = (colors: ThemeColors, common: any) =>
    StyleSheet.create({
        card: {
            backgroundColor: colors.containerContent,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
        },
        title: {
            ...common.title,
            marginBottom: 4,
        },
        option: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 8,
        },
        optionLeft: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
        },
        optionText: {
            marginLeft: 12,
            flex: 1,
        },
        iconContainer: {
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: colors.card,
            justifyContent: 'center',
            alignItems: 'center',
        },
        iconContainerActive: {
            backgroundColor: '#54d340',
        },
        divider: {
            height: 1,
            backgroundColor: colors.divider,
            marginVertical: 8,
        },
    });

export default MovieTrackerSettingsScreen;
