import { Ionicons } from '@expo/vector-icons';
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import dayjs from 'dayjs';
import React, { forwardRef, memo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from "../../../context/ThemeContext";
import { createCommonStyles } from "../../../styles/common";
import { Workplace } from '../../../types/profileworplace';

interface WorkplaceSheetProps {
    data: Workplace[];
    onEndReached?: () => void;
}

// --- Helpers ---
const formatDate = (date: string) => {
    return dayjs(date).format('MMM YYYY');
};

const calculateDuration = (startDate: string, endDate: string | null) => {
    const start = dayjs(startDate);
    const end = endDate ? dayjs(endDate) : dayjs();

    const totalMonths = end.diff(start, 'month');
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;

    const parts = [];
    if (years > 0) parts.push(`${years} yr${years > 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} mo${months > 1 ? 's' : ''}`);

    return parts.length > 0 ? parts.join(' ') : 'Less than a month';
};

// --- Component ---
const WorkplaceItem = memo(({ item, colors, common }: { item: Workplace, colors: any, common: any }) => {
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
                    <Text style={[common.heading, { fontSize: 16 }]}>{item.company_name}</Text>
                    <Text style={[common.body, { color: colors.primary, fontWeight: '600', marginTop: 2 }]}>
                        {item.position}
                    </Text>
                </View>
            </View>

            {/* Metadata Row (Dates, Duration, Location) */}
            <View style={[styles.metaContainer, { backgroundColor: colors.background }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Ionicons name="calendar-outline" size={14} color={colors.muted} style={{ marginRight: 6 }} />
                    <Text style={[common.bodySmall, { color: colors.muted }]}>
                        {formatDate(item.start_date)} - <Text style={{ color: isCurrent ? (colors.primary) : colors.muted, fontWeight: isCurrent ? '700' : '400' }}>{item.end_date ? formatDate(item.end_date) : 'Present'}</Text>
                    </Text>

                    <Text style={[common.muted, { marginHorizontal: 6 }]}>•</Text>
                    <Text style={[common.bodySmall, { color: colors.muted }]}>
                        {calculateDuration(item.start_date, item.end_date)}
                    </Text>
                </View>

                {item.location && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        <Ionicons name="location-outline" size={14} color={colors.muted} style={{ marginRight: 6 }} />
                        <Text style={[common.bodySmall, { color: colors.muted }]}>{item.location}</Text>
                    </View>
                )}
            </View>

            {/* Description */}
            {item.description && (
                <View style={{ marginTop: 12 }}>
                    <Text style={[common.body, { fontSize: 14, lineHeight: 22, opacity: 0.8 }]}>
                        {item.description}
                    </Text>
                </View>
            )}
        </View>
    );
});

export const WorkplaceSheet = memo(forwardRef<TrueSheet, WorkplaceSheetProps>(({ data, onEndReached }, ref) => {
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const inset = useSafeAreaInsets();

    // Safety check
    if (!data || data.length === 0) return null;

    return (
        <TrueSheet
            ref={ref}
            scrollable={true}
            backgroundColor={theme === 'dark' ? colors.containerContent : '#ffffff'}
            grabberOptions={{
                color: colors.muted || '#C4C4C4',
                height: 4,
                width: 32,
            }}
        >
            <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 24 }}>

                {/* Header */}
                <View style={{ marginBottom: 24 }}>
                    <Text style={[common.heading, { fontSize: 24 }]}>Work History</Text>
                    <Text style={[common.bodySmall, { color: colors.muted, marginTop: 4 }]}>
                        My professional timeline
                    </Text>
                </View>

                {/* List */}
                <FlatList
                    nestedScrollEnabled
                    onEndReached={onEndReached}
                    onEndReachedThreshold={0.5}
                    data={data}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <WorkplaceItem item={item} colors={colors} common={common} />
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