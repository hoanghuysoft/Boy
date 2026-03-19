import { FlexText } from '@/components/FlexText';
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
import { Profile } from '@/types/profile';
import { useFProfileViewModel } from '@/viewmodels/FProfileViewModel';
import { Ionicons } from '@expo/vector-icons';
import { Galeria } from '@nandorojo/galeria';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    View
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
PhotoRowItem.displayName = 'PhotoRowItem';

// ─── Tab Bar ─────────────────────────────────────────────────────────────────
// Isolated outside FProfileScreen so only the tab bar re-renders on tab switch,
// never the profile header above it.
type TabBarProps = { activeTab: TabType; onTabPress: (tab: TabType) => void; colors: any };

const TabBar = React.memo(({ activeTab, onTabPress, colors: c }: TabBarProps) => (
    <View style={[styles.stickyTabContainer, { backgroundColor: c.contentBg, paddingTop: 10 }]}>
        <View style={[styles.tabsContainer, { borderBottomColor: c.divider }]}>
            {(['All', 'Reels', 'Photos', 'Groups'] as TabType[]).map((tab) => {
                const isActive = activeTab === tab;
                return (
                    <TouchableOpacity
                        key={tab}
                        onPress={() => onTabPress(tab)}
                        style={[styles.tabButton, { backgroundColor: isActive ? c.tabActiveBg : c.tabInactiveBg }]}
                        activeOpacity={0.7}
                    >
                        <FlexText style={[styles.tabText, { color: isActive ? c.tabActiveText : c.tabInactiveText }]}>
                            {tab}
                        </FlexText>
                    </TouchableOpacity>
                );
            })}
        </View>
    </View>
));
TabBar.displayName = 'TabBar';

// ─── Profile List Header ──────────────────────────────────────────────────────
// React.memo ensures FProfileHeader is skipped on tab switches (only activeTab
// changes, which is not forwarded to FProfileHeader).
type ProfileListHeaderProps = {
    profile: Profile;
    fbColors: any;
    insetsTop: number;
    postCount: number;
    photoCount: number;
    videoCount: number;
    onBack: () => void;
    activeTab: TabType;
    onTabPress: (tab: TabType) => void;
};

const ProfileListHeader = React.memo(({
    profile, fbColors, insetsTop, postCount, photoCount, videoCount, onBack, activeTab, onTabPress,
}: ProfileListHeaderProps) => (
    <View>
        <FProfileHeader
            profile={profile}
            fbColors={fbColors}
            insetsTop={insetsTop}
            postCount={postCount}
            photoCount={photoCount}
            videoCount={videoCount}
            onBack={onBack}
        />
        <TabBar activeTab={activeTab} onTabPress={onTabPress} colors={fbColors} />
    </View>
));
ProfileListHeader.displayName = 'ProfileListHeader';

