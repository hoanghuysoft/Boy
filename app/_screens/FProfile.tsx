import {
    FProfileHeader,
    FProfileHighlights,
    FProfilePersonalInfo,
    MemoFBPostCard,
    MemoGroupItem,
    MemoReelItem,
} from '@/components/fprofile';
import CachedImage from '@/components/fprofile/CachedImage';
import { FBPhotoList } from '@/types/localfb';
import { useFProfileViewModel } from '@/viewmodels/FProfileViewModel';
import { Ionicons } from '@expo/vector-icons';
import { Galeria } from '@nandorojo/galeria';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    SectionList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Constants ──────────────────────────────────────────────────────────────────
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_COLUMNS = 3;
const PHOTO_GAP = 2;
const PHOTO_SIZE = (SCREEN_WIDTH - PHOTO_GAP * (PHOTO_COLUMNS - 1)) / PHOTO_COLUMNS;
const REEL_COLUMNS = 3;
const REEL_GAP = 2;

// ─── Tab Type ───────────────────────────────────────────────────────────────────
type TabType = 'All' | 'Reels' | 'Photos' | 'Groups';

// ─── Helpers: chunk array into rows ─────────────────────────────────────────────
function chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}

// ─── Photo Row Item ─────────────────────────────────────────────────────────────
const PhotoRowItem = React.memo<{
    row: FBPhotoList;
    startIndex: number;
}>(({ row, startIndex }) => (
    <View style={{ flexDirection: 'row', gap: PHOTO_GAP }}>
        {row.map((photo, colIndex) => (
            <Galeria.Image index={startIndex + colIndex} key={photo.id}>
                <CachedImage
                    uri={photo.thumbnail}
                    style={{ width: PHOTO_SIZE, height: PHOTO_SIZE, marginBottom: 1 }}
                    resizeMode="cover"
                />
            </Galeria.Image>
        ))}
    </View>
));

