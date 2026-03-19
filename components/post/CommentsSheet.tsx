import VerifiedIcon from "@/icons/verified";
import FastImage from "@d11/react-native-fast-image";
import { MaterialIcons } from "@expo/vector-icons";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { ReanimatedTrueSheet } from "@lodev09/react-native-true-sheet/reanimated";
import React, { forwardRef, memo, useCallback } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Comment } from "../../types/comment";
import { useCommentsSheetViewModel } from "../../viewmodels/CommentsSheetViewModel";
import { FlexText } from "../FlexText";

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
}

// ============================================================================
// CommentItem Component
// ============================================================================

const CommentItem = memo(({ comment, colors, common, theme, isOwn, onPress, onDelete, onEdit, formatTimeAgo }: CommentItemProps) => (
    <View style={styles.commentItem}>
        {/* Avatar */}
        <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.avatarContainer}>
            <FastImage
                source={{ uri: comment.profile_avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png" }}
                style={[styles.avatar, { backgroundColor: colors.divider }]}
                resizeMode={FastImage.resizeMode.cover}
            />
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
                <FlexText style={[common.body, { fontSize: 14, marginTop: 4, lineHeight: 20 }]}>
                    {comment.content}
                </FlexText>
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
                                Edit
                            </FlexText>
                        </TouchableOpacity>
                        <FlexText style={{ color: colors.muted, fontSize: 12, marginHorizontal: 4 }}>•</FlexText>
                        <TouchableOpacity
                            onPress={onDelete}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={styles.actionButton}
                        >
                            <FlexText style={{ color: colors.muted, fontSize: 13, fontWeight: '700' }}>
                                Delete
                            </FlexText>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    </View>
));

CommentItem.displayName = "CommentItem";

// ============================================================================
// CommentsSheet Component
// ============================================================================

export const CommentsSheet = memo(forwardRef<TrueSheet, CommentsSheetProps>(
    ({ postId, onDismiss, useReanimated = false, detents = [0.7] }, ref) => {
        const insets = useSafeAreaInsets();
        const vm = useCommentsSheetViewModel(postId, ref as React.RefObject<TrueSheet | null>);

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
            />
        ), [vm.colors, vm.common, vm.theme, vm.currentProfileId, vm.handleUserPress, vm.handleDeleteComment, vm.handleEditComment, vm.formatTimeAgo]);

        const renderListFooter = useCallback(() => {
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
                        <ActivityIndicator size="large" color={vm.colors.text} />
                    </View>
                );
            }
            return (
                <View style={styles.emptyState}>
                    <View style={[styles.emptyIconContainer, { backgroundColor: vm.theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                        <MaterialIcons name="comment" size={32} color={vm.colors.muted} />
                    </View>
                    <FlexText style={[vm.common.heading, { fontSize: 18, marginTop: 16, marginBottom: 8 }]}>
                        No comments yet
                    </FlexText>
                    <FlexText style={[vm.common.body, { color: vm.colors.muted, textAlign: 'center' }]}>
                        Start the conversation and be the first to comment!
                    </FlexText>
                </View>
            );
        }, [vm.isLoading, vm.colors, vm.common, vm.theme]);

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
                            Editing comment
                        </FlexText>
                        <TouchableOpacity
                            onPress={vm.handleCancelEdit}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <MaterialIcons name="close" size={16} color={vm.colors.muted} />
                        </TouchableOpacity>
                    </View>
                )}
                <View style={styles.inputInnerWrapper}>
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: vm.theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                            color: vm.colors.text,
                        }]}
                        placeholder={vm.isEditing ? "Edit your comment..." : "Add a comment..."}
                        placeholderTextColor={vm.colors.muted}
                        value={vm.commentText}
                        onChangeText={vm.setCommentText}
                        multiline
                        maxLength={500}
                        selectionColor={vm.colors.text}
                        autoFocus={vm.isEditing}
                    />
                    {vm.commentText.trim().length > 0 && (
                        <TouchableOpacity
                            onPress={vm.isEditing ? vm.handleSaveEdit : vm.handleSubmitComment}
                            disabled={vm.isEditing ? vm.isSaving : vm.isSubmitting}
                            style={styles.sendButton}
                        >
                            <View style={[styles.sendButtonBackground, { backgroundColor: vm.colors.text }]}>
                                {(vm.isEditing ? vm.isSaving : vm.isSubmitting) ? (
                                    <ActivityIndicator size="small" color={vm.colors.background} />
                                ) : (
                                    <FlexText style={[styles.sendButtonText, { color: vm.colors.background }]}>
                                        {vm.isEditing ? 'Save' : 'Post'}
                                    </FlexText>
                                )}
                            </View>
                        </TouchableOpacity>
                    )}
                </View>
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
            cornerRadius: 24,
            detents,
            footer: commentInputFooter,
            onDidDismiss: onDismiss,
        };

        const sheetContent = (
            <>
                {/* Header */}
                <View style={styles.header}>
                    <FlexText style={[vm.common.heading, { fontSize: 20 }]}>Comments</FlexText>
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
                    showsVerticalScrollIndicator={false}
                />
            </>
        );

        if (useReanimated) {
            return (
                <ReanimatedTrueSheet dimmed={false} {...sharedProps}>
                    {sheetContent}
                </ReanimatedTrueSheet>
            );
        }

        return (
            <TrueSheet {...sharedProps}>
                {sheetContent}
            </TrueSheet>
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
});