const FProfileScreen = () => {
    const vm = useFProfileViewModel();
    const insets = useSafeAreaInsets();
    const c = vm.fbColors;
    const [activeTab, setActiveTab] = useState<TabType>('All');
    const [isReady, setIsReady] = useState(false);
    const listRef = useRef<FlatList>(null);

    useEffect(() => {
        const timeout = setTimeout(() => {
            requestAnimationFrame(() => {
                setIsReady(true);
            });
        }, 150);
        return () => clearTimeout(timeout);
    }, []);

    // Stable callback — no activeTab dep needed; React ignores no-op setState calls.
    const handleTabPress = useCallback((tab: TabType) => {
        setActiveTab(tab);
    }, []);

    const profile = vm.profile;
    const postCount = vm.fbData.posts?.length ?? 0;
    const photoCount = vm.fbData.photos?.length ?? 0;
    const videoCount = vm.fbData.videos?.length ?? 0;

    // ─── Header + Tab bar as ListHeaderComponent ─────────────────────────
    // ProfileListHeader is React.memo'd: when activeTab changes only TabBar
    // re-renders inside it; FProfileHeader is fully skipped.
    const listHeader = useMemo(() => {
        if (!profile) return null;
        return (
            <ProfileListHeader
                profile={profile}
                fbColors={c}
                insetsTop={insets.top}
                postCount={postCount}
                photoCount={photoCount}
                videoCount={videoCount}
                onBack={vm.goBack}
                activeTab={activeTab}
                onTabPress={handleTabPress}
            />
        );
    }, [profile, c, insets.top, postCount, photoCount, videoCount, vm.goBack, activeTab, handleTabPress]);

    // ═══════════════════════════════════════════════════════════════════════
    // Dynamic data based on active tab
    // ═══════════════════════════════════════════════════════════════════════
    const data = useMemo(() => {
        if (!isReady || vm.isLoading) return [{ type: 'loading' as const }];

        switch (activeTab) {
            case 'All': {
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
            }
            case 'Reels': {
                if (!vm.fbData.videos || vm.fbData.videos.length === 0) return [{ type: 'emptyReels' as const }];
                return chunkArray(vm.fbData.videos, REEL_COLUMNS).map((row, i) => ({ type: 'reelRow' as const, data: row, rowIndex: i }));
            }
            case 'Photos': {
                if (!vm.fbData.photos || vm.fbData.photos.length === 0) return [{ type: 'emptyPhotos' as const }];
                return chunkArray(vm.fbData.photos, PHOTO_COLUMNS).map((row, i) => ({ type: 'photoRow' as const, data: row, rowIndex: i }));
            }
            case 'Groups': {
                if (!vm.fbData.groups || vm.fbData.groups.length === 0) return [{ type: 'emptyGroups' as const }];
                return vm.fbData.groups.map(g => ({ type: 'group' as const, data: g }));
            }
        }
    }, [activeTab, isReady, vm.isLoading, vm.fbData]);

    // ─── Unified renderItem ─────────────────────────────────────────────
    const renderItem = useCallback(({ item }: { item: any }) => {
        switch (item.type) {
            case 'loading':
                return (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={c.buttonBlueBg} />
                        <FlexText style={[styles.loadingText, { color: c.secondaryText }]}>Loading Facebook data...</FlexText>
                    </View>
                );
            case 'personalInfo':
                if (!profile) return null;
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
                        <FlexText style={{ fontSize: 15, color: c.secondaryText }}>No posts available</FlexText>
                    </View>
                );
            case 'reelRow':
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
            case 'emptyReels':
                return (
                    <View style={{ paddingVertical: 60, alignItems: 'center', gap: 12 }}>
                        <Ionicons name="videocam-outline" size={48} color={c.secondaryText} />
                        <FlexText style={{ fontSize: 15, color: c.secondaryText }}>No videos available</FlexText>
                    </View>
                );
            case 'photoRow':
                return <PhotoRowItem row={item.data} startIndex={item.rowIndex * PHOTO_COLUMNS} />;
            case 'emptyPhotos':
                return (
                    <View style={{ paddingVertical: 60, alignItems: 'center', gap: 12 }}>
                        <Ionicons name="images-outline" size={48} color={c.secondaryText} />
                        <FlexText style={{ fontSize: 15, color: c.secondaryText }}>No photos available</FlexText>
                    </View>
                );
            case 'group':
                return <MemoGroupItem group={item.data} fbColors={c} formatCount={vm.formatCount} />;
            case 'emptyGroups':
                return (
                    <View style={{ paddingVertical: 60, alignItems: 'center', gap: 12 }}>
                        <Ionicons name="people-circle-outline" size={48} color={c.secondaryText} />
                        <FlexText style={{ fontSize: 15, color: c.secondaryText }}>No groups joined</FlexText>
                    </View>
                );
            default:
                return null;
        }
    }, [c, profile, vm.formatBirthday, vm.formatTimestamp, vm.fbData.highlights, vm.formatDuration, vm.formatCount]);

    const keyExtractor = useCallback((item: any, index: number) => {
        if (item.data?.id) return `${activeTab}-${item.data.id}`;
        return `${activeTab}-${item.type}-${index}`;
    }, [activeTab]);

    const photoUrls = useMemo(() => (vm.fbData.photos || []).map(p => p.image || p.thumbnail), [vm.fbData.photos]);

    const list = (
        <FlatList
            ref={listRef}
            style={{ flex: 1, backgroundColor: c.contentBg }}
            data={data}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            ListHeaderComponent={listHeader}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        />
    );

    // ─── Loading state ──────────────────────────────────────────────────
    if (!profile) {
        return (
            <View style={[styles.screen, { backgroundColor: c.screenBg, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={c.buttonBlueBg} />
            </View>
        );
    }

    return (
        <View style={[styles.screen, { backgroundColor: c.screenBg }]}>
            {activeTab === 'Photos' && photoUrls.length > 0 ? (
                <Galeria urls={photoUrls}>{list}</Galeria>
            ) : (
                list
            )}
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
