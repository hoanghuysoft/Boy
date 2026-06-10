import { TrueSheet } from "@lodev09/react-native-true-sheet";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useRouter } from "expo-router";
import { RefObject, useCallback, useEffect, useMemo, useState } from "react";
import { Keyboard, Alert } from "react-native";
import { useThemeContext } from "../context/ThemeContext";
import { useComments, useCreateComment, useDeleteComment, useUpdateComment } from "../services/comment";
import { useProfile } from "../services/userprofile";
import { createCommonStyles } from "../styles/common";
import { Comment } from "../types/comment";

dayjs.extend(relativeTime);

const IMG_PATTERN = /\[<img\s+(.*?)\s*\/>\]/gi;
export function parseCommentContent(content: string): { text: string; imageUrl: string | null } {
    const matches = [...content.matchAll(IMG_PATTERN)];
    const imageUrl = matches.length > 0 ? matches[0][1] : null;
    const text = content.replace(IMG_PATTERN, '').trim();
    return { text, imageUrl };
}

export const useCommentsSheetViewModel = (
    postId: string | null,
    ref: RefObject<TrueSheet | null>
) => {
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const router = useRouter();

    const [commentText, setCommentText] = useState("");
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
    const [imageUrlInput, setImageUrlInput] = useState("");
    const [showUrlInput, setShowUrlInput] = useState(false);
    
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

    const pages = data?.pages;

    // Flatten pages into a single array of comments
    const comments = useMemo(() => {
        if (!pages) return [];
        return pages.flatMap(page => page.data);
    }, [pages]);

    const totalComments = pages?.[0]?.pagination?.total ?? 0;

    const [prevPostId, setPrevPostId] = useState<string | null>(postId);

    if (postId !== prevPostId) {
        setPrevPostId(postId);
        setCommentText("");
        setSelectedImageUrl(null);
        setEditingComment(null);
    }

    // When postId changes, trigger refetch for the new post
    useEffect(() => {
        if (postId) {
            refetch();
        }
    }, [postId, refetch]);

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
        const payloadContent = selectedImageUrl ? (trimmed ? trimmed + '\n' : '') + `[<img ${selectedImageUrl} />]` : trimmed;
        if (!payloadContent || !postId || isLocalSubmitting || createCommentMutation.isPending) return;

        setIsLocalSubmitting(true);
        createCommentMutation.mutate(
            { content: payloadContent },
            {
                onSuccess: () => {
                    setCommentText("");
                    setSelectedImageUrl(null);
                    Keyboard.dismiss();
                    setIsLocalSubmitting(false);
                },
                onError: () => {
                    setIsLocalSubmitting(false);
                }
            }
        );
    }, [commentText, selectedImageUrl, postId, createCommentMutation, isLocalSubmitting]);

    const isSubmitting = createCommentMutation.isPending || isLocalSubmitting;

    const handleDeleteComment = useCallback((comment: Comment) => {
        if (deletingId === comment.id || deleteCommentMutation.isPending) return;
        
        Alert.alert(
            "Delete Comment",
            "Are you sure you want to delete this comment?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        setDeletingId(comment.id);
                        deleteCommentMutation.mutate(comment.id, {
                            onSettled: () => {
                                setDeletingId(null);
                            }
                        });
                    }
                }
            ]
        );
    }, [deleteCommentMutation, deletingId]);

    // Start editing a comment — pre-fill the input with its current content
    const handleEditComment = useCallback((comment: Comment) => {
        const parsed = parseCommentContent(comment.content);
        setEditingComment(comment);
        setCommentText(parsed.text);
        setSelectedImageUrl(parsed.imageUrl);
    }, []);

    // Cancel editing and reset the input
    const handleCancelEdit = useCallback(() => {
        setEditingComment(null);
        setCommentText("");
        setSelectedImageUrl(null);
        Keyboard.dismiss();
    }, []);

    // Save the edited comment
    const handleSaveEdit = useCallback(() => {
        const trimmed = commentText.trim();
        const payloadContent = selectedImageUrl ? (trimmed ? trimmed + '\n' : '') + `[<img ${selectedImageUrl} />]` : trimmed;
        if (!payloadContent || !editingComment) return;

        updateCommentMutation.mutate(
            { commentId: editingComment.id, data: { content: payloadContent } },
            {
                onSuccess: () => {
                    setEditingComment(null);
                    setCommentText("");
                    setSelectedImageUrl(null);
                    Keyboard.dismiss();
                },
            }
        );
    }, [commentText, selectedImageUrl, editingComment, updateCommentMutation]);

    const handleAddImageUrl = useCallback(() => {
        if (imageUrlInput.trim()) {
            setSelectedImageUrl(imageUrlInput.trim());
            setImageUrlInput("");
            setShowUrlInput(false);
        }
    }, [imageUrlInput]);

    const isEditing = editingComment !== null;
    const isSaving = updateCommentMutation.isPending;
    
    // Unified Action Handlers (MVVM)
    const canSubmit = useMemo(() => {
        return commentText.trim().length > 0 || selectedImageUrl !== null;
    }, [commentText, selectedImageUrl]);

    const isActionLoading = useMemo(() => {
        return isEditing ? isSaving : isSubmitting;
    }, [isEditing, isSaving, isSubmitting]);

    const onPrimaryAction = useCallback(() => {
        if (isEditing) {
            handleSaveEdit();
        } else {
            handleSubmitComment();
        }
    }, [isEditing, handleSaveEdit, handleSubmitComment]);

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

        // Input states
        commentText,
        setCommentText,
        selectedImageUrl,
        setSelectedImageUrl,
        imageUrlInput,
        setImageUrlInput,
        showUrlInput,
        setShowUrlInput,
        
        // Computed & actions
        canSubmit,
        isActionLoading,
        onPrimaryAction,
        handleAddImageUrl,

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
        
        // Delete Dialog
        // Replaced by native Alert

    };
};
