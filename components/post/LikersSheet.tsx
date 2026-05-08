import { BottomSheet } from "heroui-native";
import React, { forwardRef, memo, useCallback, useImperativeHandle, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import { NitroImage } from "react-native-nitro-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import VerifiedIcon from "../../icons/verified";
import { LikeUser } from "../../types/like";
import type { LikersSheetHandle } from "../../types/sheetHandles";
import { useLikersSheetViewModel } from "../../viewmodels/LikersSheetViewModel";
import { FlexText } from "../FlexText";

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
        <View style={styles.avatarContainer}>
            <NitroImage
                image={{ url: user.profile_avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png" }}
                style={[styles.avatar, { backgroundColor: colors.divider }]}
                resizeMode="cover"
            />
        </View>
        <View style={styles.userInfo}>
            <View style={styles.nameRow}>
                <FlexText style={[common.heading, { fontSize: 16 }]} numberOfLines={1}>
                    {user.profile_name}
                </FlexText>
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

export const LikersSheet = memo(forwardRef<LikersSheetHandle, LikersSheetProps>(
    ({ postId }, ref) => {
        const insets = useSafeAreaInsets();
        const vm = useLikersSheetViewModel(postId, ref as React.RefObject<LikersSheetHandle | null>);
        const { t } = useTranslation();
        const [isOpen, setIsOpen] = useState(false);
        const {
            colors,
            common,
            likers,
            totalLikes,
            isLoading,
            isFetchingNextPage,
            handleEndReached,
            handleUserPress,
        } = vm;

        useImperativeHandle(ref, () => ({
            present: () => setIsOpen(true),
            dismiss: () => setIsOpen(false),
        }), []);

        const renderItem = useCallback(({ item }: { item: LikeUser }) => (
            <LikerItem
                user={item}
                colors={colors}
                common={common}
                onPress={() => handleUserPress(item)}
            />
        ), [colors, common, handleUserPress]);

        const renderFooter = useCallback(() => {
            if (isFetchingNextPage) {
                return (
                    <View style={styles.footerLoader}>
                        <ActivityIndicator size="small" color={colors.text} />
                    </View>
                );
            }
            return null;
        }, [isFetchingNextPage, colors.text]);

        const renderEmpty = useCallback(() => {
            if (isLoading) {
                return (
                    <View style={styles.emptyState}>
                        <ActivityIndicator size="small" color={colors.text} />
                    </View>
                );
            }
            return (
                <View style={styles.emptyState}>
                    <FlexText style={[common.body, { color: colors.muted, textAlign: 'center' }]}>
                        {t('post.likersSheet.emptyTitle')}
                    </FlexText>
                    <FlexText style={[common.bodySmall, { color: colors.muted, textAlign: 'center', marginTop: 4 }]}>
                        {t('post.likersSheet.emptyBody')}
                    </FlexText>
                </View>
            );
        }, [isLoading, colors, common, t]);

        const renderHeader = useCallback(() => (
            <View style={styles.header}>
                <FlexText style={[common.heading]}>{t('post.likersSheet.title')}</FlexText>
                <FlexText style={common.bodySmall}>
                    {totalLikes > 0
                        ? t('post.likersSheet.subtitle', { count: totalLikes })
                        : t('post.likersSheet.emptyTitle')}
                </FlexText>
            </View>
        ), [common, t, totalLikes]);

        return (
            <BottomSheet isOpen={isOpen} onOpenChange={setIsOpen}>
                <BottomSheet.Trigger ></BottomSheet.Trigger>
                <BottomSheet.Portal>
                    <BottomSheet.Overlay />
                    <BottomSheet.Content
                        detached={true}
                        bottomInset={insets.bottom + 12}
                        className="mx-1"
                        backgroundClassName="rounded-[32px]"
                        enableDynamicSizing={false}
                        snapPoints={['85%']}
                        disableContentView={true}
                    >
                        <FlatList
                            data={likers}
                            keyExtractor={(item) => item.id}
                            renderItem={renderItem}
                            onEndReached={handleEndReached}
                            onEndReachedThreshold={0.5}
                            ListHeaderComponent={renderHeader}
                            ListFooterComponent={renderFooter}
                            ListEmptyComponent={renderEmpty}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={true}
                        />
                    </BottomSheet.Content>
                </BottomSheet.Portal>
            </BottomSheet>
        );
    }
));

LikersSheet.displayName = "LikersSheet";

const styles = StyleSheet.create({
    header: {
        marginBottom: 12,
    },
    likerItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        gap: 16,
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        overflow: "hidden",
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    userInfo: {
        flex: 1,
        justifyContent: "center",
    },
    nameRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    footerLoader: {
        alignItems: "center",
        paddingVertical: 16,
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: 32,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
});
