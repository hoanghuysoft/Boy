import { FlexText } from "@/components/FlexText";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import React, { forwardRef, memo } from "react";
import { FlatList, Image, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from "../../../context/ThemeContext";
import { createCommonStyles } from "../../../styles/common";
import { getFamilyAvatarSource } from "../../../utils/familyAvatar";
import { useSheetBackHandler } from "./useSheetBackHandler";

interface LovedOne {
    name: string;
    label: string;
}

interface RelationshipSheetProps {
    data: LovedOne[];
}

const RelationshipItem = memo(({ item, colors, common }: { item: LovedOne; colors: any; common: any }) => {
    const avatarSource = getFamilyAvatarSource(item.label);

    return (
        <View style={styles.card}>
            <View style={[styles.avatarContainer, { backgroundColor: (colors.primary || colors.text) + '15' }]}>
                <Image source={avatarSource} style={styles.avatar} resizeMode="cover" />
            </View>

            <View style={styles.textContainer}>
                <FlexText style={[common.heading, { fontSize: 16 }]} numberOfLines={1}>
                    {item.name}
                </FlexText>
                <FlexText style={[common.bodySmall, { color: colors.muted, marginTop: 2 }]}>
                    {item.label}
                </FlexText>
            </View>
        </View>
    );
});

export const RelationshipSheet = memo(forwardRef<TrueSheet, RelationshipSheetProps>(({ data }, ref) => {
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const inset = useSafeAreaInsets();
    const backHandler = useSheetBackHandler(ref);

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
            onDidPresent={backHandler.onDidPresent}
            onDidDismiss={backHandler.onDidDismiss}
        >
            <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 24 }}>

                {/* Header */}
                <View style={{ marginBottom: 24 }}>
                    <FlexText style={[common.heading, { fontSize: 24 }]}>Family & Relationships</FlexText>
                    <FlexText style={[common.bodySmall, { color: colors.muted, marginTop: 4 }]}>
                        {data.length} family member{data.length > 1 ? 's' : ''}
                    </FlexText>
                </View>

                {/* List */}
                <FlatList
                    nestedScrollEnabled
                    data={data}
                    keyExtractor={(item, index) => `${item.name}-${index}`}
                    renderItem={({ item }) => (
                        <RelationshipItem item={item} colors={colors} common={common} />
                    )}
                    contentContainerStyle={{ paddingBottom: 20 + inset.bottom }}
                />
            </View>
        </TrueSheet>
    );
}));

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        marginBottom: 12,
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 999,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatar: {
        width: 48,
        height: 48,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
});
