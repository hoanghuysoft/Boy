import { FlexText } from '@/components/FlexText';
import { Ionicons } from '@expo/vector-icons';
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { FlashList } from '@shopify/flash-list';
import dayjs from 'dayjs';
import React, { forwardRef, memo } from "react";
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from "react-native";
import { useThemeContext } from "../../../context/ThemeContext";
import { createCommonStyles } from "../../../styles/common";
import { Workplace } from '../../../types/profileworplace';
import { useSheetBackHandler } from "./useSheetBackHandler";

interface WorkplaceSheetProps {
    data: Workplace[];
    onEndReached?: () => void;
}

// --- Helpers ---
const formatDate = (date: string) => {
    return dayjs(date).format('MMM YYYY');
};

const calculateDuration = (startDate: string, endDate: string | null, t: any) => {
    const start = dayjs(startDate);
    const end = endDate ? dayjs(endDate) : dayjs();

    const totalMonths = end.diff(start, 'month');
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;

    const parts = [];
    if (years > 0) parts.push(t('profile.sheets.work.durationYears', { count: years }));
    if (months > 0) parts.push(t('profile.sheets.work.durationMonths', { count: months }));

    return parts.length > 0 ? parts.join(' ') : t('profile.sheets.work.durationLessThanMonth');
};

// --- Component ---
const WorkplaceItem = memo(({ item, colors, common }: { item: Workplace, colors: any, common: any }) => {
    const { t } = useTranslation();
    const isCurrent = !item.end_date;

    return (
        <View style={[
            styles.card,
            {
                backgroundColor: colors.card,
                borderColor: colors.border || 'transparent'
            }
        ]}>
            {/* Header: Icon + Company + Role */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
                <View style={[styles.iconContainer, { backgroundColor: (colors.primary || colors.text) + '15' }]}>
                    <Ionicons name="briefcase" size={20} color={colors.primary || colors.text} />
                </View>

                <View style={{ flex: 1 }}>
                    <FlexText style={[common.heading, { fontSize: 16 }]}>{item.company_name}</FlexText>
                    <FlexText style={[common.body, { color: colors.text, fontWeight: '600', marginTop: 2 }]}>
                        {item.position}
                    </FlexText>
                </View>
            </View>

            {/* Metadata Row (Dates, Duration, Location) */}
            <View style={[styles.metaContainer, { backgroundColor: colors.background }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Ionicons name="calendar-outline" size={14} color={colors.muted} style={{ marginRight: 6 }} />
                    <FlexText style={[common.bodySmall, { color: colors.muted }]}>
                        {formatDate(item.start_date)} - <Text style={{ color: isCurrent ? (colors.primary) : colors.muted, fontWeight: isCurrent ? '700' : '400' }}>{item.end_date ? formatDate(item.end_date) : t('profile.sheets.work.present')}</Text>
                    </FlexText>

                    <FlexText style={[common.muted, { marginHorizontal: 6 }]}>•</FlexText>
                    <FlexText style={[common.bodySmall, { color: colors.muted }]}>
                        {calculateDuration(item.start_date, item.end_date, t)}
                    </FlexText>
                </View>

                {item.location && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        <Ionicons name="location-outline" size={14} color={colors.muted} style={{ marginRight: 6 }} />
                        <FlexText style={[common.bodySmall, { color: colors.muted }]}>{item.location}</FlexText>
                    </View>
                )}
            </View>

            {/* Description */}
            {item.description && (
                <View style={{ marginTop: 12 }}>
                    <FlexText style={[common.body, { fontSize: 14, lineHeight: 22, opacity: 0.8 }]}>
                        {item.description}
                    </FlexText>
                </View>
            )}
        </View>
    );
});

WorkplaceItem.displayName = 'WorkplaceItem';

export const WorkplaceSheet = memo(forwardRef<TrueSheet, WorkplaceSheetProps>(({ data, onEndReached }, ref) => {
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const { t } = useTranslation();
    const backHandler = useSheetBackHandler(ref);

    // Safety check
    if (!data || data.length === 0) return null;

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
            detents={['auto']}
            onDidPresent={backHandler.onDidPresent}
            onDidDismiss={backHandler.onDidDismiss}
        >
            <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 24 }}>

                {/* Header */}
                <View style={{ marginBottom: 24 }}>
                    <FlexText style={[common.heading, { fontSize: 24 }]}>{t('profile.sheets.work.title')}</FlexText>
                    <FlexText style={[common.bodySmall, { color: colors.muted, marginTop: 4 }]}>
                        {t('profile.sheets.work.subtitle')}
                    </FlexText>
                </View>

                {/* List */}
                <FlashList
                    nestedScrollEnabled
                    onEndReached={onEndReached}
                    onEndReachedThreshold={0.5}
                    data={data}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <WorkplaceItem key={item.id} item={item} colors={colors} common={common} />
                    )}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            </View>
        </TrueSheet>
    );
}));

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 999,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    metaContainer: {
        padding: 16,
        borderRadius: 999,
        marginTop: 4,
    }
});