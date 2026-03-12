import { useHashtagPosts } from '@/services/hashtag';
import { Post } from '@/types/post';
import { useCallback, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const useHashtagPostsViewModel = (tag: string) => {
    const insets = useSafeAreaInsets();

    const {
        data,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
        isRefetching,
    } = useHashtagPosts(tag);

    const posts = useMemo((): Post[] => {
        if (!data?.pages) return [];
        return data.pages.flatMap((page) => page.data);
    }, [data?.pages]);

    const totalCount = useMemo(() => {
        if (!data?.pages?.length) return 0;
        return data.pages[0].pagination.total;
    }, [data?.pages]);

    const hashtagLabel = useMemo(() => {
        if (!data?.pages?.length) return tag;
        return data.pages[0].hashtag?.tag ?? tag;
    }, [data?.pages, tag]);

    const handleEndReached = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    return {
        posts,
        totalCount,
        hashtagLabel,
        isLoading,
        isRefetching,
        isFetchingNextPage,
        insets,
        handleEndReached,
        refetch,
    };
};
