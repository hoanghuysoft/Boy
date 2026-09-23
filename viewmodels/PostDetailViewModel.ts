import { useThemeContext } from "@/context/ThemeContext";
import { usePost } from "@/services/post";
import { useProfile } from "@/services/userprofile";
import { createCommonStyles } from "@/styles/common";
import { Comment } from "@/types/comment";
import { Post } from "@/types/post";
import { LegendListRef } from "@legendapp/list/react-native";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { LayoutChangeEvent, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCommentsSheetViewModel } from "./CommentsSheetViewModel";

export const usePostDetailViewModel = (postId: string) => {
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const insets = useSafeAreaInsets();

    const { data: myProfile } = useProfile('me', true);
    const { data: post, isLoading: isPostLoading, error: postError, refetch: refetchPost } = usePost(postId);

    const optionsSheetRef = useRef<TrueSheet>(null);
    const likersSheetRef = useRef<TrueSheet>(null);
    const emojiSheetRef = useRef<TrueSheet>(null);
    const inputRef = useRef<TextInput>(null);
    const flatListRef = useRef<LegendListRef>(null);
    const commentsRef = useRef<Comment[]>([]);
    const headerHeightRef = useRef<number>(0);

    const [selectedLikePostId, setSelectedLikePostId] = useState<string | null>(null);

    const scrollToComment = useCallback((commentId: string, viewPosition: number = 0.2) => {
        setTimeout(() => {
            const index = commentsRef.current.findIndex(c => c.id === commentId);
            if (index !== -1) {
                try {
                    flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition });
                } catch (e) {
                    console.warn("scrollToIndex failed", e);
                }
            }
        }, 120);
    }, []);

    const scrollToCommentsHeader = useCallback(() => {
        setTimeout(() => {
            if (commentsRef.current.length > 0) {
                try {
                    flatListRef.current?.scrollToIndex({ index: 0, animated: true, viewPosition: 0 });
                } catch {
                    if (headerHeightRef.current > 0) {
                        flatListRef.current?.scrollToOffset({
                            offset: Math.max(0, headerHeightRef.current - 10),
                            animated: true,
                        });
                    }
                }
            } else if (headerHeightRef.current > 0) {
                try {
                    flatListRef.current?.scrollToOffset({
                        offset: Math.max(0, headerHeightRef.current - 10),
                        animated: true,
                    });
                } catch (e) {
                    console.warn("scrollToOffset failed", e);
                }
            }
        }, 120);
    }, []);

    const onCommentReply = useCallback((comment: Comment) => {
        inputRef.current?.focus();
        const targetId = comment.parent_id || comment.id;
        scrollToComment(targetId, 0.2);
    }, [scrollToComment]);

    const onCommentEdit = useCallback((comment: Comment) => {
        inputRef.current?.focus();
        const targetId = comment.parent_id || comment.id;
        scrollToComment(targetId, 0.2);
    }, [scrollToComment]);

    const onCommentSent = useCallback((comment: Comment) => {
        setTimeout(() => {
            if (comment.parent_id) {
                scrollToComment(comment.parent_id, 0.3);
            } else {
                if (commentsRef.current.length > 0) {
                    try {
                        flatListRef.current?.scrollToIndex({ index: 0, animated: true, viewPosition: 0 });
                    } catch {
                        flatListRef.current?.scrollToOffset({
                            offset: Math.max(0, headerHeightRef.current - 10),
                            animated: true,
                        });
                    }
                } else {
                    flatListRef.current?.scrollToOffset({
                        offset: Math.max(0, headerHeightRef.current - 10),
                        animated: true,
                    });
                }
            }
        }, 180);
    }, [scrollToComment]);

    const commentsVm = useCommentsSheetViewModel(
        postId,
        null,
        onCommentSent,
        onCommentReply,
        onCommentEdit
    );

    useEffect(() => {
        commentsRef.current = commentsVm.comments;
    }, [commentsVm.comments]);

    const onHeaderLayout = useCallback((e: LayoutChangeEvent) => {
        headerHeightRef.current = e.nativeEvent.layout.height;
    }, []);

    const handleOptionsPress = useCallback((p?: Post) => {
        optionsSheetRef.current?.present();
    }, []);

    const handleLikeCountPress = useCallback((p: Post) => {
        setSelectedLikePostId(p.id);
        likersSheetRef.current?.present();
    }, []);

    const handleLikersSheetDismiss = useCallback(() => {
        setSelectedLikePostId(null);
    }, []);

    const handlePostDeleted = useCallback(() => {
        router.back();
    }, []);

    const handleCommentIconPress = useCallback(() => {
        inputRef.current?.focus();
        scrollToCommentsHeader();
    }, [scrollToCommentsHeader]);

    const handleInputFocus = useCallback(() => {
        if (headerHeightRef.current > 300) {
            scrollToCommentsHeader();
        }
    }, [scrollToCommentsHeader]);

    return {
        // Theme & styles
        colors,
        typography,
        theme,
        common,
        insets,

        // Post data
        postId,
        post,
        isPostLoading,
        postError,
        refetchPost,
        myProfile,

        // Comments sub-viewmodel
        commentsVm,

        // Refs
        optionsSheetRef,
        likersSheetRef,
        emojiSheetRef,
        inputRef,
        flatListRef,

        // Modals state & handlers
        selectedLikePostId,
        handleOptionsPress,
        handleLikeCountPress,
        handleLikersSheetDismiss,
        handlePostDeleted,
        handleCommentIconPress,
        handleInputFocus,
        onHeaderLayout,
        scrollToComment,
        scrollToCommentsHeader,
    };
};
