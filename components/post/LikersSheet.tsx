import { TrueSheet } from "@lodev09/react-native-true-sheet";
import React, { forwardRef, memo, useCallback } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TurboImage from "react-native-turbo-image";
import VerifiedIcon from "../../icons/verified";
import { LikeUser } from "../../types/like";
import { useLikersSheetViewModel } from "../../viewmodels/LikersSheetViewModel";

// ============================================================================
// Types
// ============================================================================

interface LikersSheetProps {
    postId: string | null;
}

interface LikerItemProps {
    user: LikeUser;
    colors: any;
    common: any;
    onPress: () => void;
}

// ============================================================================
// LikerItem Component
// ============================================================================

const LikerItem = memo(({ user, colors, common, onPress }: LikerItemProps) => (
    <TouchableOpacity
        style={styles.likerItem}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <TurboImage
            source={{ uri: user.profile_avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png" }}
            style={[styles.avatar, { backgroundColor: colors.divider }]}
            cachePolicy="dataCache"
            fadeDuration={100}
        />
        <View style={styles.userInfo}>
            <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                <Text style={[common.heading, { fontSize: 16 }]} numberOfLines={1}>
                    {user.profile_name}
                </Text>
                {user.profile_is_verified && (
                    <VerifiedIcon size={14} backgroundColor={colors.verify} />
                )}
            </View>
        </View>
    </TouchableOpacity>
));

LikerItem.displayName = "LikerItem";

// ============================================================================
// LikersSheet Component
// ============================================================================

export const LikersSheet = memo(forwardRef<TrueSheet, LikersSheetProps>(
    ({ postId }, ref) => {
        const insets = useSafeAreaInsets();
        const vm = useLikersSheetViewModel(postId, ref as React.RefObject<TrueSheet | null>);

        const renderItem = useCallback(({ item }: { item: LikeUser }) => (
            <LikerItem
                user={item}
                colors={vm.colors}
                common={vm.common}
                onPress={() => vm.handleUserPress(item)}
            />
        ), [vm.colors, vm.common, vm.handleUserPress]);

        const renderFooter = useCallback(() => {
            if (vm.isFetchingNextPage) {
                return (
                    <View style={styles.footerLoader}>
                        <ActivityIndicator size="small" color={vm.colors.text} />
                    </View>
                );
            }
            return null;
        }, [vm.isFetchingNextPage, vm.colors.text]);

        const renderEmpty = useCallback(() => {
            if (vm.isLoading) {
                return (
                    <View style={styles.emptyState}>
                        <ActivityIndicator size="small" color={vm.colors.text} />
                    </View>
                );
            }
            return (
                <View style={styles.emptyState}>
                    <Text style={[vm.common.body, { color: vm.colors.muted, textAlign: 'center' }]}>
                        No likes yet
                    </Text>
                    <Text style={[vm.common.bodySmall, { color: vm.colors.muted, textAlign: 'center', marginTop: 4 }]}>
                        Be the first to like this post!
                    </Text>
                </View>
            );
        }, [vm.isLoading, vm.colors, vm.common]);

        return (
            <TrueSheet
                ref={ref}
                scrollable
                backgroundColor={vm.theme === "dark" ? vm.colors.containerContent : "#ffffff"}
                grabberOptions={{
                    color: vm.colors.muted || "#C4C4C4",
                    height: 4,
                    width: 32,
                }}
                detents={['auto']}
            >
                <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[vm.common.heading]}>Likes</Text>
                        <Text style={vm.common.bodySmall}>
                            {vm.totalLikes > 0
                                ? `${vm.totalLikes} ${vm.totalLikes === 1 ? 'person' : 'people'} liked this post`
                                : 'No likes yet'}
                        </Text>
                    </View>

                    {/* Likers List */}
                    <FlatList
                        nestedScrollEnabled
                        data={vm.likers}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        onEndReached={vm.handleEndReached}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={renderFooter}
                        ListEmptyComponent={renderEmpty}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                </View>
            </TrueSheet>
        );
    }
));

LikersSheet.displayName = "LikersSheet";

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    header: {
        marginBottom: 20,
        paddingTop: 10,
    },
    likerItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        gap: 16,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    userInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    footerLoader: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    emptyState: {
        paddingVertical: 32,
        alignItems: 'center',
    },
});
