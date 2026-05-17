import { FlexText } from "@/components/FlexText";
import { PostItem } from "@/components/PostItem";
import { resolveBlurhash } from "@/components/gallery/fallbackBlurhash";
import { SpinningArtwork } from "@/components/profile/SpinningArtwork";
import { SOCIAL_BG_URL } from "@/components/profile/header/constants";
import { HeaderInfoCard } from "@/components/profile/header/parts";
import { headerStyles } from "@/components/profile/header/styles";
import { AddressSheet } from "@/components/profile/sheets/AddressSheet";
import { MusicSheet } from "@/components/profile/sheets/MusicSheet";
import { RelationshipSheet } from "@/components/profile/sheets/RelationshipSheet";
import { SocialSheet } from "@/components/profile/sheets/SocialSheet";
import { WorkplaceSheet } from "@/components/profile/sheets/WorkplaceSheet";
import { useThemeContext } from "@/context/ThemeContext";
import { useInfiniteAddresses } from "@/services/address";
import { useProfileFeed } from "@/services/feed";
import { useInfiniteMedia } from "@/services/media";
import { useInfiniteMusic } from "@/services/music";
import { useInfiniteSocialLinks } from "@/services/sociallink";
import { useProfile } from "@/services/userprofile";
import { useInfiniteWorkplaces } from "@/services/workplace";
import { useAudioStore } from "@/stores/audio";
import { createCommonStyles } from "@/styles/common";
import { choosenMediaPath } from "@/utils/imageurl";
import { Ionicons } from "@expo/vector-icons";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { CollapsibleTabView, Route, TabFlatList } from "@mstfmedeni/collapsible-tab-view";
import { CaseMinimalisticBold, NotesBold, PointOnMapBold } from "@solar-icons/react-native";
import { MediaViewer, type MediaViewerItem } from "expo-media-viewer";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SquircleView } from "expo-squircle-view";
import { Avatar, Button, Skeleton, SkeletonGroup, Spinner, Tabs } from "heroui-native";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { NitroImage } from "react-native-nitro-image";
import { SharedValue, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LikersSheet, PostOptionsSheet } from "@/components/post";
import { CommentsSheet } from "@/components/post/CommentsSheet";
import type { PostOptionsSheetHandle } from "@/components/post/PostOptionsSheet";
import { Post } from "@/types/post";
import type { LikersSheetHandle } from "@/types/sheetHandles";



import BirthdayCard from "@/components/profile/BirthdayCard";
import { FamilyStackSection } from "@/components/profile/header/parts";
import { BriefInfoSheet } from "@/components/profile/sheets/BriefInfoSheet";
import VerifiedIcon from "@/icons/verified";
import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";
import CountryFlag from "react-native-country-flag";

countries.registerLocale(en);

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_ITEM_SIZE = SCREEN_WIDTH / 3;

