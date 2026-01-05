import { Ionicons } from '@expo/vector-icons';
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import dayjs from 'dayjs';
import React, { forwardRef, memo } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from "../../../context/ThemeContext";
import { createCommonStyles } from "../../../styles/common";
import { Workplace } from '../../../types/profileworplace';

interface WorkplaceSheetProps {
    data: Workplace[];
}

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

const WorkplaceItem = memo(({ item, colors, common }: { item: Workplace, colors: any, common: any }) => (
    <View style={{ marginBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.background,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12
            }}>
                <Ionicons name="briefcase" size={20} color={colors.text} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={common.heading}>{item.company_name}</Text>
                <Text style={common.bodySmall}>{item.position}</Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                    <Text style={[common.muted, { fontSize: 12 }]}>
                        {formatDate(item.start_date)} - {item.end_date ? formatDate(item.end_date) : 'Present'}
                    </Text>

                    <Text style={[common.muted, { marginHorizontal: 6 }]}>•</Text>
                    <Text style={[common.muted, { fontSize: 12 }]}>
                        {calculateDuration(item.start_date, item.end_date)}
                    </Text>

                    {item.location && (
                        <>
                            <Text style={[common.muted, { marginHorizontal: 6 }]}>•</Text>
                            <Text style={[common.muted, { fontSize: 12 }]}>{item.location}</Text>
                        </>
                    )}
                </View>

                {item.description && (
                    <Text style={[common.bodySmall, { marginTop: 8, opacity: 0.8 }]}>
                        {item.description}
                    </Text>
                )}
            </View>
        </View>
    </View>
));

export const WorkplaceSheet = memo(forwardRef<TrueSheet, WorkplaceSheetProps>(({ data }, ref) => {
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const inset = useSafeAreaInsets();

    return (
        <TrueSheet
            ref={ref}
            scrollable
            cornerRadius={24}
            backgroundColor={theme === 'dark' ? colors.containerContent : 'white'}
            grabberOptions={{
                color: colors.text
            }}
        >
            <ScrollView nestedScrollEnabled style={{ flex: 1, padding: 24, paddingBottom: inset.bottom + 20 }}>
                <Text style={[common.heading, { marginBottom: 20 }]}>Workplaces</Text>
                {data.map((item) => (
                    <WorkplaceItem key={item.id} item={item} colors={colors} common={common} />
                ))}
            </ScrollView>
        </TrueSheet>
    );
}));
