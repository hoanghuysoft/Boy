import {
    checkPostDownloadStatus,
    DownloadedMediaRecord,
    getMediaDownloadKey,
    isMediaDownloaded,
    recordBatchDownloadedMedia,
    useDownloadedMediaStore,
} from "@/services/downloadedMediaDatabase";
import CopyIcon from "@/assets/images/svg/copy.svg";
import DeleteIcon from "@/assets/images/svg/delete.svg";
import EditIcon from "@/assets/images/svg/edit-1.svg";
import ShareIcon from "@/assets/images/svg/share-1.svg";
import { Directory, File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Album, Asset } from 'expo-media-library';
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { Button } from "heroui-native/button";
import { Dialog } from "heroui-native/dialog";
import { useToast } from "heroui-native/toast";
import React, { forwardRef, memo, useCallback, useImperativeHandle, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeContext } from "../../context/ThemeContext";
import { useCreatePost, useDeletePost, useSharePost } from "../../services/post";
import { useAdminCheck, useProfile } from "../../services/userprofile";
import { useLanguageStore } from "../../stores/language";
import { useSettingsStore } from "../../stores/settings";
import { useTranslationStore } from "../../stores/translation";
import { createCommonStyles } from "../../styles/common";
import { Post } from "../../types/post";
import { FlexText } from "../FlexText";
import { useSheetBackHandler } from "../profile/sheets/useSheetBackHandler";

const Share = ({ size, ...props }: any) => <ShareIcon width={size} height={size} {...props} />;
const Copy = ({ size, ...props }: any) => <CopyIcon width={size} height={size} {...props} />;
const PenNewRound = ({ size, ...props }: any) => <EditIcon width={size} height={size} {...props} />;
const TrashBinTrash = ({ size, ...props }: any) => <DeleteIcon width={size} height={size} {...props} />;
const Danger = ({ size, color, ...props }: any) => <Ionicons name="warning" size={size} color={color} {...props} />;
const DownloadIcon = ({ size, color, ...props }: any) => <Ionicons name="download-outline" size={size} color={color} {...props} />;
const SavedCheckIcon = ({ size, color, ...props }: any) => <Ionicons name="checkmark-circle" size={size} color={color || "#10B981"} {...props} />;

// ============================================================================
// Types
// ============================================================================

