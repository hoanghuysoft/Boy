import { FlexText } from '@/components/FlexText';
import { PostItem } from '@/components/PostItem';
import { useThemeContext } from '@/context/ThemeContext';
import { createCommonStyles } from '@/styles/common';
import { Post } from '@/types/post';
import { useHashtagPostsViewModel } from '@/viewmodels/HashtagPostsViewModel';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { LikersSheet } from '@/components/post/LikersSheet';
import { CommentsSheet } from '@/components/post/CommentsSheet';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

interface HashtagPostsScreenProps {
    tag: string;
}

const HashtagPostsScreen = ({ tag }: HashtagPostsScreenProps) => {
    const router = useRouter();
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const vm = useHashtagPostsViewModel(tag);
    const { t } = useTranslation();

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

    const renderItem = useCallback(
        ({ item }: { item: Post }) => (
            <View style={{ marginBottom: 30 }}>
                <PostItem 
                    post={item}
                    onLikeCountPress={handleLikeCountPress}
                    onCommentPress={handleCommentPress}
                />
            </View>
        ),
        [handleLikeCountPress, handleCommentPress]
    );

    const renderFooter = useCallback(() => {
        if (vm.isFetchingNextPage) {
            return (
                <View style={styles.footerLoader}>
                    <ActivityIndicator size="small" color={colors.text} />
                </View>
            );
        }
        return <View style={{ height: 80 }} />;
    }, [vm.isFetchingNextPage, colors.text]);

    const renderEmpty = useCallback(() => {
        if (vm.isLoading) {
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
                                theme === 'dark'
                                    ? 'rgba(255,255,255,0.05)'
                                    : 'rgba(0,0,0,0.04)',
                        },
                    ]}
                >
                    <FlexText style={{ fontSize: 32 }}>#</FlexText>
                </View>
                <FlexText
                    style={[
                        common.heading,
                        { fontSize: 20, marginTop: 20, marginBottom: 8 },
                    ]}
                >
                    {t('hashtag.posts.emptyTitle')}
                </FlexText>
                <FlexText
                    style={[
                        common.body,
                        {
                            color: colors.muted,
                            textAlign: 'center',
                            lineHeight: 22,
                        },
                    ]}
                >
                    {t('hashtag.posts.emptyBody', { tag })}
                </FlexText>
            </View>
        );
    }, [vm.isLoading, colors, common, theme, tag, t]);

    const ListHeaderComponent = useCallback(
        () => (
            <View
                style={{
                    marginTop: vm.insets.top + 66,
                    paddingHorizontal: 16,
                    marginBottom: 8,
                }}
            >
                <FlexText style={[common.heading, { fontSize: 28 }]}>
                    #{vm.hashtagLabel}
                </FlexText>
                <FlexText
                    style={[
                        common.bodySmall,
                        { color: colors.muted, marginTop: 2 },
                    ]}
                >
                    {vm.totalCount > 0
                        ? t('hashtag.posts.count', { count: vm.totalCount })
                        : t('hashtag.posts.title')}
                </FlexText>
            </View>
        ),
        [vm.insets.top, vm.hashtagLabel, vm.totalCount, common, colors.muted, t]
    );

    return (
        <View style={common.screen}>
            {/* Floating back button — same pattern as Bookmarks */}
            <View
                style={{
                    position: 'absolute',
                    top: vm.insets.top + 16,
                    left: 16,
                    zIndex: 1000,
                }}
            >
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

            <FlatList
                data={vm.posts}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                onEndReached={vm.handleEndReached}
                onEndReachedThreshold={0.5}
                ListHeaderComponent={ListHeaderComponent}
                ListEmptyComponent={renderEmpty}
                ListFooterComponent={renderFooter}
                showsVerticalScrollIndicator={false}
                onRefresh={vm.refetch}
                refreshing={vm.isRefetching}
                contentContainerStyle={
                    vm.posts.length === 0 ? styles.emptyContainer : undefined
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

export default HashtagPostsScreen;

const styles = StyleSheet.create({
    footerLoader: {
        paddingVertical: 24,
        alignItems: 'center',
    },
    emptyState: {
        flex: 1,
        paddingVertical: 80,
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyContainer: {
        flex: 1,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
