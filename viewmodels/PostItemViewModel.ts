import { Post } from "@/types/post";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import i18n from "../i18n";
import { useToast } from "heroui-native/toast";
import { useCallback, useState } from "react";
import { Clipboard } from "react-native";
import { useThemeContext } from "../context/ThemeContext";
import { useToggleBookmark } from "../services/bookmark";
import { useToggleLike } from "../services/like";
import { createPost, sharePost } from "../services/post";
import { useAudioStore } from "../stores/audio";
import { createCommonStyles } from "../styles/common";

interface UsePostItemViewModelProps {
    post: Post;
    onOptionsPress?: (post: Post) => void;
    onLikeCountPress?: (post: Post) => void;
    onCommentPress?: (post: Post) => void;
}

export const usePostItemViewModel = ({
    post,
    onOptionsPress,
    onLikeCountPress,
    onCommentPress,
}: UsePostItemViewModelProps) => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const t = i18n.t.bind(i18n);

    const router = useRouter();
    const params = useLocalSearchParams();
    const currentProfileId = Array.isArray(params.id) ? params.id[0] : params.id;
    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);

    // ─── Optimistic State (avoids double render on recycle) ─────
    // FlashList recycles cells. By keeping optimistic overrides in a dictionary,
    // we naturally fall back to `post.is_liked` when recycled without calling `setState` during render!
    const [overrides, setOverrides] = useState<Record<string, { isLiked: boolean, likeCount: number, isBookmarked: boolean }>>({});

    const currentOverride = overrides[post.id];
    const isLiked = currentOverride ? currentOverride.isLiked : post.is_liked;
    const likeCount = currentOverride ? currentOverride.likeCount : post.like_count;
    const isBookmarked = currentOverride ? currentOverride.isBookmarked : !!post.is_bookmarked;

    const toggleLikeMutation = useToggleLike();
    const toggleBookmarkMutation = useToggleBookmark();

    const handleLikePress = useCallback(() => {
        const newIsLiked = !isLiked;
        const newLikeCount = newIsLiked ? likeCount + 1 : Math.max(0, likeCount - 1);

        setOverrides(prev => ({
            ...prev,
            [post.id]: { isLiked: newIsLiked, likeCount: newLikeCount, isBookmarked }
        }));

        toggleLikeMutation.mutate(
            { postId: post.id, isLiked },
            {
                onError: () => {
                    // Revert on error
                    setOverrides(prev => ({
                        ...prev,
                        [post.id]: { isLiked, likeCount, isBookmarked }
                    }));
                },
            }
        );
    }, [isLiked, likeCount, isBookmarked, post.id, toggleLikeMutation]);

    const handleLikeCountPress = useCallback(() => {
        onLikeCountPress?.(post);
    }, [onLikeCountPress, post]);

    const handleCommentPress = useCallback(() => {
        onCommentPress?.(post);
    }, [onCommentPress, post]);

    // ─── Profile Navigation ─────────────────────────────────────
    const handleProfilePress = useCallback(() => {
        if (currentProfileId && String(currentProfileId) === String(post.profile_id)) return;
        router.push({
            pathname: '/profile/[id]',
            params: {
                id: post.profile_id,
                ...(post.profile_avatar ? { avatar: post.profile_avatar } : {}),
            },
        });
    }, [currentProfileId, post.profile_id, post.profile_avatar, router]);

    // ─── Music ──────────────────────────────────────────────────
    const isPlaying = useAudioStore(s => s.currentlyPlayingId === post.id);
    const playTrack = useAudioStore(s => s.playTrack);
    const stopPlayback = useAudioStore(s => s.stopPlayback);

    const toggleMusic = useCallback(() => {
        if (!post.music?.preview_url) return;
        if (isPlaying) {
            stopPlayback();
        } else {
            playTrack(post.id, post.music.preview_url, {
                title: post.music.title,
                artist: post.music.artist,
                coverUrl: post.music.cover_url,
            });
        }
    }, [isPlaying, post.id, post.music, playTrack, stopPlayback]);

    // ─── Options ────────────────────────────────────────────────
    const handleOptionsPress = useCallback(() => {
        onOptionsPress?.(post);
    }, [onOptionsPress, post]);

    const handleBookmarkPress = useCallback(() => {
        const newIsBookmarked = !isBookmarked;

        setOverrides(prev => ({
            ...prev,
            [post.id]: { isLiked, likeCount, isBookmarked: newIsBookmarked }
        }));

        toggleBookmarkMutation.mutate(
            { postId: post.id, isBookmarked: isBookmarked },
            {
                onError: () => {
                    setOverrides(prev => ({
                        ...prev,
                        [post.id]: { isLiked, likeCount, isBookmarked }
                    }));
                },
            }
        );
    }, [isLiked, likeCount, isBookmarked, post.id, toggleBookmarkMutation]);

    // ─── Share / Repost ─────────────────────────────────────────
    // PERF: Removed useProfile('me'), useSharePost(), useCreatePost(),
    // useTranslation(), and useToast() from this per-cell ViewModel.
    // These hooks were creating TanStack Query observers and mutation
    // subscriptions in EVERY post cell, which accumulated as the user
    // scrolled and caused progressive lag. Instead, we use queryClient
    // to read cached profile data on-demand when the user taps share.

    interface DialogButton {
        text: string;
        onPress: () => void;
        variant?: "primary" | "secondary" | "tertiary" | "danger" | "danger-soft" | "ghost" | "outline";
    }

    interface DialogConfig {
        title: string;
        text: string;
        confirmText?: string;
        dismissText?: string;
        onConfirm?: () => void;
        isDestructive?: boolean;
        buttons?: DialogButton[];
    }

    const [dialog, setDialog] = useState<DialogConfig | null>(null);
    const closeDialog = useCallback(() => setDialog(null), []);

    const handleCopyLink = useCallback(() => {
        const serverUrl = process.env.EXPO_PUBLIC_SERVER_URL || "https://welove.com";
        Clipboard.setString(`${serverUrl}/posts/${post.id}`);
    }, [post.id]);

    const handleDirectRepost = useCallback(async () => {
        // Read cached profile without subscribing to query updates
        const myProfile = queryClient.getQueryData<any>(['profile', 'me']);
        if (!myProfile?.id) return;

        try {
            const repostContent = `<post id="${post.id}" />`;
            await createPost(myProfile.id, {
                content: repostContent,
                device: "Mobile Repost",
            });
            sharePost(post.id);
            queryClient.invalidateQueries({ queryKey: ['feed'] });
            toast.show({ label: t('post.dialogs.successTitle', 'Success'), description: t('post.dialogs.repostSuccess', 'Reposted successfully!'), variant: "success" });
        } catch (error: any) {
            console.error("Repost failed", error);
            toast.show({ label: t('post.dialogs.errorTitle', 'Error'), description: error.message || t('post.dialogs.repostFailed', 'Failed to repost.'), variant: "danger" });
        }
    }, [post.id, queryClient, toast, t]);

    const handleQuoteRepost = useCallback(() => {
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
    }, [post.id, post.profile_name, post.content, post.deezer_id, post.links, post.media, router]);

    const handleSharePress = useCallback(() => {
        setDialog({
            title: "Share",
            text: "Choose how to share this post",
            buttons: [
                {
                    text: "Repost",
                    onPress: () => {
                        closeDialog();
                        handleDirectRepost();
                    },
                    variant: "primary"
                },
                {
                    text: "Quote",
                    onPress: () => {
                        closeDialog();
                        handleQuoteRepost();
                    },
                    variant: "outline"
                }
            ]
        });
    }, [handleDirectRepost, handleQuoteRepost, closeDialog]);

    // ─── Derived ────────────────────────────────────────────────
    const hasMedia = post.media && post.media.length > 0;
    const hasMusic = !!post.music?.preview_url;

    return {
        // Theme
        colors,
        common,

        // Like
        isLiked,
        likeCount,
        handleLikePress,
        handleLikeCountPress,
        handleCommentPress,

        // Profile
        handleProfilePress,

        // Music
        isPlaying,
        toggleMusic,

        // Options
        handleOptionsPress,

        // Bookmark
        isBookmarked,
        handleBookmarkPress,

        // Share / Repost
        handleSharePress,
        handleCopyLink,
        dialog,
        closeDialog,

        // Derived
        hasMedia,
        hasMusic,

        // Post data
        post,
    };
};



