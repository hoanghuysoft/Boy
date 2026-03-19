import { FlexText } from '@/components/FlexText';
import { useTrendingHashtagsViewModel } from '@/viewmodels/TrendingHashtagsViewModel';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SquircleView } from 'expo-squircle-view';
import React, { useCallback } from 'react';
import {
    ActivityIndicator,
    FlatList,
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

    const renderItem = useCallback(
        ({ item }: { item: Hashtag }) => (
            <TouchableOpacity
                onPress={() => vm.navigateToTag(item.tag)}
                activeOpacity={0.7}
            >
                <SquircleView
                    cornerSmoothing={100}
                    preserveSmoothing={true}
                    style={[styles.tagRow, { backgroundColor: colors.containerContent }]}
                >
                    <View style={styles.tagRowLeft}>
                        <FlexText
                            style={[
                                common.body,
                                { color: colors.secondary, fontWeight: '600' },
                            ]}
                        >
                            #{item.tag}
                        </FlexText>
                        {item.count != null && (
                            <FlexText style={[common.caption, { color: colors.muted, marginTop: 2 }]}>
                                {item.count.toLocaleString()} post{item.count !== 1 ? 's' : ''}
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
                    No trending tags
                </FlexText>
                <FlexText
                    style={[
                        common.body,
                        { color: colors.muted, textAlign: 'center', lineHeight: 22 },
                    ]}
                >
                    Check back later for trending hashtags.
                </FlexText>
            </View>
        );
    }, [vm.isLoading, colors, common, theme]);

    const ListHeaderComponent = useCallback(
        () => (
            <View
                style={{
                    marginTop: insets.top + 66,
                    paddingHorizontal: 16,
                    marginBottom: 16,
                }}
            >
                <FlexText style={[common.heading, { fontSize: 28 }]}>Trending Tags</FlexText>
                <FlexText style={[common.bodySmall, { color: colors.muted, marginTop: 2 }]}>
                    {vm.allTags.length > 0
                        ? `${vm.allTags.length} tag${vm.allTags.length !== 1 ? 's' : ''}`
                        : 'Discover what people are talking about'}
                </FlexText>
            </View>
        ),
        [insets.top, common, colors.muted, vm.allTags.length]
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
        borderRadius: 16,
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
});
