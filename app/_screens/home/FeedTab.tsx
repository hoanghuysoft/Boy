import { queryClient } from "@/services/client";
import { useFeed } from "@/services/feed";
import { Post } from "@/types/post";
import { uniqBy } from "lodash";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dimensions, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DataProvider, LayoutProvider, RecyclerListView } from "recyclerlistview";
import { PostItem } from "../../../components/PostItem";
import { ShimmerEffect } from "../../../components/shimmer/Shimmer";
import { useThemeContext } from "../../../context/ThemeContext";
import { useScrollStore } from "../../../stores/scroll";
import { createCommonStyles } from "../../../styles/common";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// View types for RecyclerListView
const ViewTypes = {
    POST: 0,
    LOADING: 1,
};

// Estimated post height (will be adjusted with forceNonDeterministicRendering)
const ESTIMATED_POST_HEIGHT = 500;

interface FeedTabProps {
    feedType: "latest" | "lucky" | "this_day";
    onScroll?: (event: any) => void;
    onOptionsPress: (post: Post) => void;
    onLikeCountPress?: (post: Post) => void;
    headerHeight: number;
}

const FeedTab: React.FC<FeedTabProps> = ({
    feedType,
    onScroll,
    onOptionsPress,
    onLikeCountPress,
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

    const posts = useMemo(() => {
        const allPosts = data?.pages.flatMap(page => page.data) || [];
        return uniqBy(allPosts, 'id');
    }, [data?.pages]);

    const bottomNavHeight = 67;
    const bottomNavMargin = 13;
    const extraPadding = 20;
    const bottomPadding = bottomNavHeight + bottomNavMargin + insets.bottom + extraPadding;

    const listRef = useRef<RecyclerListView<any, any> | null>(null);
    const trigger = useScrollStore((state) => state.triggers['index']);

    useEffect(() => {
        if (trigger > 0 && listRef.current) {
            listRef.current.scrollToTop(true);
        }
    }, [trigger]);

    const handleRefresh = async () => {
        queryClient.removeQueries({ queryKey: ['feed', feedType] });
        refetch();
    };

    // Create DataProvider with rowHasChanged comparison
    const [dataProvider, setDataProvider] = useState<DataProvider>(
        new DataProvider((r1, r2) => {
            // Compare by post id for efficiency
            return r1.id !== r2.id;
        })
    );

    // Update dataProvider when posts change
    useEffect(() => {
        if (posts.length > 0) {
            setDataProvider(prevProvider => prevProvider.cloneWithRows(posts));
        }
    }, [posts]);

    // Create LayoutProvider
    const layoutProvider = useMemo(() => {
        return new LayoutProvider(
            (index) => ViewTypes.POST,
            (type, dim) => {
                dim.width = SCREEN_WIDTH;
                dim.height = ESTIMATED_POST_HEIGHT;
            }
        );
    }, []);

    // Row renderer for RecyclerListView
    const rowRenderer = useCallback((type: string | number, data: Post, index: number) => {
        return (
            <View style={{ marginBottom: 30 }}>
                <PostItem post={data} onOptionsPress={onOptionsPress} onLikeCountPress={onLikeCountPress} />
            </View>
        );
    }, [onOptionsPress, onLikeCountPress]);

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

    // Handle scroll events
    const handleScroll = useCallback((rawEvent: any, offsetX: number, offsetY: number) => {
        // Forward scroll event to parent in the expected format
        if (onScroll) {
            onScroll({
                nativeEvent: {
                    contentOffset: { x: offsetX, y: offsetY }
                }
            });
        }
    }, [onScroll]);

    // Handle end reached for infinite scroll
    const handleEndReached = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Custom external scroll view with RefreshControl
    const renderScrollComponent = useCallback((props: any) => {
        return (
            <ScrollView
                {...props}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={handleRefresh}
                        tintColor={colors.text}
                        colors={[colors.text]}
                        progressBackgroundColor={colors.card}
                    />
                }
            />
        );
    }, [isRefetching, handleRefresh, colors]);

    // Render footer for loading state
    const renderFooter = useCallback(() => {
        if (isFetchingNextPage) {
            return renderPostSkeleton();
        }
        return <View style={{ height: bottomPadding }} />;
    }, [isFetchingNextPage, bottomPadding]);

    if (isLoading) {
        return (
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: bottomPadding, paddingTop: headerHeight + 10 }}
            >
                {renderPostSkeleton()}
                <View style={{ height: 12 }} />
                {renderPostSkeleton()}
                <View style={{ height: 12 }} />
                {renderPostSkeleton()}
            </ScrollView>
        );
    }

    if (posts.length === 0) {
        return (
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: bottomPadding, paddingTop: headerHeight + 10, flex: 1 }}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={handleRefresh}
                        tintColor={colors.text}
                        colors={[colors.text]}
                        progressBackgroundColor={colors.card}
                    />
                }
            >
                {renderEmptyState()}
            </ScrollView>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <RecyclerListView
                ref={listRef}
                layoutProvider={layoutProvider}
                dataProvider={dataProvider}
                rowRenderer={rowRenderer}
                onScroll={handleScroll}
                scrollViewProps={{
                    showsVerticalScrollIndicator: false,
                    contentContainerStyle: {
                        paddingTop: headerHeight + 10,
                    },
                    refreshControl: (
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={handleRefresh}
                            tintColor={colors.text}
                            colors={[colors.text]}
                            progressBackgroundColor={colors.card}
                            progressViewOffset={insets.top}
                        />
                    ),
                }}
                // Enable non-deterministic rendering for variable height items
                forceNonDeterministicRendering={true}
                // Render items ahead for smoother scrolling
                renderAheadOffset={300}
                // Handle infinite scroll
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.5}
                // Render footer
                renderFooter={renderFooter}
                // Enable stable ids for better recycling
                // Note: extendedState can be used for external state dependencies
                canChangeSize={true}
            />
        </View>
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
