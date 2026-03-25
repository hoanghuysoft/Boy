import { TrueSheet } from "@lodev09/react-native-true-sheet";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useRouter } from "expo-router";
import { RefObject, useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Keyboard } from "react-native";
import { useThemeContext } from "../context/ThemeContext";
import { useComments, useCreateComment, useDeleteComment, useUpdateComment } from "../services/comment";
import { useProfile } from "../services/userprofile";
import { createCommonStyles } from "../styles/common";
import { Comment } from "../types/comment";

dayjs.extend(relativeTime);

export const useCommentsSheetViewModel = (
    postId: string | null,
    ref: RefObject<TrueSheet | null>
) => {
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const router = useRouter();

    const [commentText, setCommentText] = useState("");
    const [editingComment, setEditingComment] = useState<Comment | null>(null);
    const [isLocalSubmitting, setIsLocalSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const { data: myProfile } = useProfile('me', true);
    const currentProfileId = myProfile?.id || null;

    const {
        data,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
    } = useComments(postId || undefined);

    const createCommentMutation = useCreateComment(postId || "");
    const deleteCommentMutation = useDeleteComment(postId || "");
    const updateCommentMutation = useUpdateComment(postId || "");

    // Flatten pages into a single array of comments
    const comments = useMemo(() => {
        if (!data?.pages) return [];
        return data.pages.flatMap(page => page.data);
    }, [data?.pages]);

    const totalComments = data?.pages?.[0]?.pagination?.total ?? 0;

    // Refetch when postId changes
    useEffect(() => {
        if (postId) {
            refetch();
        }
    }, [postId]);

    const handleEndReached = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const handleUserPress = useCallback((comment: Comment) => {
        if (ref?.current) {
            ref.current.dismiss();
        }
        if (comment.profile_id) {
            router.push({
                pathname: '/profile/[id]',
                params: { id: comment.profile_id },
            });
        }
    }, [ref, router]);

    const handleSubmitComment = useCallback(() => {
        const trimmed = commentText.trim();
        if (!trimmed || !postId || isLocalSubmitting || createCommentMutation.isPending) return;

        setIsLocalSubmitting(true);
        createCommentMutation.mutate(
            { content: trimmed },
            {
                onSuccess: () => {
                    setCommentText("");
                    Keyboard.dismiss();
                    setIsLocalSubmitting(false);
                },
                onError: () => {
                    setIsLocalSubmitting(false);
                }
            }
        );
    }, [commentText, postId, createCommentMutation, isLocalSubmitting]);

    const isSubmitting = createCommentMutation.isPending || isLocalSubmitting;

    const handleDeleteComment = useCallback((comment: Comment) => {
        if (deletingId === comment.id || deleteCommentMutation.isPending) return;
        
        Alert.alert(
            'Delete Comment',
            'Are you sure you want to delete this comment?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        setDeletingId(comment.id);
                        deleteCommentMutation.mutate(comment.id, {
                            onSettled: () => {
                                setDeletingId(null);
                            }
                        });
                    },
                },
            ]
        );
    }, [deleteCommentMutation, deletingId]);

    // Start editing a comment — pre-fill the input with its current content
    const handleEditComment = useCallback((comment: Comment) => {
        setEditingComment(comment);
        setCommentText(comment.content);
    }, []);

    // Cancel editing and reset the input
    const handleCancelEdit = useCallback(() => {
        setEditingComment(null);
        setCommentText("");
        Keyboard.dismiss();
    }, []);

    // Save the edited comment
    const handleSaveEdit = useCallback(() => {
        const trimmed = commentText.trim();
        if (!trimmed || !editingComment) return;

        updateCommentMutation.mutate(
            { commentId: editingComment.id, data: { content: trimmed } },
            {
                onSuccess: () => {
                    setEditingComment(null);
                    setCommentText("");
                    Keyboard.dismiss();
                },
            }
        );
    }, [commentText, editingComment, updateCommentMutation]);

    const isEditing = editingComment !== null;
    const isSaving = updateCommentMutation.isPending;

    // Format relative time
    const formatTimeAgo = useCallback((dateString: string) => {
        return dayjs(dateString).fromNow();
    }, []);

    return {
        // Theme
        colors,
        common,
        theme,

        // Data
        comments,
        totalComments,
        isLoading,
        isFetchingNextPage,
        currentProfileId,

        // Input
        commentText,
        setCommentText,
        isSubmitting,

        // Edit state
        editingComment,
        isEditing,
        isSaving,
        deletingId,

        // Handlers
        handleEndReached,
        handleUserPress,
        handleSubmitComment,
        handleDeleteComment,
        handleEditComment,
        handleCancelEdit,
        handleSaveEdit,
        formatTimeAgo,
    };
};
