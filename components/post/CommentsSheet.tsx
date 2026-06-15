import VerifiedIcon from "@/icons/verified";
import { GiphyDialog, GiphyRating } from "@giphy/react-native-sdk";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { Galeria } from "@nandorojo/galeria";
import MaterialIcons from "@react-native-vector-icons/material-icons/static";
import { GalleryAdd, PenNewRound, Plain2 } from "@solar-icons/react-native/Bold";
import { Image } from "expo-image";
import { Avatar } from "heroui-native/avatar";
import { Button } from "heroui-native/button";
import { SkeletonGroup } from "heroui-native/skeleton-group";
import { Spinner } from "heroui-native/spinner";
import React, { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    FlatList,
    Keyboard,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Comment } from "../../types/comment";
import { EMOJI_ASSETS } from "../../utils/emojiResolver";
import { parseCommentContent, useCommentsSheetViewModel } from "../../viewmodels/CommentsSheetViewModel";
import { EmojiSelectorSheet } from "../EmojiSelectorSheet";
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
                <Avatar style={styles.avatar}>
                    <Avatar.Image source={{ uri: comment.profile_avatar }} />
                    <Avatar.Fallback>{comment.profile_name?.[0] || 'U'}</Avatar.Fallback>
                </Avatar>
            </TouchableOpacity>

            {/* Content Bubble */}
            <View style={styles.contentWrapper}>
                <View>
                    <View style={styles.commentHeader}>
                        <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <FlexText style={[common.bodySmall, { color: colors.onSurfaceVariant, fontSize: 13, fontWeight: '600' }]} numberOfLines={1}>
                                {comment.profile_name}
                            </FlexText>
                            {comment.profile_is_verified && <VerifiedIcon size={12} backgroundColor={colors.primary} />}
                        </TouchableOpacity>
                    </View>

                    {/* Text content (with image tags stripped) */}
                    {text.length > 0 && (
                        <FlexText style={[common.body, { fontSize: 14, marginTop: 2, lineHeight: 20 }]}>
                            {text}
                        </FlexText>
                    )}

                    {imageUrl && (
                        <View style={{ marginTop: 8, position: 'relative' }}>
                            {EMOJI_ASSETS[imageUrl] ? (
                                <Image
                                    source={EMOJI_ASSETS[imageUrl]}
                                    style={{ width: 120, height: 120 }}
                                    contentFit="contain"
                                />
                            ) : (
                                <Galeria urls={[imageUrl]} theme={theme}>
                                    <Galeria.Image>
                                        <Image
                                            source={{ uri: imageUrl }}
                                            style={[styles.commentImage, { width: '100%' }]}
                                            contentFit="cover"
                                        />
                                    </Galeria.Image>
                                </Galeria>
                            )}
                        </View>
                    )}
                </View>

                <View style={[common.row, { alignItems: 'center', marginTop: 4 }]}>
                    <FlexText style={[common.bodySmall, { color: colors.onSurfaceVariant, fontSize: 12 }]}>
                        {formatTimeAgo(comment.created_at)}
                    </FlexText>

                    {isOwn && (
                        <>
                            <FlexText style={{ color: colors.onSurfaceVariant, fontSize: 12, marginHorizontal: 8 }}>•</FlexText>
                            <TouchableOpacity
                                onPress={onEdit}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                style={styles.actionButton}
                            >
                                <FlexText style={{ color: colors.onSurfaceVariant, fontSize: 12, fontWeight: '600' }}>
                                    {editLabel}
                                </FlexText>
                            </TouchableOpacity>
                            <FlexText style={{ color: colors.onSurfaceVariant, fontSize: 12, marginHorizontal: 8 }}>•</FlexText>
                            <TouchableOpacity
                                onPress={onDelete}
                                disabled={isDeleting}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                style={[styles.actionButton, { minWidth: 32, alignItems: 'center' }]}
                            >
                                {isDeleting ? (
                                    <Spinner size="md" color={colors.onSurfaceVariant} style={{ transform: [{ scale: 0.8 }] }} />
                                ) : (
                                    <FlexText style={{ color: colors.onSurfaceVariant, fontSize: 12, fontWeight: '600' }}>
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
        const sheetRef = useRef<TrueSheet>(null);
        const emojiSheetRef = useRef<TrueSheet>(null);
        const isPresentedRef = useRef(false);
        const inputRef = useRef<TextInput>(null);

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
        } as any), []);

        const vm = useCommentsSheetViewModel(postId, sheetRef);
        const { t } = useTranslation();
        const backHandler = useSheetBackHandler(sheetRef);

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
        ), [vm, t]);

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
                theme: vm.theme,
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
        }, [vm.setSelectedImageUrl, vm]);

        const renderEmpty = useCallback(() => {
            if (vm.isLoading) {
                return (
                    <View style={{ paddingTop: 8 }}>
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
                    <View style={[styles.emptyIconContainer, { backgroundColor: vm.colors.surfaceContainerHigh }]}>
                        <MaterialIcons name="comment" size={32} color={vm.colors.onSurfaceVariant} />
                    </View>
                    <FlexText style={[vm.common.heading, { fontSize: 18, marginTop: 16, marginBottom: 8 }]}>
                        {t('post.commentsSheet.emptyTitle')}
                    </FlexText>
                    <FlexText style={[vm.common.body, { color: vm.colors.onSurfaceVariant, textAlign: 'center' }]}>
                        {t('post.commentsSheet.emptyBody')}
                    </FlexText>
                </View>
            );
        }, [vm.isLoading, vm.colors, vm.common, t]);

        // Modern Input Footer
        const commentInputFooter = (
            <View style={[
                styles.footerContainer,
                {
                    backgroundColor: vm.colors.surfaceContainer,
                    paddingBottom: Math.max(insets.bottom, 12),
                }
            ]}>
                {/* Edit mode banner */}
                {vm.isEditing && (
                    <View style={[
                        styles.editBanner,
                        { backgroundColor: vm.colors.surfaceContainerHigh }
                    ]}>
                        <MaterialIcons name="edit" size={14} color={vm.colors.onSurfaceVariant} style={{ marginRight: 6 }} />
                        <FlexText
                            style={[vm.common.bodySmall, { color: vm.colors.onSurfaceVariant, flex: 1, fontSize: 12 }]}
                            numberOfLines={1}
                        >
                            {t('post.commentsSheet.editingBanner')}
                        </FlexText>
                        <TouchableOpacity
                            onPress={vm.handleCancelEdit}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <MaterialIcons name="close" size={16} color={vm.colors.onSurfaceVariant} />
                        </TouchableOpacity>
                    </View>
                )}

                {/* URL Input */}
                {isKeyboardVisible && vm.showUrlInput && (
                    <View style={[styles.urlInputWrapper, { backgroundColor: vm.colors.tertiaryContainer }]}>
                        <MaterialIcons name="link" size={18} color={vm.colors.onTertiaryContainer} />
                        <TextInput
                            style={[styles.urlInput, { color: vm.colors.onTertiaryContainer }]}
                            placeholder="Enter image URL..."
                            placeholderTextColor={vm.colors.onTertiaryContainer}
                            value={vm.imageUrlInput}
                            onChangeText={vm.setImageUrlInput}
                            autoFocus
                            autoCapitalize="none"
                            keyboardType="url"
                            selectionColor={vm.colors.onTertiaryContainer}
                            onSubmitEditing={vm.handleAddImageUrl}
                        />
                        {vm.imageUrlInput.trim().length > 0 && (
                            <TouchableOpacity onPress={vm.handleAddImageUrl} style={{ marginLeft: 8 }}>
                                <MaterialIcons name="check-circle" size={24} color={vm.colors.onTertiaryContainer} />
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Selected Image Preview */}
                {vm.selectedImageUrl && (
                    <View style={styles.previewContainer}>
                        {EMOJI_ASSETS[vm.selectedImageUrl] ? (
                            <Image source={EMOJI_ASSETS[vm.selectedImageUrl]} style={styles.previewImage} contentFit="contain" />
                        ) : (
                            <Image source={{ uri: vm.selectedImageUrl }} style={styles.previewImage} contentFit="cover" />
                        )}
                        <TouchableOpacity style={styles.previewRemoveButton} onPress={() => vm.setSelectedImageUrl(null)}>
                            <MaterialIcons name="close" size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.inputInnerWrapper}>
                    <TextInput
                        ref={inputRef}
                        style={[styles.input, {
                            backgroundColor: vm.colors.tertiaryContainer,
                            color: vm.colors.onTertiaryContainer,
                        }]}
                        placeholder={vm.isEditing ? t('post.commentsSheet.placeholderEdit') : t('post.commentsSheet.placeholderAdd')}
                        placeholderTextColor={vm.colors.onTertiaryContainer}
                        value={vm.commentText}
                        onChangeText={vm.setCommentText}
                        multiline
                        maxLength={500}
                        autoFocus={vm.isEditing}
                    />
                    {/* Note: since text and image are separated, allow submit if either exists */}
                    {vm.canSubmit && (
                        <Button
                            isIconOnly
                            isDisabled={vm.isActionLoading}
                            onPress={vm.onPrimaryAction}
                            style={{ backgroundColor: vm.colors.primary, width: 44, height: 44, borderRadius: 22, marginBottom: 2 }}
                        >
                            {vm.isActionLoading ? (
                                <Spinner className="md" color={vm.colors.onPrimary} />
                            ) : (

                                !vm.isEditing ? (<Plain2
                                    size={24}
                                    color={vm.colors.onPrimary}
                                />)
                                    : (<PenNewRound
                                        size={24}
                                        color={vm.colors.onPrimary}
                                    />)

                            )}
                        </Button>
                    )}
                </View>

                {/* Toolbar under input when keyboard is visible */}
                {isKeyboardVisible && (
                    <View style={styles.keyboardToolbar}>
                        <TouchableOpacity
                            style={[
                                styles.toolbarButton,
                                { backgroundColor: vm.colors.surfaceContainerHigh },
                                vm.selectedImageUrl ? { opacity: 0.5 } : {}
                            ]}
                            onPress={() => vm.setShowUrlInput(!vm.showUrlInput)}
                            disabled={!!vm.selectedImageUrl}
                        >
                            <GalleryAdd size={24} color={vm.colors.onSurface} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.toolbarButton,
                                { backgroundColor: vm.colors.surfaceContainerHigh },
                                vm.selectedImageUrl ? { opacity: 0.5 } : {}
                            ]}
                            onPress={() => { emojiSheetRef.current?.present(); Keyboard.dismiss(); }}
                            disabled={!!vm.selectedImageUrl}
                        >
                            <MaterialIcons name="emoji-emotions" size={24} color={vm.colors.onSurface} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.toolbarButton,
                                { backgroundColor: vm.colors.surfaceContainerHigh },
                                vm.selectedImageUrl ? { opacity: 0.5 } : {}
                            ]}
                            onPress={() => { GiphyDialog.show() }}
                            disabled={!!vm.selectedImageUrl}
                        >
                            <MaterialIcons name="gif" size={24} color={vm.colors.onSurface} />
                        </TouchableOpacity>

                    </View>
                )}
            </View>
        );

        const sharedProps = {
            ref: sheetRef,
            scrollable: true,
            backgroundColor: vm.colors.surfaceContainer,
            grabberOptions: {
                color: vm.colors.onSurfaceVariant || "#C4C4C4",
                height: 5,
                width: 40,
            },
            cornerRadius: 32,
            detents,
            footer: commentInputFooter,
            onDidPresent: () => {
                isPresentedRef.current = true;
                backHandler.onDidPresent();
            },
            onDidDismiss: () => {
                isPresentedRef.current = false;
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
                <FlatList
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
                    keyboardDismissMode="on-drag"
                    showsVerticalScrollIndicator={false}
                />
            </>
        );

        return (
            <>
                <TrueSheet {...sharedProps}>
                    {sheetContent}
                </TrueSheet>
                <EmojiSelectorSheet
                    ref={emojiSheetRef}
                    theme={vm.theme}
                    colors={vm.colors}
                    onSelect={(emoji) => {
                        vm.setSelectedImageUrl(emoji);
                        emojiSheetRef.current?.dismiss();
                    }}
                    onDismiss={() => {
                        inputRef.current?.focus();
                    }}
                />
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
        paddingHorizontal: 6,
        paddingVertical: 6,
        borderRadius: 999,
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