interface PostOptionsSheetProps {
    post: Post | null;
    currentProfileId?: string | null;
    onDeleted?: () => void;
    isExternal?: boolean;
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

const TranslateIcon = ({ size, color, ...props }: any) => <Ionicons name="language" size={size} color={color} {...props} />;

// ============================================================================
// PostOptionsSheet Component
// ============================================================================

export const PostOptionsSheet = memo(forwardRef<any, PostOptionsSheetProps>(
    ({ post, currentProfileId, onDeleted, isExternal }, ref) => {
        const { colors, typography } = useThemeContext();
        const common = createCommonStyles(colors, typography);
        const { t } = useTranslation();
        const { toast } = useToast();

        const isExternalPost = isExternal ?? (
            post?.device === 'Instagram for Mobile' ||
            post?.device === 'Instagram Story' ||
            post?.device === 'Threads for Mobile' ||
            post?.device === 'X for Mobile' ||
            post?.device?.includes('Instagram') ||
            post?.device?.includes('Threads') ||
            post?.device?.includes('Twitter') ||
            post?.device?.includes('fxtwitter')
        );

        const isOwner = post?.profile_id === currentProfileId;
        const { data: adminData } = useAdminCheck();
        const deletePostMutation = useDeletePost(currentProfileId || "");
        const { data: myProfile } = useProfile('me', true);
        const sharePostMutation = useSharePost();
        const createPostMutation = useCreatePost(myProfile?.id || "");
        const insets = useSafeAreaInsets();
        const isAdmin = !!(adminData?.isAdmin ?? adminData?.is_admin ?? myProfile?.is_admin);


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

        const sheetRef = useRef<TrueSheet>(null);
        const isPresented = useRef(false);
        const backHandler = useSheetBackHandler(sheetRef);

        const { translations, translate, clearTranslation } = useTranslationStore();
        const { translationLanguage } = useLanguageStore();
        const isTranslated = post ? !!translations[post.id]?.translatedText : false;

        const dismissSheet = useCallback(() => {
            isPresented.current = false;
            sheetRef.current?.dismiss();
        }, []);


        useImperativeHandle(ref, () => ({
            present: () => {
                isPresented.current = true;
                sheetRef.current?.present();
            },
            dismiss: () => {
                isPresented.current = false;
                sheetRef.current?.dismiss();
            },
        } as any), []);

        const handleTranslatePress = useCallback(() => {
            dismissSheet();
            if (!post) return;
            if (isTranslated) {
                clearTranslation(post.id);
            } else {
                translate(post.id, post.content, translationLanguage);
            }
        }, [post, isTranslated, translate, clearTranslation, dismissSheet, translationLanguage]);

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

        const handleCopyLink = useCallback(async () => {
            dismissSheet();
            if (post) {
                const serverUrl = process.env.EXPO_PUBLIC_SERVER_URL || "https://welove.com";
                await Clipboard.setStringAsync(`${serverUrl}/posts/${post.id}`);
                toast.show({ label: t('post.dialogs.copyLinkTitle'), description: t('post.dialogs.linkCopied'), variant: "success" });
            }
        }, [dismissSheet, post, t, toast]);

        const handleReport = useCallback(() => {
            dismissSheet();
            toast.show({ label: t('post.dialogs.reportTitle'), description: t('post.dialogs.reportComingSoon'), variant: "default" });
        }, [dismissSheet, t, toast]);

        const downloadVersion = useDownloadedMediaStore((s) => s.version);
        const downloadStatus = useMemo(() => {
            return checkPostDownloadStatus(post);
        }, [post, downloadVersion]);

        const handleSaveToGallery = useCallback(async (forceAll = false) => {
            if (!post) return;

            const mediaList = post.media || [];
            if (mediaList.length === 0) {
                dismissSheet();
                toast.show({
                    label: t('post.dialogs.noMediaTitle', 'No Media'),
                    description: t('post.dialogs.noMediaDescription', 'This post does not contain any images or videos to save.'),
                    variant: 'warning',
                });
                return;
            }

            // Check if all items are already downloaded and user clicked without forcing
            const currentStatus = checkPostDownloadStatus(post);
            if (!forceAll && currentStatus.isFullyDownloaded) {
                dismissSheet();
                setDialog({
                    title: t('post.dialogs.alreadySavedTitle', 'Already in Gallery'),
                    text: t(
                        'post.dialogs.alreadySavedBody',
                        `All ${currentStatus.totalCount} ${currentStatus.totalCount > 1 ? 'items' : 'item'} from this post are already saved in your gallery. Do you want to download again?`
                    ),
                    confirmText: t('post.dialogs.downloadAgain', 'Download Again'),
                    dismissText: t('post.dialogs.cancel', 'Cancel'),
                    onConfirm: () => {
                        closeDialog();
                        handleSaveToGallery(true);
                    },
                });
                return;
            }

            dismissSheet();

            // Filter only un-downloaded items unless forceAll is requested
            const itemsToDownload = forceAll
                ? mediaList.map((media, i) => ({ media, originalIndex: i }))
                : mediaList
                    .map((media, i) => ({ media, originalIndex: i }))
                    .filter(({ media, originalIndex }) => !isMediaDownloaded(media, post.id, originalIndex));

            if (itemsToDownload.length === 0) {
                toast.show({
                    label: t('post.dialogs.alreadySavedTitle', 'Already in Gallery'),
                    description: t('post.dialogs.allMediaAlreadyDownloaded', 'All media from this post has already been saved.'),
                    variant: 'default',
                });
                return;
            }

            try {
                const { status } = await MediaLibrary.requestPermissionsAsync();
                if (status !== 'granted') {
                    toast.show({
                        label: t('post.dialogs.permissionDenied', 'Permission Denied'),
                        description: t('post.dialogs.permissionDeniedDesc', 'Please grant media library permission to save media.'),
                        variant: 'danger',
                    });
                    return;
                }

                toast.show({
                    label: t('post.dialogs.savingMedia', 'Saving to Gallery...'),
                    description: `Downloading ${itemsToDownload.length} ${itemsToDownload.length > 1 ? 'items' : 'item'}...`,
                });

                const downloadDir = new Directory(Paths.cache, 'saved_media');
                if (!downloadDir.exists) {
                    downloadDir.create({ idempotent: true, intermediates: true });
                }

                // Download items concurrently for fast bulk saving
                const downloadPromises = itemsToDownload.map(async ({ media, originalIndex }) => {
                    let mediaUrl = media.url || media.backup1 || media.thumbnail_url;
                    if (!mediaUrl) return null;

                    // Ensure Twitter/X photos use uncompressed original quality (name=orig)
                    if (mediaUrl.includes("pbs.twimg.com/media/")) {
                        if (mediaUrl.includes("?")) {
                            const [base, query] = mediaUrl.split("?");
                            const params = new URLSearchParams(query);
                            params.set("name", "orig");
                            mediaUrl = `${base}?${params.toString()}`;
                        } else {
                            mediaUrl = `${mediaUrl}?name=orig`;
                        }
                    }

                    const isVideo = media.type === 'video' || mediaUrl.includes('.mp4') || mediaUrl.includes('.mov');
                    let ext = 'jpg';
                    if (isVideo) {
                        ext = mediaUrl.includes('.mov') ? 'mov' : 'mp4';
                    } else if (mediaUrl.includes('.png') || mediaUrl.includes('format=png')) {
                        ext = 'png';
                    } else if (mediaUrl.includes('.webp') || mediaUrl.includes('format=webp')) {
                        ext = 'webp';
                    } else if (media.type === 'gif' || mediaUrl.includes('.gif') || mediaUrl.includes('format=gif')) {
                        ext = 'gif';
                    }

                    const fileName = `media_${post.id}_${originalIndex}_${Date.now()}.${ext}`;

                    const localFile = new File(downloadDir, fileName);
                    if (!localFile.exists) {
                        await File.downloadFileAsync(mediaUrl, localFile);
                    }

                    const asset = await Asset.create(localFile.uri);
                    const downloadKey = getMediaDownloadKey(media, post.id, originalIndex);

                    const record: DownloadedMediaRecord = {
                        key: downloadKey,
                        postId: post.id,
                        mediaId: media.id,
                        url: mediaUrl,
                        assetId: asset.id,
                        platform: post.device?.includes('Instagram')
                            ? 'instagram'
                            : post.device?.includes('Threads')
                            ? 'threads'
                            : post.device?.includes('X')
                            ? 'fxtwitter'
                            : 'other',
                        mediaType: isVideo ? 'video' : ext === 'gif' ? 'gif' : 'photo',
                        fileName,
                        downloadedAt: Date.now(),
                    };

                    return { asset, record };
                });

                const results = (await Promise.all(downloadPromises)).filter((r): r is { asset: Asset; record: DownloadedMediaRecord } => !!r);
                const createdAssets = results.map((r) => r.asset);
                const newRecords = results.map((r) => r.record);

                if (createdAssets.length > 0) {
                    try {
                        const album = await Album.get('WeLove');
                        if (album) {
                            await album.add(createdAssets);
                        } else {
                            await Album.create('WeLove', createdAssets);
                        }
                    } catch {
                        // Album organization is optional, assets are already saved to media library
                    }

                    // Record downloaded items into database
                    recordBatchDownloadedMedia(newRecords);
                }

                const alreadyCount = currentStatus.downloadedCount;
                const successMsg = alreadyCount > 0 && !forceAll
                    ? `Successfully saved ${createdAssets.length} new items to gallery (${alreadyCount} were already saved).`
                    : `Successfully saved ${createdAssets.length} ${createdAssets.length > 1 ? 'items' : 'item'} to your gallery.`;

                toast.show({
                    label: t('post.dialogs.saveSuccess', 'Saved to Gallery'),
                    description: successMsg,
                    variant: 'success',
                });
            } catch (error: any) {
                console.error('Save to gallery error:', error);
                toast.show({
                    label: t('post.dialogs.saveFailed', 'Save Failed'),
                    description: error?.message || 'An error occurred while saving media to gallery.',
                    variant: 'danger',
                });
            }
        }, [dismissSheet, post, t, toast, closeDialog]);

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
                <TrueSheet
                    ref={sheetRef}
                    scrollable={false}
                    backgroundColor={colors.surfaceContainer}
                    grabberOptions={{
                        color: colors.onSurfaceVariant || "#C4C4C4",
                        height: 5,
                        width: 40,
                    }}
                    cornerRadius={32}
                    detents={['auto']}
                    onDidPresent={() => {
                        isPresented.current = true;
                        backHandler.onDidPresent();
                    }}
                    onDidDismiss={() => {
                        isPresented.current = false;
                        backHandler.onDidDismiss();
                    }}
                >
                    <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 20 }}>
                        {/* Header */}
                        <View className="mb-4">
                            <FlexText style={[common.heading]}>
                                {isExternalPost ? t('post.optionsSheet.externalTitle', 'Post Options') : t('post.optionsSheet.title')}
                            </FlexText>
                            <FlexText style={common.bodySmall}>
                                {isExternalPost ? t('post.optionsSheet.externalSubtitle', 'Manage media from this post') : t('post.optionsSheet.subtitle')}
                            </FlexText>
                        </View>

                        {/* Options List */}
                        <View>
                            {isExternalPost ? (
                                <OptionItem
                                    icon={downloadStatus.isFullyDownloaded ? SavedCheckIcon : DownloadIcon}
                                    label={
                                        downloadStatus.isFullyDownloaded
                                            ? t('post.optionsSheet.alreadySaved', 'Saved to Gallery')
                                            : downloadStatus.isPartiallyDownloaded
                                            ? t('post.optionsSheet.saveRemaining', `Save to Gallery (${downloadStatus.unDownloadedMedia.length} new)`)
                                            : t('post.optionsSheet.saveToGallery', 'Save to Gallery')
                                    }
                                    onPress={() => handleSaveToGallery(false)}
                                    colors={colors}
                                    common={common}
                                />
                            ) : (
                                <>
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

                                    {post?.content && (
                                        <OptionItem
                                            icon={TranslateIcon}
                                            label={isTranslated ? t('post.optionsSheet.hideTranslation', 'Hide Translation') : t('post.optionsSheet.translate', 'Translate')}
                                            onPress={handleTranslatePress}
                                            colors={colors}
                                            common={common}
                                        />
                                    )}

                                    {!isOwner && !isAdmin && (
                                        <OptionItem
                                            icon={Danger}
                                            label={t('post.optionsSheet.report')}
                                            onPress={handleReport}
                                            colors={colors}
                                            common={common}
                                        />
                                    )}

                                    {(isOwner || isAdmin) && !post?.reposted_post && (
                                        <OptionItem
                                            icon={PenNewRound}
                                            label={t('post.optionsSheet.editPost')}
                                            onPress={handleEdit}
                                            colors={colors}
                                            common={common}
                                        />
                                    )}

                                    {(isOwner || isAdmin) && (
                                        <OptionItem
                                            icon={TrashBinTrash}
                                            label={t('post.optionsSheet.deletePost')}
                                            onPress={handleDelete}
                                            destructive
                                            colors={colors}
                                            common={common}
                                        />
                                    )}
                                </>
                            )}
                        </View>
                    </View>
                </TrueSheet>



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
