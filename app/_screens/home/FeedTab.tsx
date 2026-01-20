import { queryClient } from "@/services/client";
import { useFeed } from "@/services/feed";
import { Post } from "@/types/post";
import { FlashList as FlashListOriginal } from "@shopify/flash-list";
import { uniqBy } from "lodash";
import React, { useCallback, useEffect, useRef } from "react";
import { RefreshControl, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PostItem } from "../../../components/PostItem";
import { ShimmerEffect } from "../../../components/shimmer/Shimmer";
import { useThemeContext } from "../../../context/ThemeContext";
import { useScrollStore } from "../../../stores/scroll";
import { createCommonStyles } from "../../../styles/common";

const FlashList = FlashListOriginal as any;

interface FeedTabProps {
    feedType: "latest" | "lucky" | "this_day";
    onScroll?: (event: any) => void;
    onOptionsPress: (post: Post) => void;
    headerHeight: number;
}

const FeedTab: React.FC<FeedTabProps> = ({
    feedType,
    onScroll,
    onOptionsPress,
    headerHeight,
}) => {
    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const insets = useSafeAreaInsets();

    const {
        data,
        isLoading,
        isRefetching,
        refetch,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useFeed(feedType);

    const posts = React.useMemo(() => {
        const allPosts = data?.pages.flatMap(page => page.data) || [];
        return uniqBy(allPosts, 'id');
    }, [data?.pages]);

    const bottomNavHeight = 67;
    const bottomNavMargin = 13;
    const extraPadding = 20;
    const bottomPadding = bottomNavHeight + bottomNavMargin + insets.bottom + extraPadding;

    const listRef = useRef<any>(null);
    const trigger = useScrollStore((state) => state.triggers['index']);

    useEffect(() => {
        if (trigger > 0 && listRef.current) {
            listRef.current.scrollToOffset({ offset: 0, animated: true });
        }
    }, [trigger]);

    const handleRefresh = async () => {
        queryClient.removeQueries({ queryKey: ['feed', feedType] });
        refetch();
    };

    const renderPostSkeleton = () => {
        return (
            <View style={{ marginTop: 20 }}>
                <View style={[common.row, { gap: 10, marginBottom: 12, paddingHorizontal: 16 }]}>
                    <ShimmerEffect
                        isLoading={true}
                        style={{ width: 30, height: 30, borderRadius: 100, backgroundColor: colors.divider }}
                    />
                    <ShimmerEffect
                        isLoading={true}
                        style={{ width: 120, height: 16, borderRadius: 8, backgroundColor: colors.divider }}
                    />
                </View>
                <View style={{ gap: 8, marginBottom: 12, paddingHorizontal: 16 }}>
                    <ShimmerEffect
                        isLoading={true}
                        style={{ width: '100%', height: 14, borderRadius: 6, backgroundColor: colors.divider }}
                    />
                    <ShimmerEffect
                        isLoading={true}
                        style={{ width: '80%', height: 14, borderRadius: 6, backgroundColor: colors.divider }}
                    />
                </View>
                <ShimmerEffect
                    isLoading={true}
                    style={{ width: "100%", height: 200, backgroundColor: colors.divider }}
                />
            </View>
        );
    };

    const renderEmptyState = () => {
        const emptyMessages: Record<string, string> = {
            latest: "Follow some people to see their posts",
            lucky: "No lucky posts yet",
            this_day: "No posts from this day"
        };

        return (
            <View style={styles.emptyState}>
                <Text style={[common.heading, { color: colors.muted, textAlign: 'center' }]}>
                    No posts yet
                </Text>
                <Text style={[common.label, { color: colors.muted, textAlign: 'center', marginTop: 8 }]}>
                    {emptyMessages[feedType]}
                </Text>
            </View>
        );
    };

    const renderPost = useCallback((post: Post) => {
        return <PostItem key={post.id} post={post} onOptionsPress={onOptionsPress} />;
    }, [onOptionsPress]);

    if (isLoading) {
        return (
            <FlashList
                data={[1, 2, 3]}
                renderItem={() => renderPostSkeleton()}
                keyExtractor={(item: number) => item.toString()}
                contentContainerStyle={{ paddingBottom: bottomPadding, paddingTop: headerHeight + 10 }}
                estimatedItemSize={300}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />
        );
    }

    return (
        <FlashList
            ref={listRef}
            onScroll={onScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            data={posts}
            ListEmptyComponent={renderEmptyState}
            renderItem={({ item }: { item: Post }) => renderPost(item)}
            keyExtractor={(item: Post) => item.id.toString()}
            contentContainerStyle={{ paddingBottom: bottomPadding, paddingTop: headerHeight + 10 }}
            refreshControl={
                <RefreshControl
                    refreshing={isRefetching}
                    onRefresh={handleRefresh}
                    tintColor={colors.text}
                    colors={[colors.text]}
                    progressBackgroundColor={colors.card}
                />
            }
            onEndReached={() => {
                if (hasNextPage) fetchNextPage();
            }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={isFetchingNextPage ? renderPostSkeleton() : null}
            estimatedItemSize={300}
            ItemSeparatorComponent={() => <View style={{ height: 30 }} />}
        />
    );
};

export default FeedTab;

const styles = StyleSheet.create({
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 24,
    },
});
