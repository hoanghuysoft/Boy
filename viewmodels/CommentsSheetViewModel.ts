import { TrueSheet } from "@lodev09/react-native-true-sheet";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useRouter } from "expo-router";
import { RefObject, useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Keyboard } from "react-native";
import { useThemeContext } from "../context/ThemeContext";
import { useComments, useCreateComment, useDeleteComment } from "../services/comment";
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
        if (!trimmed || !postId) return;

        createCommentMutation.mutate(
            { content: trimmed },
            {
                onSuccess: () => {
                    setCommentText("");
                    Keyboard.dismiss();
                },
            }
        );
    }, [commentText, postId, createCommentMutation]);

    const isSubmitting = createCommentMutation.isPending;

    const handleDeleteComment = useCallback((comment: Comment) => {
        Alert.alert(
            'Delete Comment',
            'Are you sure you want to delete this comment?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        deleteCommentMutation.mutate(comment.id);
                    },
                },
            ]
        );
    }, [deleteCommentMutation]);

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

        // Handlers
        handleEndReached,
        handleUserPress,
        handleSubmitComment,
        handleDeleteComment,
        formatTimeAgo,
    };
};
