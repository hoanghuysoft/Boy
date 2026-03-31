import { FlexText } from '@/components/FlexText';
import { WatchlistShow, useShowWatchlistStore } from '@/stores/showWatchlist';
import { Ionicons } from '@expo/vector-icons';
import { RoundedMagnifierOutline, TrashBinTrashBold } from '@solar-icons/react-native';
import dayjs from 'dayjs';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    Alert,
    FlatList,
    Keyboard,
    Platform,
    Pressable,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from '../../context/ThemeContext';
import { createCommonStyles } from '../../styles/common';

const SEARCH_BAR_HEIGHT = 58;

const ShowWatchlistScreen = () => {
    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const insets = useSafeAreaInsets();

    const watchlist = useShowWatchlistStore((s) => s.watchlist);
    const remove = useShowWatchlistStore((s) => s.remove);
    const clear = useShowWatchlistStore((s) => s.clear);

    const [searchText, setSearchText] = useState('');
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const searchBarBottom = insets.bottom + 16 + keyboardHeight;

    React.useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSub = Keyboard.addListener(showEvent, (e) => {
            setKeyboardHeight(e.endCoordinates?.height ?? 0);
        });
        const hideSub = Keyboard.addListener(hideEvent, () => {
            setKeyboardHeight(0);
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const filtered = useMemo(() => {
        const q = searchText.trim().toLowerCase();
        if (!q) return watchlist;
        return watchlist.filter((s) => s.title.toLowerCase().includes(q));
    }, [watchlist, searchText]);

    const handleRemove = useCallback(
        (item: WatchlistShow) => {
            Alert.alert(
                'Remove from Watchlist',
                `Remove "${item.title}"?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Remove', style: 'destructive', onPress: () => remove(item.video_url) },
                ]
            );
        },
        [remove]
    );

    const handleClearAll = useCallback(() => {
        if (watchlist.length === 0) return;
        Alert.alert(
            'Clear Watchlist',
            'Remove all saved shows?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear All', style: 'destructive', onPress: clear },
            ]
        );
    }, [watchlist.length, clear]);

    const renderItem = useCallback(
        ({ item }: { item: WatchlistShow }) => (
            <Pressable
                onPress={() =>
                    router.push({
                        pathname: '/show_detail',
                        params: { video_url: item.video_url },
                    })
                }
                style={({ pressed }) => [
                    styles.row,
                    { backgroundColor: colors.background, opacity: pressed ? 0.9 : 1 },
                ]}
            >
                <Image
                    source={{ uri: item.thumb_url }}
                    style={styles.thumbnail}
                    contentFit="cover"
                />
                <View style={{ flex: 1, gap: 4 }}>
                    <FlexText numberOfLines={1} style={[styles.title, { color: colors.text }]}>
                        {item.title}
                    </FlexText>
                    <FlexText
                        numberOfLines={1}
                        style={[styles.meta, { color: colors.muted }]}
                    >
                        {item.duration} • {item.views}
                    </FlexText>
                    <FlexText
                        numberOfLines={2}
                        style={[styles.meta, { color: colors.muted }]}
                    >
                        Added on {dayjs(item.added_at).format('DD MMM YYYY')}
                    </FlexText>
                </View>
                <TouchableOpacity
                    onPress={() => handleRemove(item)}
                    hitSlop={8}
                    style={styles.removeButton}
                >
                    <Ionicons name="remove-circle-outline" size={22} color={colors.muted} />
                </TouchableOpacity>
            </Pressable>
        ),
        [colors, handleRemove]
    );

    const keyExtractor = useCallback((item: WatchlistShow) => item.video_url, []);

    const ListEmptyComponent = useMemo(() => {
        const isSearching = searchText.trim().length > 0;
        return (
            <View style={styles.emptyState}>
                <Ionicons
                    name={isSearching ? 'search-outline' : 'bookmark-outline'}
                    size={52}
                    color={colors.muted}
                />
                <FlexText style={[styles.emptyTitle, { color: colors.text }]}>
                    {isSearching ? 'No results found' : 'Your watchlist is empty'}
                </FlexText>
                <FlexText style={[styles.emptySubtitle, { color: colors.muted }]}>
                    {isSearching
                        ? `No shows match "${searchText.trim()}"`
                        : 'Save shows from their detail page to watch later'}
                </FlexText>
            </View>
        );
    }, [searchText, colors]);

    return (
        <View style={common.screen}>
            {/* Floating back button */}
            <View style={{ position: 'absolute', top: insets.top + 16, left: 16, zIndex: 1000 }}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[styles.iconButton, { backgroundColor: colors.containerContent }]}
                >
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* Floating clear-all button */}
            {watchlist.length > 0 && (
                <View style={{ position: 'absolute', top: insets.top + 16, right: 16, zIndex: 1000 }}>
                    <TouchableOpacity
                        onPress={handleClearAll}
                        style={[styles.iconButton, { backgroundColor: colors.containerContent }]}
                    >
                        <TrashBinTrashBold size={20} color={colors.muted} />
                    </TouchableOpacity>
                </View>
            )}

            <FlatList
                data={filtered}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={[
                    styles.listContent,
                    {
                        paddingBottom:
                            watchlist.length > 0
                                ? searchBarBottom + SEARCH_BAR_HEIGHT + 24
                                : insets.bottom + 24,
                    },
                    filtered.length === 0 && styles.listContentEmpty,
                ]}
                ListHeaderComponent={
                    <View style={{ marginTop: insets.top + 66, paddingHorizontal: 16, marginBottom: 16 }}>
                        {/* Heading */}
                        <FlexText style={[common.heading, { fontSize: 28 }]}>Watchlist</FlexText>
                        <FlexText style={[common.bodySmall, { color: colors.muted, marginTop: 2, marginBottom: 16 }]}>
                            {watchlist.length === 0
                                ? 'No saved shows yet'
                                : `${watchlist.length} saved show${watchlist.length !== 1 ? 's' : ''}`}
                        </FlexText>
                    </View>
                }
                ListEmptyComponent={ListEmptyComponent}
            />

            {/* Floating search bar (same UX as SearchShows) */}
            {watchlist.length > 0 && (
                <View
                    style={[
                        styles.searchBarContainer,
                        {
                            bottom: searchBarBottom,
                        },
                    ]}
                >
                    <View style={[styles.searchBar, { backgroundColor: colors.containerContent }]}>
                        <RoundedMagnifierOutline size={18} color={colors.muted} style={{ marginLeft: 14 }} />
                        <TextInput
                            style={[styles.searchInput, { color: colors.text }]}
                            placeholder="Search your watchlist..."
                            placeholderTextColor={colors.muted}
                            value={searchText}
                            onChangeText={setSearchText}
                            returnKeyType="search"
                            autoCorrect={false}
                            autoCapitalize="none"
                        />
                        {searchText.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchText('')} style={{ padding: 10 }}>
                                <Ionicons name="close-circle" size={18} color={colors.muted} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}
        </View>
    );
};

export default ShowWatchlistScreen;

const styles = StyleSheet.create({
    listContent: {
        paddingHorizontal: 8,
        gap: 4,
    },
    listContentEmpty: {
        flex: 1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        padding: 12,
        gap: 12,
    },
    thumbnail: {
        width: 150,
        height: 80,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    title: {
        fontSize: 15,
        fontWeight: '700',
    },
    meta: {
        fontSize: 13,
    },
    removeButton: {
        padding: 4,
    },
    searchBarContainer: {
        position: 'absolute',
        left: 8,
        right: 8,
        borderRadius: 16,
        padding: 10,
        zIndex: 1000,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 999,
        height: SEARCH_BAR_HEIGHT,
        gap: 6,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        paddingVertical: 0,
        paddingRight: 4,
    },
    iconButton: {
        borderRadius: 999,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        gap: 12,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
});
