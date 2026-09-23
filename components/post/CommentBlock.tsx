import React, { memo, useCallback } from "react";
import { View } from "react-native";
import { Comment } from "../../types/comment";
import { CommentItem } from "./CommentItem";
import { RepliesSection } from "./RepliesSection";

export interface CommentBlockProps {
    item: Comment;
    vm: any;
    t: any;
}

export const CommentBlock = memo(({ item, vm, t }: CommentBlockProps) => {
    const isExpanded = !!vm.expandedCommentIds[item.id];
    const isDeleting = vm.deletingId === item.id;
    const onToggleExpand = useCallback(() => {
        vm.toggleExpandComment(item.id);
    }, [vm.toggleExpandComment, item.id]);

    return (
        <View style={{ marginBottom: 12 }}>
            <CommentItem
                comment={item}
                colors={vm.colors}
                common={vm.common}
                theme={vm.theme}
                onPress={() => vm.handleUserPress(item)}
                onDelete={() => vm.handleDeleteComment(item)}
                onEdit={() => vm.handleEditComment(item)}
                onToggleLike={() => vm.handleToggleCommentLike(item)}
                formatTimeAgo={vm.formatTimeAgo}
                editLabel={t('post.commentsSheet.actionEdit')}
                deleteLabel={t('post.commentsSheet.actionDelete')}
                replyLabel={t('post.commentsSheet.actionReply', 'Reply')}
                isDeleting={isDeleting}
                onReply={() => vm.handleReplyToComment(item)}
            />
            {vm.postId && (
                <RepliesSection
                    postId={vm.postId}
                    parentComment={item}
                    colors={vm.colors}
                    common={vm.common}
                    theme={vm.theme}
                    onUserPress={vm.handleUserPress}
                    onDeleteComment={vm.handleDeleteComment}
                    onEditComment={vm.handleEditComment}
                    onToggleCommentLike={vm.handleToggleCommentLike}
                    onReplyComment={vm.handleReplyToComment}
                    formatTimeAgo={vm.formatTimeAgo}
                    deletingId={vm.deletingId}
                    editLabel={t('post.commentsSheet.actionEdit')}
                    deleteLabel={t('post.commentsSheet.actionDelete')}
                    replyLabel={t('post.commentsSheet.actionReply', 'Reply')}
                    isExpanded={isExpanded}
                    onToggleExpand={onToggleExpand}
                    t={t}
                />
            )}
        </View>
    );
}, (prev, next) => {
    return (
        prev.item.id === next.item.id &&
        prev.item.is_liked === next.item.is_liked &&
        prev.item.like_count === next.item.like_count &&
        prev.item.content === next.item.content &&
        prev.item.text === next.item.text &&
        prev.item.image_url === next.item.image_url &&
        prev.item.reply_count === next.item.reply_count &&
        prev.item.author_reply?.id === next.item.author_reply?.id &&
        prev.item.author_reply?.is_liked === next.item.author_reply?.is_liked &&
        prev.item.author_reply?.like_count === next.item.author_reply?.like_count &&
        prev.vm.theme === next.vm.theme &&
        prev.vm.colors === next.vm.colors &&
        prev.vm.deletingId === next.vm.deletingId &&
        !!prev.vm.expandedCommentIds?.[prev.item.id] === !!next.vm.expandedCommentIds?.[next.item.id]
    );
});

CommentBlock.displayName = "CommentBlock";
