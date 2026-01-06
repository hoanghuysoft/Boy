import { Ionicons } from '@expo/vector-icons';
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import React, { forwardRef, memo } from "react";
import { FlatList, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from "../../../context/ThemeContext";
import { createCommonStyles } from "../../../styles/common";
import { ProfileAddress } from "../../../types/profileaddress";

interface AddressSheetProps {
    data: ProfileAddress[];
}

const AddressItem = memo(({ item, colors, common }: { item: ProfileAddress, colors: any, common: any }) => {

    const handleOpenMaps = () => {
        // Construct the query string
        const fullAddress = `${item.address_line1} ${item.address_line2 || ''}, ${item.city}, ${item.country}`;
        const encodedAddress = encodeURIComponent(fullAddress);

        // Platform specific map URL
        const url = Platform.select({
            ios: `maps:0,0?q=${encodedAddress}`,
            android: `geo:0,0?q=${encodedAddress}`,
        });

        if (url) {
            Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
        }
    };

    return (
        <TouchableOpacity
            onPress={handleOpenMaps}
            activeOpacity={0.7}
            style={[
                styles.card
            ]}
        >
            {/* Icon Container */}
            <View style={[styles.iconContainer, { backgroundColor: (colors.primary || colors.text) + '15' }]}>
                <Ionicons
                    name="location"
                    size={24}
                    color={colors.primary || colors.text}
                />
            </View>

            {/* Address Details */}
            <View style={styles.textContainer}>
                <Text style={[common.heading, { fontSize: 16 }]} numberOfLines={1}>
                    {item.city}, {item.country}
                </Text>

                <Text style={[common.bodySmall, { color: colors.muted, marginTop: 2 }]}>
                    {item.address_line1}
                </Text>

                {item.address_line2 ? (
                    <Text style={[common.bodySmall, { color: colors.muted }]}>
                        {item.address_line2}
                    </Text>
                ) : null}
            </View>

            {/* Action Icon */}
            <View style={styles.actionIcon}>
                <Ionicons name="navigate-circle-outline" size={28} color={colors.muted} />
            </View>
        </TouchableOpacity>
    );
});

export const AddressSheet = memo(forwardRef<TrueSheet, AddressSheetProps>(({ data }, ref) => {
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
                    <Text style={[common.heading, { fontSize: 24 }]}>Locations</Text>
                    <Text style={[common.bodySmall, { color: colors.muted, marginTop: 4 }]}>
                        Tap an address to open Maps
                    </Text>
                </View>

                {/* List */}
                <FlatList
                    scrollEnabled={false}
                    data={data}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <AddressItem item={item} colors={colors} common={common} />
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