import VerifiedIcon from "@/icons/verified";
import { MaterialIcons } from "@expo/vector-icons";
import { GiphyDialog, GiphyRating } from "@giphy/react-native-sdk";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { ReanimatedTrueSheet } from "@lodev09/react-native-true-sheet/reanimated";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { MediaViewer } from "expo-media-viewer";
import { Button, Dialog, SkeletonGroup } from "heroui-native";
import React, { forwardRef, memo, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Keyboard,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { NitroImage } from "react-native-nitro-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Comment } from "../../types/comment";
import { parseCommentContent, useCommentsSheetViewModel } from "../../viewmodels/CommentsSheetViewModel";
import { FlexText } from "../FlexText";
import { useSheetBackHandler } from "../profile/sheets/useSheetBackHandler";

// ============================================================================
// Types
// ============================================================================

interface CommentsSheetProps {
    postId: string | null;
    onDismiss?: () => void;
    /** Use ReanimatedTrueSheet so animatedPosition is available via useReanimatedTrueSheet() */
    useReanimated?: boolean;
    /** Override sheet detents (default: [0.7]) */
    detents?: (number | 'auto')[];
}

interface CommentItemProps {
    comment: Comment;
    colors: any;
    common: any;
    theme: any;
    isOwn: boolean;
    onPress: () => void;
    onDelete: () => void;
    onEdit: () => void;
    formatTimeAgo: (dateString: string) => string;
    editLabel: string;
    deleteLabel: string;
    isDeleting?: boolean;
}

// ============================================================================
// CommentItem Component
// ============================================================================

const CommentItem = memo(({ comment, colors, common, theme, isOwn, onPress, onDelete, onEdit, formatTimeAgo, editLabel, deleteLabel, isDeleting }: CommentItemProps) => {
    const { text, imageUrl } = parseCommentContent(comment.content);

    return (
        <View style={styles.commentItem}>
            {/* Avatar */}
            <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.avatarContainer}>
                <View style={[styles.avatar, { overflow: 'hidden' }]}>
                    <NitroImage
                        image={{ url: comment.profile_avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png" }}
                        style={[styles.avatar, { backgroundColor: colors.divider }]}
                        resizeMode="cover"
                    />
                </View>
            </TouchableOpacity>

            {/* Content Bubble */}
            <View style={styles.contentWrapper}>
                <View style={[
                    styles.commentBubble,
                    { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }
                ]}>
                    <View style={styles.commentHeader}>
                        <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <FlexText style={[common.heading, { fontSize: 14, fontWeight: '700' }]} numberOfLines={1}>
                                {comment.profile_name}
                            </FlexText>
                            {comment.profile_is_verified && <VerifiedIcon size={14} backgroundColor={colors.verify} />}
                        </TouchableOpacity>
                    </View>

                    {/* Text content (with image tags stripped) */}
                    {text.length > 0 && (
                        <FlexText style={[common.body, { fontSize: 14, marginTop: 4, lineHeight: 20 }]}>
                            {text}
                        </FlexText>
                    )}

                    {imageUrl && (
                        <MediaViewer urls={[imageUrl]} mediaTypes={["image"]} theme="dark">
                            <MediaViewer.Image index={0} style={{ borderRadius: 12, overflow: 'hidden' }}>
                                <NitroImage
                                    image={{ url: imageUrl }}
                                    style={[styles.commentImage, text.length > 0 && { marginTop: 8 }]}
                                    resizeMode="cover"
                                />
                            </MediaViewer.Image>
                        </MediaViewer>
                    )}
                </View>

                <View style={[common.row, { alignItems: 'center', marginTop: 6, marginLeft: 12 }]}>
                    <FlexText style={[common.bodySmall, { color: colors.muted, fontSize: 12 }]}>
                        {formatTimeAgo(comment.created_at)}
                    </FlexText>

                    {isOwn && (
                        <>
                            <FlexText style={{ color: colors.muted, fontSize: 12, marginHorizontal: 4 }}>•</FlexText>
                            <TouchableOpacity
                                onPress={onEdit}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                style={styles.actionButton}
                            >
                                <FlexText style={{ color: colors.muted, fontSize: 13, fontWeight: '700' }}>
                                    {editLabel}
                                </FlexText>
                            </TouchableOpacity>
                            <FlexText style={{ color: colors.muted, fontSize: 12, marginHorizontal: 4 }}>•</FlexText>
                            <TouchableOpacity
                                onPress={onDelete}
                                disabled={isDeleting}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                style={[styles.actionButton, { minWidth: 32, alignItems: 'center' }]}
                            >
                                {isDeleting ? (
                                    <ActivityIndicator size="small" color={colors.muted} style={{ transform: [{ scale: 0.8 }] }} />
                                ) : (
                                    <FlexText style={{ color: colors.muted, fontSize: 13, fontWeight: '700' }}>
                                        {deleteLabel}
                                    </FlexText>
                                )}
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>


        </View>
    );
});

CommentItem.displayName = "CommentItem";

// ============================================================================
// CommentsSheet Component
// ============================================================================

export const CommentsSheet = memo(forwardRef<TrueSheet, CommentsSheetProps>(
    ({ postId, onDismiss, useReanimated = false, detents = [0.7] }, ref) => {
        const insets = useSafeAreaInsets();
        const vm = useCommentsSheetViewModel(postId, ref as React.RefObject<TrueSheet | null>);
        const { t } = useTranslation();
        const backHandler = useSheetBackHandler(ref);

        const [isKeyboardVisible, setKeyboardVisible] = useState(false);

        useEffect(() => {
            const kbShow = Keyboard.addListener('keyboardWillShow', () => setKeyboardVisible(true));
            const kbHide = Keyboard.addListener('keyboardWillHide', () => {
                setKeyboardVisible(false);
                vm.setShowUrlInput(false);
            });
            const kbDidShow = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
            const kbDidHide = Keyboard.addListener('keyboardDidHide', () => {
                setKeyboardVisible(false);
                vm.setShowUrlInput(false);
            });

            return () => {
                kbShow.remove();
                kbHide.remove();
                kbDidShow.remove();
                kbDidHide.remove();
            };
        }, [vm]);

        const renderItem = useCallback(({ item }: { item: Comment }) => (
            <CommentItem
                comment={item}
                colors={vm.colors}
                common={vm.common}
                theme={vm.theme}
                isOwn={!!vm.currentProfileId && String(vm.currentProfileId) === String(item.profile_id)}
                onPress={() => vm.handleUserPress(item)}
                onDelete={() => vm.handleDeleteComment(item)}
                onEdit={() => vm.handleEditComment(item)}
                formatTimeAgo={vm.formatTimeAgo}
                editLabel={t('post.commentsSheet.actionEdit')}
                deleteLabel={t('post.commentsSheet.actionDelete')}
                isDeleting={vm.deletingId === item.id}
            />
        ), [vm.colors, vm.common, vm.theme, vm.currentProfileId, vm.handleUserPress, vm.handleDeleteComment, vm.handleEditComment, vm.formatTimeAgo, t, vm.deletingId]);

        const renderListFooter = useCallback(() => {
            if (vm.isFetchingNextPage) {
                return (
                    <SkeletonGroup isLoading variant="pulse" style={[styles.footerLoader, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
                        <SkeletonGroup.Item className="rounded-full" style={{ width: 38, height: 38 }} />
                        <View style={{ flex: 1, gap: 6 }}>
                            <SkeletonGroup.Item className="rounded-md" style={{ width: '55%', height: 12 }} />
                            <SkeletonGroup.Item className="rounded-md" style={{ width: '80%', height: 10 }} />
                        </View>
                    </SkeletonGroup>
                );
            }
            return null;
        }, [vm.isFetchingNextPage]);

        useEffect(() => {
            GiphyDialog.configure({
                theme: vm.theme === 'dark' ? 'dark' : 'light',
                rating: GiphyRating.R,
            });
        }, [vm.theme, t]);

        useEffect(() => {
            const listener = GiphyDialog.addListener('onMediaSelect', (e) => {
                const media = e.media;
                const images = media?.data?.images || (media as any)?.images;

                if (images && images.original && images.original.url) {
                    const imageUrl = images.original.url;
                    vm.setSelectedImageUrl(imageUrl);
                }
                GiphyDialog.hide();
            });
            return () => listener.remove();
        }, [vm.setSelectedImageUrl]);

        const renderEmpty = useCallback(() => {
            if (vm.isLoading) {
                return (
                    <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <SkeletonGroup key={i} isLoading variant="pulse" style={{ flexDirection: 'row', marginBottom: 20, gap: 12 }}>
                                <SkeletonGroup.Item className="rounded-full" style={{ width: 38, height: 38 }} />
                                <View style={{ flex: 1, gap: 6 }}>
                                    <SkeletonGroup.Item className="rounded-md" style={{ width: '40%', height: 12 }} />
                                    <SkeletonGroup.Item className="rounded-lg" style={{ width: '100%', height: 52 }} />
                                    <SkeletonGroup.Item className="rounded-md" style={{ width: '20%', height: 10 }} />
                                </View>
                            </SkeletonGroup>
                        ))}
                    </View>
                );
            }
            return (
                <View style={styles.emptyState}>
                    <View style={[styles.emptyIconContainer, { backgroundColor: vm.theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                        <MaterialIcons name="comment" size={32} color={vm.colors.muted} />
                    </View>
                    <FlexText style={[vm.common.heading, { fontSize: 18, marginTop: 16, marginBottom: 8 }]}>
                        {t('post.commentsSheet.emptyTitle')}
                    </FlexText>
                    <FlexText style={[vm.common.body, { color: vm.colors.muted, textAlign: 'center' }]}>
                        {t('post.commentsSheet.emptyBody')}
                    </FlexText>
                </View>
            );
        }, [vm.isLoading, vm.colors, vm.common, vm.theme, t]);

        // Modern Input Footer
        const commentInputFooter = (
            <View style={[
                styles.footerContainer,
                {
                    backgroundColor: vm.theme === "dark" ? vm.colors.containerContent : "#ffffff",
                    borderTopColor: vm.theme === "dark" ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                    paddingBottom: Math.max(insets.bottom, 12),
                }
            ]}>
                {/* Edit mode banner */}
                {vm.isEditing && (
                    <View style={[
                        styles.editBanner,
                        { backgroundColor: vm.theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }
                    ]}>
                        <MaterialIcons name="edit" size={14} color={vm.colors.muted} style={{ marginRight: 6 }} />
                        <FlexText
                            style={[vm.common.bodySmall, { color: vm.colors.muted, flex: 1, fontSize: 12 }]}
                            numberOfLines={1}
                        >
                            {t('post.commentsSheet.editingBanner')}
                        </FlexText>
                        <TouchableOpacity
                            onPress={vm.handleCancelEdit}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <MaterialIcons name="close" size={16} color={vm.colors.muted} />
                        </TouchableOpacity>
                    </View>
                )}

                {/* URL Input */}
                {isKeyboardVisible && vm.showUrlInput && (
                    <View style={[styles.urlInputWrapper, { backgroundColor: vm.theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}>
                        <MaterialIcons name="link" size={18} color={vm.colors.muted} />
                        <TextInput
                            style={[styles.urlInput, { color: vm.colors.text }]}
                            placeholder="Enter image URL..."
                            placeholderTextColor={vm.colors.muted}
                            value={vm.imageUrlInput}
                            onChangeText={vm.setImageUrlInput}
                            autoFocus
                            autoCapitalize="none"
                            keyboardType="url"
                            selectionColor={vm.colors.text}
                            onSubmitEditing={vm.handleAddImageUrl}
                        />
                        {vm.imageUrlInput.trim().length > 0 && (
                            <TouchableOpacity onPress={vm.handleAddImageUrl} style={{ marginLeft: 8 }}>
                                <MaterialIcons name="check-circle" size={24} color={vm.colors.verify || vm.colors.text} />
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Selected Image Preview */}
                {vm.selectedImageUrl && (
                    <View style={styles.previewContainer}>
                        <Image source={{ uri: vm.selectedImageUrl }} style={styles.previewImage} contentFit="cover" />
                        <TouchableOpacity style={styles.previewRemoveButton} onPress={() => vm.setSelectedImageUrl(null)}>
                            <MaterialIcons name="close" size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.inputInnerWrapper}>
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: vm.theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                            color: vm.colors.text,
                        }]}
                        placeholder={vm.isEditing ? t('post.commentsSheet.placeholderEdit') : t('post.commentsSheet.placeholderAdd')}
                        placeholderTextColor={vm.colors.muted}
                        value={vm.commentText}
                        onChangeText={vm.setCommentText}
                        multiline
                        maxLength={500}
                        selectionColor={vm.colors.text}
                        autoFocus={vm.isEditing}
                    />
                    {/* Note: since text and image are separated, allow submit if either exists */}
                    {vm.canSubmit && (
                        <TouchableOpacity
                            onPress={vm.onPrimaryAction}
                            disabled={vm.isActionLoading}
                            style={styles.sendButton}
                        >
                            <View style={[styles.sendButtonBackground, { backgroundColor: vm.colors.text }]}>
                                {vm.isActionLoading ? (
                                    <ActivityIndicator size="small" color={vm.colors.background} />
                                ) : (
                                    <FlexText style={[styles.sendButtonText, { color: vm.colors.background }]}>
                                        {vm.isEditing ? t('post.commentsSheet.sendSave') : t('post.commentsSheet.sendPost')}
                                    </FlexText>
                                )}
                            </View>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Toolbar under input when keyboard is visible */}
                {isKeyboardVisible && (
                    <View style={styles.keyboardToolbar}>
                        <TouchableOpacity
                            style={[
                                styles.toolbarButton,
                                { backgroundColor: vm.theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
                                vm.selectedImageUrl ? { opacity: 0.5 } : {}
                            ]}
                            onPress={() => vm.setShowUrlInput(!vm.showUrlInput)}
                            disabled={!!vm.selectedImageUrl}
                        >
                            <MaterialIcons name="image" size={20} color={vm.colors.text} />
                            <FlexText style={[vm.common.bodySmall, { color: vm.colors.text, fontWeight: '600' }]}>
                                Add Image
                            </FlexText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.toolbarButton,
                                { backgroundColor: vm.theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
                                vm.selectedImageUrl ? { opacity: 0.5 } : {}
                            ]}
                            onPress={() => { GiphyDialog.show() }}
                            disabled={!!vm.selectedImageUrl}
                        >
                            <MaterialIcons name="gif" size={20} color={vm.colors.text} />
                            <FlexText style={[vm.common.bodySmall, { color: vm.colors.text, fontWeight: '600' }]}>
                                Add GIF
                            </FlexText>
                        </TouchableOpacity>

                    </View>
                )}
            </View>
        );

        const sharedProps = {
            ref,
            scrollable: true,
            backgroundColor: vm.theme === "dark" ? vm.colors.containerContent : "#ffffff",
            grabberOptions: {
                color: vm.colors.muted || "#C4C4C4",
                height: 5,
                width: 40,
            },
            cornerRadius: 32,
            detents,
            footer: commentInputFooter,
            onDidPresent: backHandler.onDidPresent,
            onDidDismiss: () => {
                backHandler.onDidDismiss();
                onDismiss?.();
            },
        };

        const sheetContent = (
            <>
                {/* Header */}
                <View style={styles.header}>
                    <FlexText style={[vm.common.heading, { fontSize: 20 }]}>{t('post.commentsSheet.title')}</FlexText>
                </View>

                {/* Comments List */}
                <FlashList
                    nestedScrollEnabled
                    data={vm.comments}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    onEndReached={vm.handleEndReached}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={renderListFooter}
                    ListEmptyComponent={renderEmpty}
                    contentContainerStyle={styles.listContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                />
            </>
        );

        const deleteDialog = (
            <Dialog isOpen={vm.isDeleteDialogOpen} onOpenChange={vm.setIsDeleteDialogOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay />
                    <Dialog.Content>
                        <Dialog.Close />
                        <View style={{ marginBottom: 20, gap: 6 }}>
                            <Dialog.Title>{t('post.commentsSheet.actionDelete')}</Dialog.Title>
                            <Dialog.Description>
                                Are you sure you want to delete this comment?
                            </Dialog.Description>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                            <Button variant="ghost" onPress={() => vm.setIsDeleteDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="danger" onPress={vm.confirmDeleteComment}>
                                {t('post.commentsSheet.actionDelete')}
                            </Button>
                        </View>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog>
        );

        if (useReanimated) {
            return (
                <>
                    <ReanimatedTrueSheet dimmed={false} {...sharedProps}>
                        {sheetContent}
                    </ReanimatedTrueSheet>
                    {deleteDialog}
                </>
            );
        }

        return (
            <>
                <TrueSheet {...sharedProps}>
                    {sheetContent}
                </TrueSheet>
                {deleteDialog}
            </>
        );
    }
));

CommentsSheet.displayName = "CommentsSheet";

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 20,
        gap: 10,
    },
    listContent: {
        paddingBottom: 100,
        paddingHorizontal: 20,
    },
    commentItem: {
        flexDirection: "row",
        marginBottom: 20,
        gap: 12,
    },
    avatarContainer: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
    },
    contentWrapper: {
        flex: 1,
    },
    commentBubble: {
        borderRadius: 18,
        borderTopLeftRadius: 4,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    commentHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    actionButton: {
    },
    commentImageWrapper: {
        borderRadius: 12,
        overflow: 'hidden',
        alignSelf: 'flex-start',
        maxWidth: '100%',
    },
    commentImage: {
        height: 240,
        borderRadius: 12,
    },
    footerLoader: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    emptyState: {
        paddingVertical: 60,
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerContainer: {
        borderTopWidth: 1,
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    editBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 99,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 8,
    },
    inputInnerWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
    },
    input: {
        flex: 1,
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 14,
        fontSize: 15,
        maxHeight: 120,
        minHeight: 48,
    },
    sendButton: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    sendButtonBackground: {
        paddingHorizontal: 18,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonText: {
        fontWeight: '700',
        fontSize: 14,
    },
    urlInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginBottom: 8,
    },
    urlInput: {
        flex: 1,
        fontSize: 14,
        marginLeft: 8,
    },
    keyboardToolbar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 8,
    },
    toolbarButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6,
    },
    previewContainer: {
        alignSelf: 'flex-start',
        marginBottom: 12,
        marginLeft: 8,
        position: 'relative',
    },
    previewImage: {
        width: 100,
        height: 100,
        borderRadius: 12,
    },
    previewRemoveButton: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: 'rgba(0,0,0,0.6)',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
});
