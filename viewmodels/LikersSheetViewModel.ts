import { useRouter } from "expo-router";
import { RefObject, useCallback, useEffect, useMemo } from "react";
import { useThemeContext } from "../context/ThemeContext";
import { useLikers } from "../services/like";
import { createCommonStyles } from "../styles/common";
import type { LikersSheetHandle } from "../types/sheetHandles";
import { LikeUser } from "../types/like";

export const useLikersSheetViewModel = (
    postId: string | null,
    ref: RefObject<LikersSheetHandle | null>
) => {
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const router = useRouter();

    const {
        data,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
    } = useLikers(postId || undefined);

    // Flatten pages into a single array of likers
    const likers = useMemo(() => {
        if (!data?.pages) return [];
        return data.pages.flatMap(page => page.data);
    }, [data?.pages]);

    const totalLikes = data?.pages?.[0]?.pagination?.total ?? 0;

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

    const handleUserPress = useCallback((user: LikeUser) => {
        if (ref?.current) {
            ref.current.dismiss();
        }
        if (user.profile_id) {
            router.push({
                pathname: '/profile/[id]',
                params: { id: user.profile_id },
            });
        }
    }, [ref, router]);

    return {
        // Theme
        colors,
        common,
        theme,

        // Data
        likers,
        totalLikes,
        isLoading,
        isFetchingNextPage,

        // Handlers
        handleEndReached,
        handleUserPress,
    };
};
