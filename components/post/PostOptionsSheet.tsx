import ShareIcon from "@/assets/images/svg/share-1.svg";
import CopyIcon from "@/assets/images/svg/copy.svg";
import EditIcon from "@/assets/images/svg/edit-1.svg";
import DeleteIcon from "@/assets/images/svg/delete.svg";
import Ionicons from "@react-native-vector-icons/ionicons/static";

const Share = ({ size, ...props }: any) => <ShareIcon width={size} height={size} {...props} />;
const Copy = ({ size, ...props }: any) => <CopyIcon width={size} height={size} {...props} />;
const PenNewRound = ({ size, ...props }: any) => <EditIcon width={size} height={size} {...props} />;
const TrashBinTrash = ({ size, ...props }: any) => <DeleteIcon width={size} height={size} {...props} />;
const Danger = ({ size, color, ...props }: any) => <Ionicons name="warning" size={size} color={color} {...props} />;
import { ModalBottomSheet } from "@swmansion/react-native-bottom-sheet";
import { router } from "expo-router";
import { Button } from "heroui-native/button";
import { Dialog } from "heroui-native/dialog";
import { useToast } from "heroui-native/toast";
import React, { forwardRef, memo, useCallback, useImperativeHandle, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Clipboard, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeContext } from "../../context/ThemeContext";
import { useCreatePost, useDeletePost, useSharePost } from "../../services/post";
import { useProfile } from "../../services/userprofile";
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
            style={{ backgroundColor: destructive ? colors.errorContainer : colors.surfaceContainerHigh }}
        >
            <Icon
                size={24}
                color={destructive ? colors.onErrorContainer : colors.onSurface}
            />
        </View>
        <FlexText style={[
            common.body,
            { color: destructive ? colors.onErrorContainer : colors.onSurface, fontWeight: "680" }
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
        const { colors, typography, theme } = useThemeContext();
        const common = createCommonStyles(colors, typography);
        const { t } = useTranslation();
        const { toast } = useToast();

        const isOwner = post?.profile_id === currentProfileId;
        const deletePostMutation = useDeletePost(currentProfileId || "");
        const { data: myProfile } = useProfile('me', true);
        const sharePostMutation = useSharePost();
        const createPostMutation = useCreatePost(myProfile?.id || "");
        const insets = useSafeAreaInsets();

        type DialogButton = {
            text: string;
            onPress: () => void;
            variant?: "primary" | "secondary" | "tertiary" | "danger" | "danger-soft" | "ghost" | "outline";
        };

        type DialogConfig = {
            title: string;
            text: string;
            confirmText?: string;
            dismissText?: string;
            onConfirm?: () => void;
            isDestructive?: boolean;
            buttons?: DialogButton[];
        };

        const [dialog, setDialog] = useState<DialogConfig | null>(null);
        const closeDialog = useCallback(() => setDialog(null), []);

        const [index, setIndex] = useState(0);
        const wasOpenRef = useRef(false);

        useImperativeHandle(ref, () => ({
            present: () => {
                wasOpenRef.current = true;
                setIndex(1);
            },
            dismiss: () => {
                setIndex(0);
            },
        }), []);

        const dismissSheet = useCallback(() => {
            setIndex(0);
        }, []);

        const handleIndexChange = useCallback((newIndex: number) => {
            if (newIndex > 0) {
                wasOpenRef.current = true;
            }
            setIndex(newIndex);
        }, []);

        const handleSettle = useCallback((settledIndex: number) => {
            if (settledIndex === 0 && wasOpenRef.current) {
                wasOpenRef.current = false;
            }
        }, []);

        const handleDelete = useCallback(() => {
            if (!post) return;
            dismissSheet();
            setDialog({
                title: t('post.dialogs.deletePostTitle'),
                text: t('post.dialogs.deletePostBody'),
                confirmText: t('post.dialogs.delete'),
                dismissText: t('post.dialogs.cancel'),
                onConfirm: async () => {
                    closeDialog();
                    try {
                        await deletePostMutation.mutateAsync({ postId: post.id, deleteMedia: false });
                        onDeleted?.();
                        toast.show({ label: t('post.dialogs.successTitle'), description: t('post.dialogs.postDeleted'), variant: "success" });
                    } catch (error: any) {
                        toast.show({ label: t('post.dialogs.errorTitle'), description: error.message || t('post.dialogs.deleteFailed'), variant: "danger" });
                    }
                },
            });
        }, [post, deletePostMutation, dismissSheet, closeDialog, onDeleted, t, toast]);

        const handleDirectRepost = useCallback(async () => {
            if (!post || !myProfile?.id) {
                toast.show({
                    label: t('post.dialogs.errorTitle'),
                    description: t('create.dialog.profileNotLoaded'),
                    variant: "danger"
                });
                return;
            }

            try {
                const repostContent = `<post id="${post.id}" />`;

                await createPostMutation.mutateAsync({
                    content: repostContent,
                    device: "Mobile Repost",
                });

                sharePostMutation.mutate(post.id);

                toast.show({
                    label: t('post.dialogs.shareTitle'),
                    description: t('post.dialogs.repostSuccess'),
                    variant: "success"
                });
            } catch (error: any) {
                console.error("Repost failed", error);
                toast.show({
                    label: t('post.dialogs.errorTitle'),
                    description: error.message || t('post.dialogs.repostFailed'),
                    variant: "danger"
                });
            }
        }, [post, myProfile?.id, createPostMutation, sharePostMutation, t, toast]);

        const handleQuoteRepost = useCallback(() => {
            if (!post) return;
            const firstImageMedia = post.media?.find((m: any) => m.type === 'image' || m.type === 'photo' || m.type === 'video');
            router.push({
                pathname: '/create',
                params: {
                    repost_author: post.profile_name,
                    repost_content: post.content || '',
                    repost_deezer_id: post.deezer_id || '',
                    repost_links: JSON.stringify(post.links || []),
                    repost_id: post.id,
                    repost_media_url: firstImageMedia?.url || ''
                }
            });
        }, [post]);

        const handleShare = useCallback(() => {
            dismissSheet();
            if (!post) return;

            setDialog({
                title: t('post.dialogs.shareTitle'),
                text: t('post.optionsSheet.subtitle'),
                buttons: [
                    {
                        text: t('post.dialogs.repostInstant'),
                        onPress: () => {
                            closeDialog();
                            handleDirectRepost();
                        },
                        variant: "primary"
                    },
                    {
                        text: t('post.dialogs.repostQuote'),
                        onPress: () => {
                            closeDialog();
                            handleQuoteRepost();
                        },
                        variant: "outline"
                    }
                ]
            });
        }, [dismissSheet, post, t, handleDirectRepost, handleQuoteRepost, closeDialog]);

        const handleCopyLink = useCallback(() => {
            dismissSheet();
            if (post) {
                const serverUrl = process.env.EXPO_PUBLIC_SERVER_URL || "https://welove.com";
                Clipboard.setString(`${serverUrl}/posts/${post.id}`);
                toast.show({ label: t('post.dialogs.copyLinkTitle'), description: t('post.dialogs.linkCopied'), variant: "success" });
            }
        }, [dismissSheet, post, t, toast]);

        const handleReport = useCallback(() => {
            dismissSheet();
            toast.show({ label: t('post.dialogs.reportTitle'), description: t('post.dialogs.reportComingSoon'), variant: "default" });
        }, [dismissSheet, t, toast]);

        const handleEdit = useCallback(() => {
            dismissSheet();
            if (!post) return;
            router.push({
                pathname: '/create',
                params: {
                    edit_post_id: post.id,
                    edit_content: post.content || '',
                    edit_location: post.location || '',
                    edit_deezer_id: post.deezer_id || '',
                    edit_links: JSON.stringify(post.links || []),
                    edit_is_ghost: String(post.is_ghost || false),
                    edit_is_adult: String(post.is_adult || false),
                    edit_music: post.music ? JSON.stringify(post.music) : '',
                }
            });
        }, [post, dismissSheet]);

        return (
            <>
                <ModalBottomSheet
                    index={index}
                    onIndexChange={handleIndexChange}
                    onSettle={handleSettle}
                    detents={[0, 'content']}
                    scrimColor="rgba(0, 0, 0, 0.5)"
                    surface={
                        <View
                            style={[
                                StyleSheet.absoluteFill,
                                {
                                    backgroundColor: colors.surfaceContainer,
                                    borderTopLeftRadius: 32,
                                    borderTopRightRadius: 32,
                                    overflow: "hidden",
                                },
                            ]}
                        />
                    }
                >
                    <View style={[styles.grabber, { backgroundColor: colors.onSurfaceVariant || "#C4C4C4" }]} />
                    <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 20 }}>
                        {/* Header */}
                        <View className="mb-4">
                            <FlexText style={[common.heading]}>{t('post.optionsSheet.title')}</FlexText>
                            <FlexText style={common.bodySmall}>{t('post.optionsSheet.subtitle')}</FlexText>
                        </View>

                        {/* Options List */}
                        <View>
                            {!post?.reposted_post && (
                                <OptionItem
                                    icon={Share}
                                    label={t('post.optionsSheet.share')}
                                    onPress={handleShare}
                                    colors={colors}
                                    common={common}
                                />
                            )}

                            <OptionItem
                                icon={Copy}
                                label={t('post.optionsSheet.copyLink')}
                                onPress={handleCopyLink}
                                colors={colors}
                                common={common}
                            />

                            {!isOwner && (
                                <OptionItem
                                    icon={Danger}
                                    label={t('post.optionsSheet.report')}
                                    onPress={handleReport}
                                    colors={colors}
                                    common={common}
                                />
                            )}

                            {isOwner && !post?.reposted_post && (
                                <OptionItem
                                    icon={PenNewRound}
                                    label={t('post.optionsSheet.editPost')}
                                    onPress={handleEdit}
                                    colors={colors}
                                    common={common}
                                />
                            )}

                            {isOwner && (
                                <OptionItem
                                    icon={TrashBinTrash}
                                    label={t('post.optionsSheet.deletePost')}
                                    onPress={handleDelete}
                                    destructive
                                    colors={colors}
                                    common={common}
                                />
                            )}
                        </View>
                    </View>
                </ModalBottomSheet>

                <Dialog isOpen={dialog !== null} onOpenChange={(open) => !open && closeDialog()}>
                    <Dialog.Portal>
                        <Dialog.Overlay />
                        <Dialog.Content>
                            <Dialog.Close />
                            <View style={{ marginBottom: 20, gap: 6 }}>
                                <Dialog.Title>{dialog?.title}</Dialog.Title>
                                <Dialog.Description>{dialog?.text}</Dialog.Description>
                            </View>
                            {dialog?.buttons ? (
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    {dialog.buttons.map((btn, idx) => (
                                        <Button
                                            key={idx}
                                            variant={btn.variant ?? "primary"}
                                            onPress={btn.onPress}
                                            style={{ flex: 1 }}
                                        >
                                            {btn.text}
                                        </Button>
                                    ))}
                                </View>
                            ) : (
                                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                                    {dialog?.dismissText && (
                                        <Button variant="ghost" onPress={closeDialog}>
                                            {dialog.dismissText}
                                        </Button>
                                    )}
                                    <Button
                                        variant={dialog?.isDestructive || dialog?.onConfirm ? "danger" : "primary"}
                                        onPress={() => dialog?.onConfirm ? dialog.onConfirm() : closeDialog()}
                                    >
                                        {dialog?.confirmText ?? t('post.dialogs.ok')}
                                    </Button>
                                </View>
                            )}
                        </Dialog.Content>
                    </Dialog.Portal>
                </Dialog>
            </>
        );
    }
));

PostOptionsSheet.displayName = "PostOptionsSheet";

const styles = StyleSheet.create({
    grabber: {
        alignSelf: 'center',
        width: 40,
        height: 5,
        borderRadius: 2.5,
        marginTop: 10,
        marginBottom: 8,
    },
});