const ProfileNew = () => {
    const insets = useSafeAreaInsets();

    const optionsSheetRef = useRef<PostOptionsSheetHandle>(null);
    const likersSheetRef = useRef<LikersSheetHandle>(null);
    const commentsSheetRef = useRef<TrueSheet>(null);
    const briefSheetRef = useRef<TrueSheet>(null);
    const musicSheetRef = useRef<TrueSheet>(null);
    const familySheetRef = useRef<TrueSheet>(null);
    const socialSheetRef = useRef<TrueSheet>(null);
    const addressSheetRef = useRef<TrueSheet>(null);
    const workplaceSheetRef = useRef<TrueSheet>(null);

    const [activePost, setActivePost] = useState<Post | null>(null);

    const router = useRouter();
    const { t } = useTranslation();
    const { currentlyPlayingId, playTrack, stopPlayback } = useAudioStore();

    const handleOptionsPress = useCallback((post: Post) => {
        setActivePost(post);
        optionsSheetRef.current?.present();
    }, []);

    const handleLikeCountPress = useCallback((post: Post) => {
        setActivePost(post);
        likersSheetRef.current?.present();
    }, []);

    const handleCommentPress = useCallback((post: Post) => {
        setActivePost(post);
        commentsSheetRef.current?.present();
    }, []);
    const params = useLocalSearchParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const isMe = params.isMe === 'true';

    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);

    const [index, setIndex] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const routes = useMemo<Route[]>(() => [
        { key: "posts", title: t("profile.tabs.feed"), index: 0 },
        { key: "images", title: t("profile.tabs.images"), index: 1 },
        { key: "videos", title: t("profile.tabs.videos"), index: 2 },
    ], [t]);
    const navigationState = useMemo(() => ({ index, routes }), [index, routes]);
    const animationHeaderPosition = useSharedValue(0);
    const animationHeaderHeight = useSharedValue(0);

    // Fetch real data
    const { data: profile, isLoading: isProfileLoading, refetch: refetchProfile } = useProfile(id as string, isMe);
    const profileId = profile?.id ?? "";

    const { data: feedPaging, fetchNextPage: fetchNextPosts, hasNextPage: hasNextPosts, isFetchingNextPage: isFetchingPosts, refetch: refetchPosts } = useProfileFeed(profileId);
    const posts = useMemo(() => feedPaging?.pages.flatMap(p => p.data) || [], [feedPaging]);

    const { data: photosPaging, fetchNextPage: fetchNextPhotos, hasNextPage: hasNextPhotos, isFetchingNextPage: isFetchingPhotos, refetch: refetchPhotos } = useInfiniteMedia(profileId, 'photo');
    const images = useMemo(() => photosPaging?.pages.flatMap(p => p.data) || [], [photosPaging]);

    const { data: videosPaging, fetchNextPage: fetchNextVideos, hasNextPage: hasNextVideos, isFetchingNextPage: isFetchingVideos, refetch: refetchVideos } = useInfiniteMedia(profileId, 'video');
    const videos = useMemo(() => videosPaging?.pages.flatMap(p => p.data) || [], [videosPaging]);

    const { data: socialPaging } = useInfiniteSocialLinks(profileId);
    const socialLinks = useMemo(() => socialPaging?.pages.flatMap(p => p.data) || [], [socialPaging]);

    const { data: addressPaging } = useInfiniteAddresses(profileId);
    const addresses = useMemo(() => addressPaging?.pages.flatMap(p => p.data) || [], [addressPaging]);

    const { data: workplacePaging } = useInfiniteWorkplaces(profileId);
    const workplaces = useMemo(() => workplacePaging?.pages.flatMap(p => p.data) || [], [workplacePaging]);

    const imageViewerItems = useMemo<MediaViewerItem[]>(() =>
        images.map(item => {
            const fullUrl = choosenMediaPath(item) || 'https://picsum.photos/200';
            const thumbUrl = item.thumbnail_url || fullUrl;
            return {
                type: 'image' as const,
                source: fullUrl,
                thumbnail: { source: thumbUrl },
                blurhash: resolveBlurhash(item.blurhash, item.id || fullUrl),
            };
        }), [images]);

    const videoViewerItems = useMemo<MediaViewerItem[]>(() =>
        videos.map(item => {
            const fullUrl = choosenMediaPath(item) || 'https://picsum.photos/200';
            const thumbUrl = item.thumbnail_url || fullUrl;
            return {
                type: 'video' as const,
                source: fullUrl,
                thumbnail: {
                    source: thumbUrl,
                    blurhash: resolveBlurhash(item.blurhash, item.id || fullUrl),
                },
            };
        }), [videos]);

    const imageCount = photosPaging?.pages[0]?.pagination?.total || 0;
    const videoCount = videosPaging?.pages[0]?.pagination?.total || 0;
    const postCount = feedPaging?.pages[0]?.pagination?.total || 0;

    const { data: musicPaging } = useInfiniteMusic(profileId);
    const music = useMemo(() => musicPaging?.pages.flatMap(p => p.data) || [], [musicPaging]);
    const currentTrack = music[0];
    const hasMusic = !!currentTrack;
    const profileMusicId = currentTrack ? `profile-music-${currentTrack.id}` : null;
    const isMusicPlaying = profileMusicId ? currentlyPlayingId === profileMusicId : false;

    const handleMusicPress = useCallback(() => {
        if (!currentTrack?.preview_url || !profileMusicId) return;
        if (isMusicPlaying) {
            stopPlayback();
        } else {
            playTrack(profileMusicId, currentTrack.preview_url, {
                title: currentTrack.title,
                artist: currentTrack.artist,
                coverUrl: currentTrack.cover_url,
            });
        }
    }, [currentTrack, profileMusicId, isMusicPlaying, playTrack, stopPlayback]);



    const scrollToTop = useCallback(() => {
        // Dummy implementation for now
    }, []);

    const flagCode = useMemo(() => {
        if (!profile?.hometown) return null;
        const parts = profile.hometown.split(',');
        const potentialCountry = parts[parts.length - 1].trim();
        return countries.getAlpha2Code(potentialCountry, "en");
    }, [profile?.hometown]);

    const onStartRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const tasks = [refetchProfile()];
            if (profile?.id) {
                tasks.push(refetchPosts(), refetchPhotos(), refetchVideos());
            }
            await Promise.all(tasks);
        } finally {
            setIsRefreshing(false);
        }
    }, [refetchProfile, refetchPosts, refetchPhotos, refetchVideos, profile?.id]);

    // Collapsible header content
    const renderHeader = useCallback((translateYValue?: SharedValue<number>) => {
        const animatedCoverStyle = useAnimatedStyle(() => {
            if (!translateYValue) return {};
            const translateY = translateYValue.value;
            if (translateY > 0) {
                return {
                    transform: [
                        { translateY: translateY / 2 },
                        { scale: 1 + translateY / 150 }
                    ]
                };
            }
            return {};
        });

        return (
            <View style={[styles.headerContainer, { backgroundColor: 'transparent' }]}>
                <View style={{ height: insets.top + 12 }} />
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }} pointerEvents="box-none">
                    <View style={{ borderRadius: 999, overflow: 'hidden', marginRight: 8, backgroundColor: colors.card }}>
                        <TouchableOpacity onPress={() => router.back()} style={{ borderRadius: 999, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}>
                            <Ionicons name='chevron-back' size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity activeOpacity={0.8} onPress={() => musicSheetRef.current?.present()} style={{ height: 40, width: 150 }}>
                        <View style={[styles.blurWrapper, { backgroundColor: colors.card }]}>
                            <View style={styles.blurContent}>
                                <SpinningArtwork isMusicPlaying={isMusicPlaying} hasMusic={hasMusic} coverUrl={currentTrack?.cover_url} onPress={handleMusicPress} colors={{ ...colors, text: 'white' }} />
                                <View style={styles.textContainer}>
                                    <FlexText style={[styles.titleText, { color: colors.text }]} numberOfLines={1}>{hasMusic ? currentTrack?.title : t("profile.music.addMusic")}</FlexText>
                                    <FlexText style={[styles.artistText, { color: colors.text }]} numberOfLines={1}>{hasMusic ? currentTrack?.artist : t("profile.music.selectTrack")}</FlexText>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
                <SquircleView borderRadius={16} cornerSmoothing={100} preserveSmoothing style={styles.coverContainer}>
                    <NitroImage
                        image={{ url: profile?.cover_url || "https://picsum.photos/1000" }}
                        style={styles.coverImage}
                        resizeMode="cover"
                    />
                </SquircleView>
                <View style={styles.avatarRow}>
                    <Avatar>
                        <Avatar.Image source={{ uri: profile?.avatar_url }} />
                        <Avatar.Fallback>{profile?.name?.[0] || 'U'}</Avatar.Fallback>
                    </Avatar>
                    <View className="flex-row gap-2">
                        <Button variant="secondary" isIconOnly onPress={() => briefSheetRef.current?.present()}>
                            <NotesBold color={colors.text} size={34} />
                        </Button>
                        <SquircleView borderRadius={999} cornerSmoothing={100} preserveSmoothing style={styles.editButton}>
                            <TouchableOpacity>
                                <FlexText style={{ color: '#fff', fontWeight: "bold", fontSize: 16 }}>{t("profile.header.actions.addLove")}</FlexText>
                            </TouchableOpacity>
                        </SquircleView>
                    </View>
                </View>
                <View className="flex-row items-center gap-1 mb-1">
                    <FlexText style={[common.headline, { fontWeight: 'bold' }]}>{profile?.name || 'Loading...'}</FlexText>
                    {profile?.is_verified && <VerifiedIcon size={16} backgroundColor={colors.verify} />}
                    {flagCode && <CountryFlag isoCode={flagCode} size={14} style={{ borderRadius: 2 }} />}
                </View>
                <FlexText style={[common.body, { color: colors.muted, marginBottom: 8 }]}>@{profile?.username || 'loading'}</FlexText>
                <FlexText style={[common.body, { marginBottom: 8 }]}>{profile?.bio || t("profile.info.noAdditionalInformation")}</FlexText>

                {profile && (
                    <FamilyStackSection
                        vm={{ common, colors }}
                        profile={profile}
                        onPress={() => familySheetRef?.current?.present()}
                    />
                )}

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={headerStyles.cardsScroll}
                    contentContainerStyle={headerStyles.cardsScrollContent}
                >
                    {profile?.birthday && <BirthdayCard birthday={profile.birthday} />}

                    {profile?.has_facebook && (
                        <HeaderInfoCard
                            onPress={() => router.push({ pathname: '/fprofile', params: { profile: JSON.stringify(profile) } })}
                            backgroundColor="#1877F2"
                            textColor="#FFF"
                            labelStyle={common.label}
                            leading={(
                                <View style={headerStyles.facebookIconBubble}>
                                    <Ionicons name="logo-facebook" size={28} color="#FFF" />
                                </View>
                            )}
                        >
                            {t('profile.header.cards.facebookProfile')}
                        </HeaderInfoCard>
                    )}

                    {socialLinks.length > 0 && (
                        <HeaderInfoCard
                            onPress={() => socialSheetRef?.current?.present()}
                            backgroundColor={colors.card}
                            backgroundImageUri={SOCIAL_BG_URL}
                            showDimOverlay
                            textColor="white"
                            centerText
                            labelStyle={common.label}
                        >
                            {socialLinks.length} {t('profile.header.countSocialLinks', { count: socialLinks.length })}
                        </HeaderInfoCard>
                    )}

                    {addresses.length > 0 && (
                        <HeaderInfoCard
                            onPress={() => addressSheetRef?.current?.present()}
                            backgroundColor={colors.card}
                            showTintOverlay={colors.text}
                            labelStyle={common.label}
                            leading={(
                                <View style={[headerStyles.iconBubble, { backgroundColor: colors.card }]}>
                                    <PointOnMapBold size={28} color={colors.text} />
                                </View>
                            )}
                        >
                            {addresses.length} {t('profile.header.countAddresses', { count: addresses.length })}
                        </HeaderInfoCard>
                    )}

                    {workplaces.length > 0 && (
                        <HeaderInfoCard
                            onPress={() => workplaceSheetRef?.current?.present()}
                            backgroundColor={colors.card}
                            showTintOverlay={colors.text}
                            labelStyle={common.label}
                            leading={(
                                <View style={[headerStyles.iconBubble, { backgroundColor: colors.card }]}>
                                    <CaseMinimalisticBold size={28} color={colors.text} />
                                </View>
                            )}
                        >
                            {workplaces.length} {t('profile.header.countWorkplaces', { count: workplaces.length })}
                        </HeaderInfoCard>
                    )}
                </ScrollView>

                <View className="flex-row gap-2" style={{ marginBottom: insets.top }}>
                    <FlexText style={{ color: colors.text }}>{postCount} <FlexText style={{ fontWeight: 'bold', color: colors.muted, textTransform: 'capitalize' }}>{t("profile.header.countPosts", { count: postCount })}</FlexText></FlexText>
                    <FlexText style={{ color: colors.text }}>{imageCount} <FlexText style={{ fontWeight: 'bold', color: colors.muted, textTransform: 'capitalize' }}>{t("profile.header.countImages", { count: imageCount })}</FlexText></FlexText>
                    <FlexText style={{ color: colors.text }}>{videoCount} <FlexText style={{ fontWeight: 'bold', color: colors.muted, textTransform: 'capitalize' }}>{t("profile.header.countVideos", { count: videoCount })}</FlexText></FlexText>
                </View>
            </View>
        );
    }, [profile, colors, common, insets.top, postCount, imageCount, videoCount, isMusicPlaying, hasMusic, currentTrack?.cover_url, currentTrack?.title, currentTrack?.artist, handleMusicPress, t, flagCode, briefSheetRef]);

    const renderPostItem = useCallback(({ item }: { item: any }) => (
        <PostItem
            post={item}
            onOptionsPress={handleOptionsPress}
            onLikeCountPress={handleLikeCountPress}
            onCommentPress={handleCommentPress}
        />
    ), [handleOptionsPress, handleLikeCountPress, handleCommentPress]);


    // Tab scenes
    const renderScene = useCallback(({ route }: any) => {
        switch (route.key) {
            case "posts":
                return (
                    <TabFlatList
                        index={0}
                        data={posts}
                        renderItem={renderPostItem}
                        keyExtractor={(item: any) => item.id}
                        showsVerticalScrollIndicator={false}
                        removeClippedSubviews
                        maxToRenderPerBatch={5}
                        windowSize={5}
                        initialNumToRender={5}
                        onEndReached={() => {
                            if (hasNextPosts && !isFetchingPosts) fetchNextPosts();
                        }}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={isFetchingPosts ? (
                            <SkeletonGroup variant="pulse" style={{ padding: 16, gap: 12 }}>
                                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                                    <Skeleton style={{ width: 40, height: 40, borderRadius: 20 }} />
                                    <View style={{ gap: 8, flex: 1 }}>
                                        <Skeleton style={{ width: '60%', height: 12, borderRadius: 4 }} />
                                        <Skeleton style={{ width: '40%', height: 10, borderRadius: 4 }} />
                                    </View>
                                </View>
                                <Skeleton style={{ width: '100%', height: 200, borderRadius: 12 }} />
                            </SkeletonGroup>
                        ) : null}
                    />
                );
            case "images":
                return (
                    <MediaViewer
                        items={imageViewerItems}
                        config={{ theme: 'dark', thumbnail: { fit: 'cover' } }}
                        renderLayout={({ renderItem: renderMediaViewerItem }) => (
                            <TabFlatList
                                index={1}
                                data={images}
                                numColumns={3}
                                renderItem={({ item, index: idx }: { item: any; index: number }) => (
                                    <View style={styles.gridItem}>
                                        {renderMediaViewerItem(idx, {
                                            frame: { width: GRID_ITEM_SIZE, height: GRID_ITEM_SIZE, borderRadius: 0 },
                                        })}
                                    </View>
                                )}
                                keyExtractor={(item: any) => item.id}
                                showsVerticalScrollIndicator={false}
                                removeClippedSubviews
                                maxToRenderPerBatch={9}
                                windowSize={5}
                                initialNumToRender={9}
                                onEndReached={() => {
                                    if (hasNextPhotos && !isFetchingPhotos) fetchNextPhotos();
                                }}
                                onEndReachedThreshold={0.5}
                                ListFooterComponent={isFetchingPhotos ? (
                                    <SkeletonGroup variant="pulse" style={{ flexDirection: 'row', padding: 1, gap: 2 }}>
                                        <Skeleton style={{ width: GRID_ITEM_SIZE, height: GRID_ITEM_SIZE, borderRadius: 0 }} />
                                        <Skeleton style={{ width: GRID_ITEM_SIZE, height: GRID_ITEM_SIZE, borderRadius: 0 }} />
                                        <Skeleton style={{ width: GRID_ITEM_SIZE, height: GRID_ITEM_SIZE, borderRadius: 0 }} />
                                    </SkeletonGroup>
                                ) : null}
                            />
                        )}
                    />
                );
            case "videos":
                return (
                    <MediaViewer
                        items={videoViewerItems}
                        config={{ theme: 'dark', thumbnail: { fit: 'cover', videoMode: 'static' } }}
                        renderLayout={({ renderItem: renderMediaViewerItem }) => (
                            <TabFlatList
                                index={2}
                                data={videos}
                                numColumns={3}
                                renderItem={({ item, index: idx }: { item: any; index: number }) => (
                                    <View style={styles.gridItem}>
                                        {renderMediaViewerItem(idx, {
                                            frame: { width: GRID_ITEM_SIZE, height: GRID_ITEM_SIZE, borderRadius: 0 },
                                        })}
                                    </View>
                                )}
                                keyExtractor={(item: any) => item.id}
                                showsVerticalScrollIndicator={false}
                                removeClippedSubviews
                                maxToRenderPerBatch={9}
                                windowSize={5}
                                initialNumToRender={9}
                                onEndReached={() => {
                                    if (hasNextVideos && !isFetchingVideos) fetchNextVideos();
                                }}
                                onEndReachedThreshold={0.5}
                                ListFooterComponent={isFetchingVideos ? (
                                    <SkeletonGroup variant="pulse" style={{ flexDirection: 'row', padding: 1, gap: 2 }}>
                                        <Skeleton style={{ width: GRID_ITEM_SIZE, height: GRID_ITEM_SIZE, borderRadius: 0 }} />
                                        <Skeleton style={{ width: GRID_ITEM_SIZE, height: GRID_ITEM_SIZE, borderRadius: 0 }} />
                                        <Skeleton style={{ width: GRID_ITEM_SIZE, height: GRID_ITEM_SIZE, borderRadius: 0 }} />
                                    </SkeletonGroup>
                                ) : null}
                            />
                        )}
                    />
                );
            default:
                return null;
        }
    }, [posts, images, videos, imageViewerItems, videoViewerItems, hasNextPosts, isFetchingPosts, fetchNextPosts, hasNextPhotos, isFetchingPhotos, fetchNextPhotos, hasNextVideos, isFetchingVideos, fetchNextVideos, renderPostItem]);

    const renderTabBar = useCallback((props: any) => (
        <View className="mb-4">
            <Tabs
                value={routes[props.navigationState.index].key}
                onValueChange={(val: string) => {
                    const newIndex = routes.findIndex(r => r.key === val);
                    if (newIndex >= 0) props.jumpTo(routes[newIndex].key);
                }}
                style={{ paddingHorizontal: 12 }}
            >
                <Tabs.List>
                    <Tabs.ScrollView scrollAlign="center">
                        <Tabs.Indicator />
                        {routes.map((route) => (
                            <Tabs.Trigger key={route.key} value={route.key}>
                                <Tabs.Label>{route.title}</Tabs.Label>
                            </Tabs.Trigger>
                        ))}
                    </Tabs.ScrollView>
                </Tabs.List>
            </Tabs>
        </View>
    ), [routes]);

    if (isProfileLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.background, paddingHorizontal: 12, paddingTop: insets.top + 12 }}>
                <SkeletonGroup variant="pulse" style={{ width: '100%', gap: 16 }}>
                    <Skeleton style={{ width: '100%', height: 150, borderRadius: 16 }} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                        <Skeleton style={{ width: 80, height: 80, borderRadius: 40 }} />
                        <Skeleton style={{ width: 120, height: 36, borderRadius: 18 }} />
                    </View>
                    <Skeleton style={{ width: '40%', height: 24, borderRadius: 4, marginTop: 8 }} />
                    <Skeleton style={{ width: '30%', height: 16, borderRadius: 4, marginTop: 4 }} />
                    <View style={{ flexDirection: 'row', gap: 16, marginTop: 16 }}>
                        <Skeleton style={{ width: 60, height: 16, borderRadius: 4 }} />
                        <Skeleton style={{ width: 60, height: 16, borderRadius: 4 }} />
                    </View>
                    <Skeleton style={{ width: '100%', height: 40, borderRadius: 8, marginTop: 16 }} />
                </SkeletonGroup>
            </View>
        );
    }

    const renderRefreshControl = useCallback(() => (
        <View style={{ width: '100%', alignItems: 'center', paddingTop: insets.top + 20 }}>
            <Spinner color={colors.text} size="lg" />
        </View>
    ), [colors.text, insets.top]);

    return (
        <View style={{ backgroundColor: colors.background, flex: 1 }}>
            <CollapsibleTabView
                renderRefreshControl={renderRefreshControl}
                isRefreshing={isRefreshing}
                onStartRefresh={onStartRefresh}
                refreshHeight={100}
                navigationState={navigationState}
                renderScene={renderScene}
                onIndexChange={setIndex}
                renderScrollHeader={renderHeader}
                minHeaderHeight={insets.top}
                animationHeaderPosition={animationHeaderPosition}
                animationHeaderHeight={animationHeaderHeight}
                lazy
                renderTabBar={renderTabBar}
            />
            <LikersSheet ref={likersSheetRef} postId={activePost?.id || null} />
            <CommentsSheet ref={commentsSheetRef} postId={activePost?.id || null} useReanimated={false} />
            <PostOptionsSheet
                ref={optionsSheetRef}
                post={activePost}
                currentProfileId={profileId}
            />
            <BriefInfoSheet
                ref={briefSheetRef}
                profile={profile}
                workplaces={[]}
                homeInfo={profile?.hometown || null}
            />
            <MusicSheet
                ref={musicSheetRef}
                data={music}
            />
            <RelationshipSheet
                ref={familySheetRef}
                data={profile?.loved_ones || []}
            />
            <SocialSheet
                ref={socialSheetRef}
                data={socialLinks}
            />
            <AddressSheet
                ref={addressSheetRef}
                data={addresses}
            />
            <WorkplaceSheet
                ref={workplaceSheetRef}
                data={workplaces}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContainer: {
        paddingHorizontal: 12,
    },
    coverContainer: {
        overflow: "hidden",
        width: '100%',
        marginBottom: 32,
    },
    coverImage: {
        height: 150,
        width: '100%',
    },
    avatarRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    editButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 32,
        justifyContent: "center",
        alignItems: "center",
    },
    gridItem: {
        width: GRID_ITEM_SIZE,
        height: GRID_ITEM_SIZE,
        padding: 1,
        overflow: "hidden"
    },
    gridImage: {
        width: '100%',
        height: '100%',
    },
    blurWrapper: {
        borderRadius: 999,
        overflow: 'hidden',
        height: 40,
        maxWidth: 200,
        justifyContent: 'center',
    },
    blurContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 4,
        paddingVertical: 0,
        height: '100%',
        gap: 8,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingRight: 12,
    },
    titleText: {
        fontSize: 13,
        fontWeight: '600',
        lineHeight: 16,
    },
    artistText: {
        fontSize: 11,
        opacity: 0.7,
        lineHeight: 14,
    },
});

export default ProfileNew;