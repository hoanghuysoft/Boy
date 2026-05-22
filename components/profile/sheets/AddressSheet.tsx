import { FlexText } from '@/components/FlexText';
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { LegendList } from '@legendapp/list';
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import React, { forwardRef, memo } from "react";
import { useTranslation } from 'react-i18next';
import { Linking, Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { useThemeContext } from "../../../context/ThemeContext";
import { createCommonStyles } from "../../../styles/common";
import { ProfileAddress } from "../../../types/profileaddress";
import { useSheetBackHandler } from "./useSheetBackHandler";

interface AddressSheetProps {
    data: ProfileAddress[];
    onEndReached?: () => void;
}

const AddressItem = memo(({ item, colors, common }: { item: ProfileAddress; colors: any; common: any }) => {
    const handleOpenMaps = () => {
        const fullAddress = [item.street, item.city, item.state, item.country].filter(Boolean).join(', ');
        const encodedAddress = encodeURIComponent(fullAddress);

        const url = Platform.select({
            ios: `maps:0,0?q=${encodedAddress}`,
            android: `geo:0,0?q=${encodedAddress}`,
        });

        if (url) {
            Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
        }
    };

    const addressHeader = [item.street, item.city, item.state, item.country].filter(Boolean).join(', ');

    return (
        <TouchableOpacity
            onPress={handleOpenMaps}
            activeOpacity={0.7}
            style={styles.card}
        >
            <View style={[styles.iconContainer, { backgroundColor: (colors.primary || colors.text) + '15' }]}>
                <Ionicons
                    name="location"
                    size={24}
                    color={colors.primary || colors.text}
                />
            </View>

            <View style={styles.textContainer}>
                <FlexText style={[common.heading, { fontSize: 16 }]} numberOfLines={1}>
                    {item.label}
                </FlexText>

                <FlexText style={[common.bodySmall, { color: colors.muted, marginTop: 2 }]}>
                    {addressHeader} {item.postal_code}
                </FlexText>
            </View>

            <View style={styles.actionIcon}>
                <Ionicons name="navigate-circle-outline" size={28} color={colors.muted} />
            </View>
        </TouchableOpacity>
    );
});

AddressItem.displayName = 'AddressItem';

export const AddressSheet = memo(forwardRef<TrueSheet, AddressSheetProps>(({ data, onEndReached }, ref) => {
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
            cornerRadius={32}
            detents={[0.7, 1]}
            onDidPresent={backHandler.onDidPresent}
            onDidDismiss={backHandler.onDidDismiss}
        >
            <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 24 }}>

                {/* Header */}
                <View style={{ marginBottom: 24 }}>
                    <FlexText style={[common.heading, { fontSize: 24 }]}>{t('profile.sheets.address.title')}</FlexText>
                    <FlexText style={[common.bodySmall, { color: colors.muted, marginTop: 4 }]}>
                        {t('profile.sheets.address.subtitle')}
                    </FlexText>
                </View>

                {/* List */}
                <LegendList
                    nestedScrollEnabled
                    onEndReached={onEndReached}
                    onEndReachedThreshold={0.5}
                    recycleItems
                    data={data}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <AddressItem key={item.id} item={item} colors={colors} common={common} />
                    )}
                    contentContainerStyle={{ paddingBottom: 20 }}
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
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 999,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    actionIcon: {
        marginLeft: 12,
    }
});