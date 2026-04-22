import { FlexText } from "@/components/FlexText";
import { useSheetBackHandler } from "@/components/profile/sheets/useSheetBackHandler";
import { useThemeContext } from "@/context/ThemeContext";
import VerifiedIcon from "@/icons/verified";
import { ProfilesResponse, useInfiniteProfiles } from "@/services/userprofile";
import { createCommonStyles } from "@/styles/common";
import { Profile } from "@/types/profile";
import { Ionicons } from "@expo/vector-icons";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { Image } from "expo-image";
import { debounce, flatMap } from "lodash";
import React, { forwardRef, memo, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import TurboImage from "react-native-turbo-image";

interface ProfilePickerSheetProps {
    selectedProfileId?: string | null;
    onSelect: (profile: Profile | null) => void;
}

const ProfileRow = memo(
    ({
        item,
        colors,
        common,
        isSelected,
        onPress,
    }: {
        item: Profile;
        colors: any;
        common: any;
        isSelected: boolean;
        onPress: () => void;
    }) => {
        return (
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.8}
                style={styles.row}
            >
                <View style={styles.avatarContainer}>
                    {item.avatar_url ? (
                        <Image
                            source={{ uri: item.avatar_url }}
                            style={styles.avatar}
                            contentFit="cover"
                        />
                    ) : (
                        <TurboImage
                            source={
                                item.gender === "male"
                                    ? require("../../../assets/images/AV17.png")
                                    : require("../../../assets/images/AV86.png")
                            }
                            style={styles.avatar}
                            resizeMode="cover"
                        />
                    )}
                </View>

                <View style={styles.info}>
                    <View style={[common.row, { gap: 4 }]}>
                        <FlexText
                            style={[common.heading, { fontSize: 16 }]}
                            numberOfLines={1}
                        >
                            {item.name}
                        </FlexText>
                        {item.is_verified && (
                            <VerifiedIcon size={14} backgroundColor={colors.verify} />
                        )}
                    </View>
                    {item.username ? (
                        <FlexText
                            style={[common.bodySmall, { color: colors.muted, marginTop: 2 }]}
                            numberOfLines={1}
                        >
                            @{item.username}
                        </FlexText>
                    ) : item.bio ? (
                        <FlexText
                            style={[common.bodySmall, { color: colors.muted, marginTop: 2 }]}
                            numberOfLines={1}
                        >
                            {item.bio}
                        </FlexText>
                    ) : null}
                </View>

                {isSelected && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.verify || colors.text} />
                )}
            </TouchableOpacity>
        );
    },
);

export const ProfilePickerSheet = memo(
    forwardRef<TrueSheet, ProfilePickerSheetProps>(({ selectedProfileId, onSelect }, ref) => {
        const { colors, typography, theme } = useThemeContext();
        const common = createCommonStyles(colors, typography);
        const { t } = useTranslation();
        const backHandler = useSheetBackHandler(ref);

        const [searchQuery, setSearchQuery] = useState("");
        const [debouncedQuery, setDebouncedQuery] = useState("");

        const debouncedHandler = useMemo(
            () => debounce((text: string) => setDebouncedQuery(text), 300),
            [],
        );

        useEffect(() => () => debouncedHandler.cancel(), [debouncedHandler]);

        const handleSearchChange = useCallback(
            (text: string) => {
                setSearchQuery(text);
                debouncedHandler(text);
            },
            [debouncedHandler],
        );

        const {
            data,
            fetchNextPage,
            hasNextPage,
            isFetchingNextPage,
            isLoading,
        } = useInfiniteProfiles(debouncedQuery, true);

        const profiles = useMemo(
            () => flatMap(data?.pages, (page: ProfilesResponse) => page.data),
            [data],
        );

        const handleEndReached = useCallback(() => {
            if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
            }
        }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

        const handleSelect = useCallback(
            (profile: Profile) => {
                onSelect(profile);
                if (ref && typeof ref !== "function") {
                    ref.current?.dismiss();
                }
            },
            [onSelect, ref],
        );

        const renderItem = useCallback(
            ({ item }: { item: Profile }) => (
                <ProfileRow
                    item={item}
                    colors={colors}
                    common={common}
                    isSelected={selectedProfileId === item.id}
                    onPress={() => handleSelect(item)}
                />
            ),
            [colors, common, selectedProfileId, handleSelect],
        );

        const renderEmpty = useCallback(() => {
            if (isLoading) {
                return (
                    <View style={styles.emptyContainer}>
                        <ActivityIndicator size="small" color={colors.text} />
                    </View>
                );
            }
            return (
                <View style={styles.emptyContainer}>
                    <FlexText style={[common.body, { color: colors.muted }]}>
                        {t("gallery.picker.noResults")}
                    </FlexText>
                </View>
            );
        }, [isLoading, colors, common, t]);

        return (
            <TrueSheet
                ref={ref}
                scrollable={true}
                backgroundColor={theme === "dark" ? colors.containerContent : "#ffffff"}
                grabberOptions={{
                    color: colors.muted || "#C4C4C4",
                    height: 5,
                    width: 40,
                }}
                onDidPresent={backHandler.onDidPresent}
                onDidDismiss={backHandler.onDidDismiss}
            >
                <View style={styles.container}>
                    {/* Header */}
                    <View style={{ marginBottom: 16 }}>
                        <FlexText style={[common.heading, { fontSize: 24 }]}>
                            {t("gallery.picker.title")}
                        </FlexText>
                        <FlexText style={[common.bodySmall, { color: colors.muted, marginTop: 4 }]}>
                            {t("gallery.picker.subtitle")}
                        </FlexText>
                    </View>

                    {/* Search */}
                    <View
                        style={[
                            styles.searchBar,
                            {
                                backgroundColor:
                                    theme === "dark"
                                        ? "rgba(255,255,255,0.06)"
                                        : "rgba(0,0,0,0.04)",
                            },
                        ]}
                    >
                        <Ionicons name="search" size={18} color={colors.muted} />
                        <TextInput
                            value={searchQuery}
                            onChangeText={handleSearchChange}
                            placeholder={t("gallery.picker.searchPlaceholder")}
                            placeholderTextColor={colors.muted}
                            style={[styles.searchInput, { color: colors.text }]}
                            returnKeyType="search"
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => handleSearchChange("")}>
                                <Ionicons name="close-circle" size={18} color={colors.muted} />
                            </TouchableOpacity>
                        )}
                    </View>

                    <FlatList
                        nestedScrollEnabled
                        data={profiles}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        onEndReached={handleEndReached}
                        onEndReachedThreshold={0.5}
                        ListEmptyComponent={renderEmpty}
                        ListFooterComponent={
                            isFetchingNextPage ? (
                                <View style={styles.footer}>
                                    <ActivityIndicator size="small" color={colors.text} />
                                </View>
                            ) : null
                        }
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                </View>
            </TrueSheet>
        );
    }),
);

export default ProfilePickerSheet;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 14,
        height: 44,
        borderRadius: 999,
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        padding: 0,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        gap: 12,
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 999,
        overflow: "hidden",
    },
    avatar: {
        width: "100%",
        height: "100%",
    },
    info: {
        flex: 1,
    },
    footer: {
        paddingVertical: 16,
        alignItems: "center",
    },
    emptyContainer: {
        paddingVertical: 40,
        alignItems: "center",
    },
});
