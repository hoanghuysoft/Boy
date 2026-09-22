import { Spinner } from "heroui-native/spinner";
import React, { memo, useMemo } from "react";
import {
    StyleSheet,
    TouchableOpacity,
    View
} from "react-native";
import { useReplies } from "../../services/comment";
import { Comment } from "../../types/comment";
import { FlexText } from "../FlexText";
import { CommentItem } from "./CommentItem";

export interface RepliesSectionProps {
    postId: string;
    parentComment: Comment;
    colors: any;
    common: any;
    theme: any;
    onUserPress: (comment: Comment) => void;
    onDeleteComment: (comment: Comment) => void;
    onEditComment: (comment: Comment) => void;
    onToggleCommentLike: (comment: Comment) => void;
    onReplyComment: (comment: Comment) => void;
    formatTimeAgo: (dateString: string) => string;
    deletingId: string | null;
    editLabel: string;
    deleteLabel: string;
    replyLabel: string;
    isExpanded: boolean;
    onToggleExpand: () => void;
    t: any;
}

export const RepliesSection = memo(({
    postId,
    parentComment,
    colors,
    common,
    theme,
    onUserPress,
    onDeleteComment,
    onEditComment,
    onToggleCommentLike,
    onReplyComment,
    formatTimeAgo,
    deletingId,
    editLabel,
    deleteLabel,
    replyLabel,
    isExpanded,
    onToggleExpand,
    t
}: RepliesSectionProps) => {
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = useReplies(isExpanded ? postId : undefined, isExpanded ? parentComment.id : undefined);

    const replies = useMemo(() => {
        if (!data?.pages) return [];
        return data.pages.flatMap(page => page.data);
    }, [data]);

    const replyCount = parentComment.reply_count || 0;
    const authorReply = parentComment.author_reply;
    const prevCount = parentComment.author_reply_prev_count || 0;
    const nextCount = parentComment.author_reply_next_count || 0;

    if (replyCount === 0) return null;

    return (
        <View style={styles.repliesSectionContainer}>
            {!isExpanded ? (
                // Collapsed state: auto-preview author reply if present
                authorReply ? (
                    <View style={{ gap: 4 }}>
                        {prevCount > 0 && (
                            <TouchableOpacity onPress={onToggleExpand} style={styles.expandRepliesButton} activeOpacity={0.7}>
                                <View style={[styles.replyLine, { backgroundColor: colors.outlineVariant || "#e0e0e0" }]} />
                                <FlexText style={[common.bodySmall, { color: colors.primary, fontWeight: '600', fontSize: 13 }]}>
                                    {t('post.commentsSheet.viewPreviousReplies', { count: prevCount, defaultValue: `View ${prevCount} previous replies` })}
                                </FlexText>
                            </TouchableOpacity>
                        )}

                        <View style={{ marginTop: 2, marginBottom: 2 }}>
                            <CommentItem
                                comment={authorReply}
                                colors={colors}
                                common={common}
                                theme={theme}
                                onPress={() => onUserPress(authorReply)}
                                onDelete={() => onDeleteComment(authorReply)}
                                onEdit={() => onEditComment(authorReply)}
                                onToggleLike={() => onToggleCommentLike(authorReply)}
                                formatTimeAgo={formatTimeAgo}
                                editLabel={editLabel}
                                deleteLabel={deleteLabel}
                                replyLabel={replyLabel}
                                isDeleting={deletingId === authorReply.id}
                                isReply
                                onReply={() => onReplyComment(authorReply)}
                            />
                        </View>

                        {nextCount > 0 && (
                            <TouchableOpacity onPress={onToggleExpand} style={styles.expandRepliesButton} activeOpacity={0.7}>
                                <View style={[styles.replyLine, { backgroundColor: colors.outlineVariant || "#e0e0e0" }]} />
                                <FlexText style={[common.bodySmall, { color: colors.primary, fontWeight: '600', fontSize: 13 }]}>
                                    {t('post.commentsSheet.viewNextReplies', { count: nextCount, defaultValue: `View ${nextCount} more replies` })}
                                </FlexText>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <TouchableOpacity onPress={onToggleExpand} style={styles.expandRepliesButton} activeOpacity={0.7}>
                        <View style={[styles.replyLine, { backgroundColor: colors.outlineVariant || "#e0e0e0" }]} />
                        <FlexText style={[common.bodySmall, { color: colors.primary, fontWeight: '600', fontSize: 13 }]}>
                            {t('post.commentsSheet.viewReply', { count: replyCount })}
                        </FlexText>
                    </TouchableOpacity>
                )
            ) : (
                // Expanded state: full list of replies with pagination
                <View>
                    <View style={styles.repliesList}>
                        {replies.map((reply: Comment) => (
                            <CommentItem
                                key={reply.id}
                                comment={reply}
                                colors={colors}
                                common={common}
                                theme={theme}
                                onPress={() => onUserPress(reply)}
                                onDelete={() => onDeleteComment(reply)}
                                onEdit={() => onEditComment(reply)}
                                onToggleLike={() => onToggleCommentLike(reply)}
                                formatTimeAgo={formatTimeAgo}
                                editLabel={editLabel}
                                deleteLabel={deleteLabel}
                                replyLabel={replyLabel}
                                isDeleting={deletingId === reply.id}
                                isReply
                                onReply={() => onReplyComment(reply)}
                            />
                        ))}
                    </View>

                    {isFetchingNextPage || isLoading ? (
                        <View style={styles.repliesLoader}>
                            <Spinner size="md" color={colors.primary} />
                        </View>
                    ) : (
                        hasNextPage && (
                            <TouchableOpacity onPress={() => fetchNextPage()} style={styles.loadMoreRepliesButton} activeOpacity={0.7}>
                                <FlexText style={[common.bodySmall, { color: colors.primary, fontWeight: '600', fontSize: 13, marginLeft: 40 }]}>
                                    {t('post.commentsSheet.loadMoreReplies', 'Load more replies')}
                                </FlexText>
                            </TouchableOpacity>
                        )
                    )}

                    <TouchableOpacity onPress={onToggleExpand} style={styles.expandRepliesButton} activeOpacity={0.7}>
                        <View style={[styles.replyLine, { backgroundColor: colors.outlineVariant || "#e0e0e0" }]} />
                        <FlexText style={[common.bodySmall, { color: colors.primary, fontWeight: '600', fontSize: 13 }]}>
                            {t('post.commentsSheet.hideReplies', 'Hide replies')}
                        </FlexText>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
});

RepliesSection.displayName = "RepliesSection";

const styles = StyleSheet.create({
    repliesSectionContainer: {
        marginLeft: 50,
        marginBottom: 12,
    },
    expandRepliesButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 4,
    },
    replyLine: {
        width: 16,
        height: 1,
        marginRight: 8,
    },
    repliesList: {
        marginTop: 4,
    },
    repliesLoader: {
        paddingVertical: 8,
        alignItems: 'center',
    },
    loadMoreRepliesButton: {
        paddingVertical: 6,
    },
});