const FProfileScreen = () => {
    const vm = useFProfileViewModel();
    const insets = useSafeAreaInsets();
    const c = vm.fbColors;
    const [activeTab, setActiveTab] = useState<TabType>('All');
    const [mountedTabs, setMountedTabs] = useState<Set<TabType>>(() => new Set(['All']));

    const handleTabPress = useCallback((tab: TabType) => {
        setActiveTab(tab);
        setMountedTabs(prev => {
            if (prev.has(tab)) return prev;
            const next = new Set(prev);
            next.add(tab);
            return next;
        });
    }, []);

    // ─── Loading state ──────────────────────────────────────────────────
    if (!vm.profile) {
        return (
            <View style={[styles.screen, { backgroundColor: c.screenBg, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={c.buttonBlueBg} />
            </View>
        );
    }

    const profile = vm.profile;
    const postCount = vm.fbData.posts?.length ?? 0;
    const photoCount = vm.fbData.photos?.length ?? 0;
    const videoCount = vm.fbData.videos?.length ?? 0;

    // ─── Shared header element ──────────────────────────────────────────
    const headerElement = (
        <FProfileHeader
            profile={profile}
            fbColors={c}
            insetsTop={insets.top}
            postCount={postCount}
            photoCount={photoCount}
            videoCount={videoCount}
            onBack={vm.goBack}
        />
    );

    // ─── Tab bar rendered as section header (sticky) ────────────────────
    const renderTabBar = () => (
        <View style={[styles.stickyTabContainer, { backgroundColor: c.contentBg, paddingTop: 10 }]}>
            <View style={[styles.tabsContainer, { borderBottomColor: c.divider }]}>
                {(['All', 'Reels', 'Photos', 'Groups'] as TabType[]).map((tab) => {
                    const isActive = activeTab === tab;
                    return (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => handleTabPress(tab)}
                            style={[styles.tabButton, { backgroundColor: isActive ? c.tabActiveBg : c.tabInactiveBg }]}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.tabText, { color: isActive ? c.tabActiveText : c.tabInactiveText }]}>
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );

    // ═══════════════════════════════════════════════════════════════════════
    // ALL TAB — data items
    // ═══════════════════════════════════════════════════════════════════════
    const allTabData = useMemo(() => {
        if (vm.isLoading) return [{ type: 'loading' as const }];
        const items: any[] = [
            { type: 'personalInfo' as const },
            { type: 'highlights' as const },
            { type: 'divider' as const },
        ];
        if (vm.fbData.posts && vm.fbData.posts.length > 0) {
            for (const post of vm.fbData.posts) {
                items.push({ type: 'post' as const, data: post });
            }
        } else {
            items.push({ type: 'emptyPosts' as const });
        }
        return items;
    }, [vm.isLoading, vm.fbData.posts, vm.fbData.highlights]);

    const renderAllItem = useCallback(({ item }: { item: any }) => {
        switch (item.type) {
            case 'loading':
                return (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={c.buttonBlueBg} />
                        <Text style={[styles.loadingText, { color: c.secondaryText }]}>Loading Facebook data...</Text>
                    </View>
                );
            case 'personalInfo':
                return <FProfilePersonalInfo profile={profile} fbColors={c} formatBirthday={vm.formatBirthday} />;
            case 'highlights':
                return <FProfileHighlights highlights={vm.fbData.highlights} fbColors={c} />;
            case 'divider':
                return <View style={[styles.thickDivider, { backgroundColor: c.divider }]} />;
            case 'post':
                return <MemoFBPostCard post={item.data} formatTimestamp={vm.formatTimestamp} />;
            case 'emptyPosts':
                return (
                    <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                        <Text style={{ fontSize: 15, color: c.secondaryText }}>No posts available</Text>
                    </View>
                );
            default:
                return null;
        }
    }, [c, profile, vm.formatBirthday, vm.formatTimestamp, vm.fbData.highlights]);

    // ═══════════════════════════════════════════════════════════════════════
    // REELS TAB — data items (rows of 3)
    // ═══════════════════════════════════════════════════════════════════════
    const reelsTabData = useMemo(() => {
        if (vm.isLoading) return [{ type: 'loading' as const }];
        if (!vm.fbData.videos || vm.fbData.videos.length === 0) return [{ type: 'emptyReels' as const }];
        return chunkArray(vm.fbData.videos, REEL_COLUMNS).map((row, i) => ({ type: 'reelRow' as const, data: row, rowIndex: i }));
    }, [vm.isLoading, vm.fbData.videos]);

    const renderReelsItem = useCallback(({ item }: { item: any }) => {
        if (item.type === 'loading') {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={c.buttonBlueBg} />
                    <Text style={[styles.loadingText, { color: c.secondaryText }]}>Loading...</Text>
                </View>
            );
        }
        if (item.type === 'emptyReels') {
            return (
                <View style={{ paddingVertical: 60, alignItems: 'center', gap: 12 }}>
                    <Ionicons name="videocam-outline" size={48} color={c.secondaryText} />
                    <Text style={{ fontSize: 15, color: c.secondaryText }}>No videos available</Text>
                </View>
            );
        }
        return (
            <View style={{ flexDirection: 'row', gap: REEL_GAP }}>
                {item.data.map((video: any) => (
                    <MemoReelItem
                        key={video.id}
                        item={video}
                        formatDuration={vm.formatDuration}
                        formatCount={vm.formatCount}
                    />
                ))}
            </View>
        );
    }, [c, vm.formatDuration, vm.formatCount]);

    // ═══════════════════════════════════════════════════════════════════════
    // PHOTOS TAB — data items (rows of 3)
    // ═══════════════════════════════════════════════════════════════════════
    const photoUrls = useMemo(() => (vm.fbData.photos || []).map(p => p.image || p.thumbnail), [vm.fbData.photos]);

    const photosTabData = useMemo(() => {
        if (vm.isLoading) return [{ type: 'loading' as const }];
        if (!vm.fbData.photos || vm.fbData.photos.length === 0) return [{ type: 'emptyPhotos' as const }];
        return chunkArray(vm.fbData.photos, PHOTO_COLUMNS).map((row, i) => ({ type: 'photoRow' as const, data: row, rowIndex: i }));
    }, [vm.isLoading, vm.fbData.photos]);

    const renderPhotosItem = useCallback(({ item }: { item: any }) => {
        if (item.type === 'loading') {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={c.buttonBlueBg} />
                    <Text style={[styles.loadingText, { color: c.secondaryText }]}>Loading...</Text>
                </View>
            );
        }
        if (item.type === 'emptyPhotos') {
            return (
                <View style={{ paddingVertical: 60, alignItems: 'center', gap: 12 }}>
                    <Ionicons name="images-outline" size={48} color={c.secondaryText} />
                    <Text style={{ fontSize: 15, color: c.secondaryText }}>No photos available</Text>
                </View>
            );
        }
        return <PhotoRowItem row={item.data} startIndex={item.rowIndex * PHOTO_COLUMNS} />;
    }, [c]);

    // ═══════════════════════════════════════════════════════════════════════
    // GROUPS TAB — data items
    // ═══════════════════════════════════════════════════════════════════════
    const groupsTabData = useMemo(() => {
        if (vm.isLoading) return [{ type: 'loading' as const }];
        if (!vm.fbData.groups || vm.fbData.groups.length === 0) return [{ type: 'emptyGroups' as const }];
        return vm.fbData.groups.map(g => ({ type: 'group' as const, data: g }));
    }, [vm.isLoading, vm.fbData.groups]);

    const renderGroupsItem = useCallback(({ item }: { item: any }) => {
        if (item.type === 'loading') {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={c.buttonBlueBg} />
                    <Text style={[styles.loadingText, { color: c.secondaryText }]}>Loading...</Text>
                </View>
            );
        }
        if (item.type === 'emptyGroups') {
            return (
                <View style={{ paddingVertical: 60, alignItems: 'center', gap: 12 }}>
                    <Ionicons name="people-circle-outline" size={48} color={c.secondaryText} />
                    <Text style={{ fontSize: 15, color: c.secondaryText }}>No groups joined</Text>
                </View>
            );
        }
        return <MemoGroupItem group={item.data} fbColors={c} formatCount={vm.formatCount} />;
    }, [c, vm.formatCount]);

    // ─── Shared keyExtractor ────────────────────────────────────────────
    const keyExtractor = useCallback((item: any, index: number) => {
        if (item.data?.id) return item.data.id;
        return `${item.type}-${index}`;
    }, []);

    // ─── Render a tab's SectionList ─────────────────────────────────────
    const renderTabList = (
        data: any[],
        renderItem: any,
        tabStyle: ViewStyle,
        wrapWithGaleria?: boolean,
    ) => {
        const list = (
            <SectionList
                style={[{ flex: 1, backgroundColor: c.contentBg }, tabStyle]}
                sections={[{ data }]}
                ListHeaderComponent={headerElement}
                renderSectionHeader={renderTabBar}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom }}
            />
        );

        if (wrapWithGaleria && photoUrls.length > 0) {
            return <Galeria urls={photoUrls}>{list}</Galeria>;
        }
        return list;
    };

    return (
        <View style={[styles.screen, { backgroundColor: c.screenBg }]}>
            {/* All Tab */}
            {renderTabList(allTabData, renderAllItem, { display: activeTab === 'All' ? 'flex' : 'none' })}

            {/* Reels Tab */}
            {mountedTabs.has('Reels') &&
                renderTabList(reelsTabData, renderReelsItem, { display: activeTab === 'Reels' ? 'flex' : 'none' })}

            {/* Photos Tab */}
            {mountedTabs.has('Photos') &&
                renderTabList(photosTabData, renderPhotosItem, { display: activeTab === 'Photos' ? 'flex' : 'none' }, true)}

            {/* Groups Tab */}
            {mountedTabs.has('Groups') &&
                renderTabList(groupsTabData, renderGroupsItem, { display: activeTab === 'Groups' ? 'flex' : 'none' })}
        </View>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    screen: { flex: 1 },

    // Sticky Tabs
    stickyTabContainer: { paddingTop: 0, zIndex: 10 },
    tabsContainer: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingVertical: 8 },
    tabButton: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999 },
    tabText: { fontSize: 14, fontWeight: '600' },

    // Loading
    loadingContainer: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, paddingVertical: 60,
    },
    loadingText: { fontSize: 14 },

    // Thick divider
    thickDivider: { height: 8, marginTop: 20 },
});

export default FProfileScreen;
