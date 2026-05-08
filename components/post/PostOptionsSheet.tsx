import { CopyBold, DangerBold, ShareBold, TrashBinTrashBold } from "@solar-icons/react-native";
import { BottomSheet, Button, Dialog, useToast } from "heroui-native";
import React, { forwardRef, memo, useCallback, useImperativeHandle, useState } from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity, View } from "react-native";
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

export interface PostOptionsSheetHandle {
    present: () => void;
    dismiss: () => void;
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
        className="flex-row items-center gap-4 py-2"
        onPress={onPress}
        activeOpacity={0.7}
    >
        <View
            className="h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: destructive ? "#EF444420" : colors.card }}
        >
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

export const PostOptionsSheet = memo(forwardRef<PostOptionsSheetHandle, PostOptionsSheetProps>(
    ({ post, currentProfileId, onDeleted }, ref) => {
        const { colors, typography } = useThemeContext();
        const common = createCommonStyles(colors, typography);
        const { t } = useTranslation();
        const { toast } = useToast();

        const isOwner = post?.profile_id === currentProfileId;
        const deletePostMutation = useDeletePost(currentProfileId || "");
        const [isOpen, setIsOpen] = useState(false);
        const insets = useSafeAreaInsets();

        type DialogConfig = {
            title: string;
            text: string;
            confirmText?: string;
            dismissText?: string;
            onConfirm?: () => void;
        };

        const [dialog, setDialog] = useState<DialogConfig | null>(null);
        const closeDialog = useCallback(() => setDialog(null), []);

        useImperativeHandle(ref, () => ({
            present: () => setIsOpen(true),
            dismiss: () => setIsOpen(false),
        }), []);

        const dismissSheet = useCallback(() => {
            setIsOpen(false);
        }, []);

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
                        toast.show({ label: t('post.dialogs.successTitle'), description: t('post.dialogs.postDeleted'), variant: "success" });
                    } catch (error: any) {
                        toast.show({ label: t('post.dialogs.errorTitle'), description: error.message || t('post.dialogs.deleteFailed'), variant: "danger" });
                    }
                },
            });
        }, [post, deletePostMutation, dismissSheet, closeDialog, onDeleted, t, toast]);

        const handleReport = useCallback(() => {
            dismissSheet();
            toast.show({ label: t('post.dialogs.reportTitle'), description: t('post.dialogs.reportComingSoon'), variant: "default" });
        }, [dismissSheet, t, toast]);

        const handleShare = useCallback(() => {
            dismissSheet();
            toast.show({ label: t('post.dialogs.shareTitle'), description: t('post.dialogs.shareComingSoon'), variant: "default" });
        }, [dismissSheet, t, toast]);

        const handleCopyLink = useCallback(() => {
            dismissSheet();
            toast.show({ label: t('post.dialogs.copyLinkTitle'), description: t('post.dialogs.linkCopied'), variant: "success" });
        }, [dismissSheet, t, toast]);

        return (
            <>
                <BottomSheet isOpen={isOpen} onOpenChange={setIsOpen}>
                    <BottomSheet.Portal>
                        <BottomSheet.Overlay />
                        <BottomSheet.Content detached={true}
                            bottomInset={insets.bottom + 12}
                            className="mx-1"
                            backgroundClassName="rounded-[32px]">
                            <View>
                                {/* Header */}
                                <View className="mb-5">
                                    <FlexText style={[common.heading]}>{t('post.optionsSheet.title')}</FlexText>
                                    <FlexText style={common.bodySmall}>{t('post.optionsSheet.subtitle')}</FlexText>
                                </View>

                                {/* Options List */}
                                <View>
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
                        </BottomSheet.Content>
                    </BottomSheet.Portal>
                </BottomSheet>

                <Dialog isOpen={dialog !== null} onOpenChange={(open) => !open && closeDialog()}>
                    <Dialog.Portal>
                        <Dialog.Overlay />
                        <Dialog.Content>
                            <Dialog.Close />
                            <View style={{ marginBottom: 20, gap: 6 }}>
                                <Dialog.Title>{dialog?.title}</Dialog.Title>
                                <Dialog.Description>{dialog?.text}</Dialog.Description>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                                {dialog?.dismissText && (
                                    <Button variant="ghost" onPress={closeDialog}>
                                        {dialog.dismissText}
                                    </Button>
                                )}
                                <Button
                                    variant={dialog?.onConfirm ? "danger" : "primary"}
                                    onPress={() => dialog?.onConfirm ? dialog.onConfirm() : closeDialog()}
                                >
                                    {dialog?.confirmText ?? t('post.dialogs.ok')}
                                </Button>
                            </View>
                        </Dialog.Content>
                    </Dialog.Portal>
                </Dialog>
            </>
        );
    }
));

PostOptionsSheet.displayName = "PostOptionsSheet";
