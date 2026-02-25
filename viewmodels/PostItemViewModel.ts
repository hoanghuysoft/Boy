import { Post } from "@/types/post";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useThemeContext } from "../context/ThemeContext";
import { useToggleLike } from "../services/like";
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
    const router = useRouter();
    const params = useLocalSearchParams();
    const currentProfileId = Array.isArray(params.id) ? params.id[0] : params.id;
    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);

    // ─── Like State (optimistic) ────────────────────────────────
    const [isLiked, setIsLiked] = useState(post.is_liked);
    const [likeCount, setLikeCount] = useState(post.like_count);
    const toggleLikeMutation = useToggleLike();

    // Sync with server data when post prop changes (including cell recycling)
    useEffect(() => {
        setIsLiked(post.is_liked);
        setLikeCount(post.like_count);
    }, [post.id, post.is_liked, post.like_count]);

    const handleLikePress = useCallback(() => {
        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikeCount((prev: number) => newIsLiked ? prev + 1 : Math.max(0, prev - 1));

        toggleLikeMutation.mutate(
            { postId: post.id, isLiked },
            {
                onError: () => {
                    setIsLiked(isLiked);
                    setLikeCount(post.like_count);
                },
            }
        );
    }, [isLiked, post.id, post.like_count, toggleLikeMutation]);

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
            params: { id: post.profile_id },
        });
    }, [currentProfileId, post.profile_id, router]);

    // ─── Music ──────────────────────────────────────────────────
    const { currentlyPlayingId, playTrack, stopPlayback } = useAudioStore();
    const isPlaying = currentlyPlayingId === post.id;

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

        // Derived
        hasMedia,
        hasMusic,

        // Post data
        post,
    };
};
