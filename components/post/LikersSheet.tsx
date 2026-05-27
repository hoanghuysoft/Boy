import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { Image as ExpoImage } from "expo-image";
import { SkeletonGroup } from "heroui-native";
import React, { forwardRef, memo, useCallback, useImperativeHandle, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from "react-native";
import { FlatList } from "react-native-gesture-handler";
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
    onDismiss?: () => void;
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
        <ExpoImage
            source={{ uri: user.profile_avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png" }}
            style={[styles.avatar, { backgroundColor: colors.divider }]}
            contentFit="cover"
        />
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
    ({ postId, onDismiss }, ref) => {
        const insets = useSafeAreaInsets();
        const sheetRef = useRef<TrueSheet>(null);
        const vm = useLikersSheetViewModel(postId, sheetRef as React.RefObject<any>);
        const { t } = useTranslation();
        const {
            colors,
            common,
            theme,
            likers,
            totalLikes,
            isLoading,
            isFetchingNextPage,
            handleEndReached,
            handleUserPress,
        } = vm;

        const isPresentedRef = useRef(false);

        useImperativeHandle(ref, () => ({
            present: () => {
                if (isPresentedRef.current) return;
                isPresentedRef.current = true;
                sheetRef.current?.present();
            },
            dismiss: () => {
                if (!isPresentedRef.current) return;
                isPresentedRef.current = false;
                sheetRef.current?.dismiss();
            },
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
                    <View style={{ paddingTop: 8 }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <SkeletonGroup key={i} isLoading variant="pulse" style={{ flexDirection: 'row', marginBottom: 20, gap: 16 }}>
                                <SkeletonGroup.Item className="rounded-full" style={{ width: 48, height: 48 }} />
                                <View style={{ gap: 4, flex: 1, justifyContent: 'center' }}>
                                    <SkeletonGroup.Item className="rounded-lg" style={{ width: '40%', height: 16 }} />
                                </View>
                            </SkeletonGroup>
                        ))}
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

        const sharedProps = {
            ref: sheetRef,
            scrollable: true,
            backgroundColor: theme === "dark" ? colors.containerContent : "#ffffff",
            grabberOptions: {
                color: colors.muted || "#C4C4C4",
                height: 5,
                width: 40,
            },
            cornerRadius: 32,
            detents: [0.85],
            onDidPresent: () => {
                isPresentedRef.current = true;
            },
            onDidDismiss: () => {
                isPresentedRef.current = false;
                onDismiss?.();
            },
        };

        return (
            <TrueSheet {...sharedProps}>
                <View style={[styles.container, { paddingBottom: insets.bottom + 12 }]}>
                    <FlatList
                        nestedScrollEnabled
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
                </View>
            </TrueSheet>
        );
    }
));

LikersSheet.displayName = "LikersSheet";

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 8,
    },
    header: {
        marginBottom: 12,
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
