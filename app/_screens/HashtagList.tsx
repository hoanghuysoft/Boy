import { FlexText } from '@/components/FlexText';
import { useTrendingHashtagsViewModel } from '@/viewmodels/TrendingHashtagsViewModel';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SquircleView } from 'expo-squircle-view';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from '../../context/ThemeContext';
import { createCommonStyles } from '../../styles/common';
import { Hashtag } from '../../types/hashtag';

const HashtagListScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const vm = useTrendingHashtagsViewModel();
    const { t } = useTranslation();

    const renderItem = useCallback(
        ({ item }: { item: Hashtag }) => (
            <TouchableOpacity
                onPress={() => vm.navigateToTag(item.tag)}
                activeOpacity={0.7}
            >
                <SquircleView
                    cornerSmoothing={60}
                    style={[styles.tagRow, { backgroundColor: colors.containerContent }]}
                >
                    <View style={styles.tagRowLeft}>
                        <FlexText
                            style={[
                                common.body,
                                { color: colors.text, fontWeight: '600' },
                            ]}
                        >
                            #{item.tag}
                        </FlexText>
                        {item.count != null && (
                            <FlexText style={[common.caption, { color: colors.muted, marginTop: 2 }]}>
                                {t('hashtag.posts.count', { count: item.count })}
                            </FlexText>
                        )}
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                </SquircleView>
            </TouchableOpacity>
        ),
        [colors, common, vm.navigateToTag]
    );

    const renderEmpty = useCallback(() => {
        if (vm.isLoading) {
            return (
                <View style={styles.emptyState}>
                    <ActivityIndicator size="small" color={colors.text} />
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
                    {t('hashtag.list.emptyTitle')}
                </FlexText>
                <FlexText
                    style={[
                        common.body,
                        { color: colors.muted, textAlign: 'center', lineHeight: 22 },
                    ]}
                >
                    {t('hashtag.list.emptyBody')}
                </FlexText>
            </View>
        );
    }, [vm.isLoading, colors, common, theme, t]);

    const ListHeaderComponent = useCallback(
        () => (
            <View
                style={{
                    marginTop: insets.top + 66,
                    paddingHorizontal: 16,
                    marginBottom: 16,
                }}
            >
                <FlexText style={[common.heading, { fontSize: 28 }]}>{t('hashtag.list.title')}</FlexText>
                <FlexText style={[common.bodySmall, { color: colors.muted, marginTop: 2 }]}>
                    {vm.allTags.length > 0
                        ? t('hashtag.list.tagsCount', { count: vm.allTags.length })
                        : t('hashtag.list.subtitle')}
                </FlexText>
            </View>
        ),
        [insets.top, common, colors.muted, vm.allTags.length, t]
    );

    return (
        <View style={common.screen}>
            {/* Floating back button */}
            <View
                style={{
                    position: 'absolute',
                    top: insets.top + 16,
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
                data={vm.allTags}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                ListHeaderComponent={ListHeaderComponent}
                ListEmptyComponent={renderEmpty}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    { paddingHorizontal: 16, gap: 10, paddingBottom: 40 },
                    vm.allTags.length === 0 && styles.emptyContainer,
                ]}
                refreshControl={
                    <RefreshControl
                        refreshing={vm.isRefetching}
                        onRefresh={vm.handleRefresh}
                        tintColor={colors.text}
                        colors={[colors.text]}
                        progressBackgroundColor={colors.card}
                        progressViewOffset={insets.top}
                    />
                }
            />
        </View>
    );
};

export default HashtagListScreen;

const styles = StyleSheet.create({
    tagRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
    },
    tagRowLeft: {
        flex: 1,
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
    refreshIndicator: {
        borderRadius: 999,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
