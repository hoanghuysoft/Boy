import { Ionicons } from '@expo/vector-icons';
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import React, { forwardRef, memo } from "react";
import { FlatList, Text, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from "../../../context/ThemeContext";
import { createCommonStyles } from "../../../styles/common";
import { ProfileAddress } from "../../../types/profileaddress";

interface AddressSheetProps {
    data: ProfileAddress[];
}

const AddressItem = memo(({ item, colors, common }: { item: ProfileAddress, colors: any, common: any }) => (
    <View style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="location" size={20} color={colors.text} />
            <Text style={[common.heading, { marginLeft: 8 }]}>{item.city}, {item.country}</Text>
        </View>
        <Text style={[common.body, { marginTop: 4, marginLeft: 28 }]}>{item.address_line1}</Text>
        {item.address_line2 && <Text style={[common.body, { marginLeft: 28 }]}>{item.address_line2}</Text>}
    </View>
));

export const AddressSheet = memo(forwardRef<TrueSheet, AddressSheetProps>(({ data }, ref) => {
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const inset = useSafeAreaInsets();

    return (
        <TrueSheet
            ref={ref}
            scrollable={true}
            cornerRadius={24}
            backgroundColor={theme === 'dark' ? colors.containerContent : 'white'}
            grabberOptions={{
                color: colors.text
            }}
        >
            <View style={{ flex: 1, padding: 24, paddingBottom: inset.bottom + 20 }}>
                <Text style={[common.heading, { marginBottom: 16 }]}>Addresses</Text>
                <FlatList
                    scrollEnabled={false}
                    data={data}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <AddressItem item={item} colors={colors} common={common} />}
                />
            </View>
        </TrueSheet>
    );
}));
