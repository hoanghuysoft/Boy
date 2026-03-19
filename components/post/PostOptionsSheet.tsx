import { AlertDialog, Host } from "@expo/ui/jetpack-compose";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { CopyBold, DangerBold, ShareBold, TrashBinTrashBold } from "@solar-icons/react-native";
import React, { forwardRef, memo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeContext } from "../../context/ThemeContext";
import { useDeletePost } from "../../services/post";
import { createCommonStyles } from "../../styles/common";
import { Post } from "../../types/post";
import { FlexText } from "../FlexText";

// ============================================================================
// Types
// ============================================================================

interface PostOptionsSheetProps {
    post: Post | null;
    currentProfileId: string | null;
    onDeleted?: () => void;
}

interface OptionItemProps {
    icon: React.ComponentType<any>;
    label: string;
    onPress: () => void;
    destructive?: boolean;
    colors: any;
    common: any;
}

// ============================================================================
// OptionItem Component
// ============================================================================

const OptionItem = memo(({
    icon: Icon,
    label,
    onPress,
    destructive = false,
    colors,
    common,
}: OptionItemProps) => (
    <TouchableOpacity
        style={styles.optionItem}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <View style={[
            styles.iconContainer,
            { backgroundColor: destructive ? "#EF444420" : colors.card }
        ]}>
            <Icon
                size={24}
                color={destructive ? "#EF4444" : colors.text}
            />
        </View>
        <FlexText style={[
            common.body,
            { color: destructive ? "#EF4444" : colors.text, fontWeight: "680" }
        ]}>
            {label}
        </FlexText>
    </TouchableOpacity>
));

OptionItem.displayName = "OptionItem";

// ============================================================================
// PostOptionsSheet Component
// ============================================================================

export const PostOptionsSheet = memo(forwardRef<TrueSheet, PostOptionsSheetProps>(
    ({ post, currentProfileId, onDeleted }, ref) => {
        const { colors, typography, theme } = useThemeContext();
        const common = createCommonStyles(colors, typography);
        const insets = useSafeAreaInsets();
        const { t } = useTranslation();

        const isOwner = post?.profile_id === currentProfileId;
        const deletePostMutation = useDeletePost(currentProfileId || "");

        type DialogConfig = {
            title: string;
            text: string;
            confirmText?: string;
            dismissText?: string;
            onConfirm?: () => void;
        };

        const [dialog, setDialog] = useState<DialogConfig | null>(null);
        const closeDialog = useCallback(() => setDialog(null), []);

        const dismissSheet = useCallback(() => {
            if (ref && typeof ref !== "function" && ref.current) {
                ref.current.dismiss();
            }
        }, [ref]);

        const handleDelete = useCallback(() => {
            if (!post) return;
            setDialog({
                title: t('post.dialogs.deletePostTitle'),
                text: t('post.dialogs.deletePostBody'),
                confirmText: t('post.dialogs.delete'),
                dismissText: t('post.dialogs.cancel'),
                onConfirm: async () => {
                    closeDialog();
                    try {
                        await deletePostMutation.mutateAsync({ postId: post.id, deleteMedia: false });
                        dismissSheet();
                        onDeleted?.();
                        setDialog({ title: t('post.dialogs.successTitle'), text: t('post.dialogs.postDeleted'), confirmText: t('post.dialogs.ok') });
                    } catch (error: any) {
                        setDialog({
                            title: t('post.dialogs.errorTitle'),
                            text: error.message || t('post.dialogs.deleteFailed'),
                            confirmText: t('post.dialogs.ok'),
                        });
                    }
                },
            });
        }, [post, deletePostMutation, dismissSheet, closeDialog, onDeleted, t]);

        const handleReport = useCallback(() => {
            dismissSheet();
            setDialog({ title: t('post.dialogs.reportTitle'), text: t('post.dialogs.reportComingSoon'), confirmText: t('post.dialogs.ok') });
        }, [dismissSheet, t]);

        const handleShare = useCallback(() => {
            dismissSheet();
            setDialog({ title: t('post.dialogs.shareTitle'), text: t('post.dialogs.shareComingSoon'), confirmText: t('post.dialogs.ok') });
        }, [dismissSheet, t]);

        const handleCopyLink = useCallback(() => {
            dismissSheet();
            setDialog({ title: t('post.dialogs.copyLinkTitle'), text: t('post.dialogs.linkCopied'), confirmText: t('post.dialogs.ok') });
        }, [dismissSheet, t]);

        return (
            <>
                <TrueSheet
                    ref={ref}
                    backgroundColor={theme === "dark" ? colors.containerContent : "#ffffff"}
                    grabberOptions={{
                        color: colors.muted || "#C4C4C4",
                        height: 4,
                        width: 32,
                    }}
                    detents={['auto']}
                >
                    <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
                        {/* Header */}
                        <View style={styles.header}>
                            <FlexText style={[common.heading]}>{t('post.optionsSheet.title')}</FlexText>
                            <FlexText style={common.bodySmall}>{t('post.optionsSheet.subtitle')}</FlexText>
                        </View>

                        {/* Options List */}
                        <View style={styles.optionsList}>
                            <OptionItem
                                icon={ShareBold}
                                label={t('post.optionsSheet.share')}
                                onPress={handleShare}
                                colors={colors}
                                common={common}
                            />

                            <OptionItem
                                icon={CopyBold}
                                label={t('post.optionsSheet.copyLink')}
                                onPress={handleCopyLink}
                                colors={colors}
                                common={common}
                            />

                            {!isOwner && (
                                <OptionItem
                                    icon={DangerBold}
                                    label={t('post.optionsSheet.report')}
                                    onPress={handleReport}
                                    colors={colors}
                                    common={common}
                                />
                            )}

                            {isOwner && (
                                <OptionItem
                                    icon={TrashBinTrashBold}
                                    label={t('post.optionsSheet.deletePost')}
                                    onPress={handleDelete}
                                    destructive
                                    colors={colors}
                                    common={common}
                                />
                            )}
                        </View>
                    </View>
                </TrueSheet>

                <Host matchContents>
                    <AlertDialog
                        visible={dialog !== null}
                        title={dialog?.title ?? ""}
                        text={dialog?.text ?? ""}
                        confirmButtonText={dialog?.confirmText ?? t('post.dialogs.ok')}
                        dismissButtonText={dialog?.dismissText}
                        onConfirmPressed={() => dialog?.onConfirm ? dialog.onConfirm() : closeDialog()}
                        onDismissPressed={closeDialog}
                    />
                </Host>
            </>
        );
    }
));

PostOptionsSheet.displayName = "PostOptionsSheet";

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
    optionsList: {
    },
    optionItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        gap: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
    },
});
