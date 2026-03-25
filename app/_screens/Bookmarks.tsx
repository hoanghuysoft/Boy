import BookmarkIcon from "@/icons/bookmark";
import { useBookmarks } from "@/services/bookmark";
import { BookmarkedPost } from "@/types/bookmarkedpost";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    View
} from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlexText } from "../../components/FlexText";
import { PostItem } from "../../components/PostItem";
import { useThemeContext } from "../../context/ThemeContext";
import { createCommonStyles } from "../../styles/common";
import { CommentsSheet } from "../../components/post/CommentsSheet";
import { LikersSheet } from "../../components/post/LikersSheet";
import { Post } from "../../types/post";

const BookmarksScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const { t } = useTranslation();

    const {
        data,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
        isRefetching,
    } = useBookmarks();
    
    const posts = useMemo(() => {
        if (!data?.pages) return [];
        return data.pages.flatMap((page) => page.data);
    }, [data?.pages]);

    const likersSheetRef = useRef<TrueSheet>(null);
    const commentsSheetRef = useRef<TrueSheet>(null);
    const [selectedLikePostId, setSelectedLikePostId] = useState<string | null>(null);
    const [selectedCommentPostId, setSelectedCommentPostId] = useState<string | null>(null);

    const handleLikeCountPress = useCallback((post: Post) => {
        setSelectedLikePostId(post.id);
        likersSheetRef.current?.present();
    }, []);

    const handleCommentPress = useCallback((post: Post) => {
        setSelectedCommentPostId(post.id);
        commentsSheetRef.current?.present();
    }, []);

    const handleEndReached = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const renderItem = useCallback(
        ({ item }: { item: BookmarkedPost }) => (
            <View style={{ marginBottom: 30 }}>
                <PostItem 
                    post={item} 
                    isBookmarked={true}
                    onLikeCountPress={handleLikeCountPress}
                    onCommentPress={handleCommentPress}
                />
            </View>
        ),
        [handleLikeCountPress, handleCommentPress]
    );

    const renderFooter = useCallback(() => {
        if (isFetchingNextPage) {
            return (
                <View style={styles.footerLoader}>
                    <ActivityIndicator size="small" color={colors.text} />
                </View>
            );
        }
        return <View style={{ height: 80 }} />;
    }, [isFetchingNextPage, colors.text]);

    const renderEmpty = useCallback(() => {
        if (isLoading) {
            return (
                <View style={styles.emptyState}>
                    <ActivityIndicator size="large" color={colors.text} />
                </View>
            );
        }
        return (
            <View style={styles.emptyState}>
                <View
                    style={[
                        styles.emptyIconContainer,
                        {
                            backgroundColor:
                                theme === "dark"
                                    ? "rgba(255,255,255,0.05)"
                                    : "rgba(0,0,0,0.04)",
                        },
                    ]}
                >
                    <BookmarkIcon size={32} color={colors.muted} />
                </View>
                <FlexText style={[common.heading, { fontSize: 20, marginTop: 20, marginBottom: 8 }]}>
                    {t('bookmarks.emptyTitle')}
                </FlexText>
                <FlexText style={[common.body, { color: colors.muted, textAlign: "center", lineHeight: 22 }]}>
                    {t('bookmarks.emptyBody')}
                </FlexText>
            </View>
        );
    }, [isLoading, colors, common, theme]);

    // Title + subtitle rendered as the first item in the list,
    // sits below the spacer that clears the floating back button.
    const ListHeaderComponent = useCallback(() => (
        <View style={{ marginTop: insets.top + 66, paddingHorizontal: 16, marginBottom: 8 }}>
            <FlexText style={[common.heading, { fontSize: 28 }]}>
                {t('bookmarks.title')}
            </FlexText>
            <FlexText style={[common.bodySmall, { color: colors.muted, marginTop: 2 }]}>
                {posts.length > 0
                    ? t('bookmarks.savedCount', { count: posts.length })
                    : t('bookmarks.yourSavedPosts')}
            </FlexText>
        </View>
    ), [insets.top, common, colors.muted, posts.length]);

    return (
        <View style={common.screen}>
            {/* Floating back button — same pattern as Settings */}
            <View style={{ position: 'absolute', top: insets.top + 16, left: 16, zIndex: 1000 }}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{
                        backgroundColor: colors.containerContent,
                        borderRadius: 999,
                        width: 40,
                        height: 40,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* Bookmarks list */}
            <FlatList
                data={posts}
                keyExtractor={(item) => item.bookmark_id ?? item.id}
                renderItem={renderItem}
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.5}
                ListHeaderComponent={ListHeaderComponent}
                ListEmptyComponent={renderEmpty}
                ListFooterComponent={renderFooter}
                showsVerticalScrollIndicator={false}
                onRefresh={refetch}
                refreshing={isRefetching}
                contentContainerStyle={
                    posts.length === 0 ? styles.emptyContainer : undefined
                }
            />

            <LikersSheet ref={likersSheetRef} postId={selectedLikePostId} />
            <CommentsSheet
                ref={commentsSheetRef}
                postId={selectedCommentPostId}
            />
        </View>
    );
};

export default BookmarksScreen;

const styles = StyleSheet.create({
    footerLoader: {
        paddingVertical: 24,
        alignItems: "center",
    },
    emptyState: {
        flex: 1,
        paddingVertical: 80,
        alignItems: "center",
        paddingHorizontal: 40,
    },
    emptyContainer: {
        flex: 1,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: "center",
        justifyContent: "center",
    },
});
