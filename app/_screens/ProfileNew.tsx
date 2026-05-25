import { FlexText } from "@/components/FlexText";
import { PostItem } from "@/components/PostItem";
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
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { TrueSheet } from "@lodev09/react-native-true-sheet";

import { CaseMinimalisticBold, NotesBold, PointOnMapBold } from "@solar-icons/react-native";

import { useLocalSearchParams, useRouter } from "expo-router";
import { SquircleView } from "expo-squircle-view";
import { Avatar, Button, Skeleton, SkeletonGroup, Spinner, Tabs } from "heroui-native";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { NitroImage } from "react-native-nitro-image";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LikersSheet, PostOptionsSheet } from "@/components/post";
import { CommentsSheet } from "@/components/post/CommentsSheet";
import type { PostOptionsSheetHandle } from "@/components/post/PostOptionsSheet";
import { useGalleryStore } from "@/stores/gallery";
import { Post } from "@/types/post";
import type { LikersSheetHandle } from "@/types/sheetHandles";
import { PlayBold } from "@solar-icons/react-native";
import { RTVFlatList, TabView, type HeaderRendererProps, type Route, type TabViewMethods } from 'reanimated-tab-view';


import BirthdayCard from "@/components/profile/BirthdayCard";
import { FamilyStackSection } from "@/components/profile/header/parts";
import { BriefInfoSheet } from "@/components/profile/sheets/BriefInfoSheet";
import VerifiedIcon from "@/icons/verified";
import { Image } from "expo-image";
import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";
import CountryFlag from "react-native-country-flag";
import { Pressable } from "react-native-gesture-handler";

countries.registerLocale(en);

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_ITEM_SIZE = SCREEN_WIDTH / 3;

type ProfileHeaderProps = {
    profile: any;
    colors: any;
    common: any;
    insets: { top: number };
    postCount: number;
    imageCount: number;
    videoCount: number;
    isMusicPlaying: boolean;
    hasMusic: boolean;
    currentTrack: any;
    handleMusicPress: () => void;
    flagCode: string | null | undefined;
    t: any;
    router: any;
    socialLinks: any[];
    addresses: any[];
    workplaces: any[];
    briefSheetRef: React.RefObject<TrueSheet | null>;
    musicSheetRef: React.RefObject<TrueSheet | null>;
    familySheetRef: React.RefObject<TrueSheet | null>;
    socialSheetRef: React.RefObject<TrueSheet | null>;
    addressSheetRef: React.RefObject<TrueSheet | null>;
    workplaceSheetRef: React.RefObject<TrueSheet | null>;
    isOwner: boolean;
};

const ProfileHeader = React.memo(({
    profile,
    colors,
    common,
    insets,
    postCount,
    imageCount,
    videoCount,
    isMusicPlaying,
    hasMusic,
    currentTrack,
    handleMusicPress,
    flagCode,
    t,
    router,
    socialLinks,
    addresses,
    workplaces,
    briefSheetRef,
    musicSheetRef,
    familySheetRef,
    socialSheetRef,
    addressSheetRef,
    workplaceSheetRef,
    isOwner,
}: ProfileHeaderProps) => {

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
                        <TouchableOpacity onPress={() => {
                            if (isOwner) {
                                router.push({
                                    pathname: '/profile/edit-profile',
                                    params: { id: profile?.id || 'me' }
                                });
                            } else {
                                // Add love action
                            }
                        }}>
                            <FlexText style={{ color: '#fff', fontWeight: "bold", fontSize: 16 }}>
                                {isOwner ? t('profile.header.actions.editProfile', 'Edit Profile') : t("profile.header.actions.addLove")}
                            </FlexText>
                        </TouchableOpacity>
                    </SquircleView>
                </View>
            </View>
            <View className="flex-row items-center gap-1 mb-1">
                <FlexText style={[common.headline, { fontWeight: 'bold' }]}>{profile?.name}</FlexText>
                {profile?.is_verified && <VerifiedIcon size={16} backgroundColor={colors.verify} />}
                {flagCode && <CountryFlag isoCode={flagCode} size={14} style={{ borderRadius: 2 }} />}
            </View>
            {!!profile?.username && (
                <FlexText style={[common.body, { color: colors.muted, marginBottom: 8 }]}>@{profile.username}</FlexText>
            )}
            {!!profile?.bio && (
                <FlexText style={[common.body, { marginBottom: 8 }]}>{profile.bio}</FlexText>
            )}

            {profile && (
                <FamilyStackSection
                    vm={{ common, colors }}
                    profile={profile}
                    onPress={() => familySheetRef?.current?.present()}
                />
            )}

            {(!!profile?.birthday || !!profile?.has_facebook || socialLinks.length > 0 || addresses.length > 0 || workplaces.length > 0) && (
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
            )}

            <View className="flex-row gap-2" style={{ marginBottom: 12 }}>
                <FlexText style={{ color: colors.text }}>{postCount} <FlexText style={{ fontWeight: 'bold', color: colors.muted, textTransform: 'capitalize' }}>{t("profile.header.countPosts", { count: postCount })}</FlexText></FlexText>
                <FlexText style={{ color: colors.text }}>{imageCount} <FlexText style={{ fontWeight: 'bold', color: colors.muted, textTransform: 'capitalize' }}>{t("profile.header.countImages", { count: imageCount })}</FlexText></FlexText>
                <FlexText style={{ color: colors.text }}>{videoCount} <FlexText style={{ fontWeight: 'bold', color: colors.muted, textTransform: 'capitalize' }}>{t("profile.header.countVideos", { count: videoCount })}</FlexText></FlexText>
            </View>
        </View>
    );
});

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
    const tabViewRef = useRef<TabViewMethods>(null);

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
    
    // Fetch current user's profile to robustly check if viewing own profile
    const { data: myProfile } = useProfile('me', true);
    const isMe = params.isMe === 'true' || id === 'me' || !id || (!!myProfile?.id && id === myProfile.id);
    const isOwner = isMe || !!myProfile?.is_admin;

    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);

    const [index, setIndex] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const routes = useMemo<Route[]>(() => [
        { key: "posts", title: t("profile.tabs.feed") },
        { key: "images", title: t("profile.tabs.images") },
        { key: "videos", title: t("profile.tabs.videos") },
    ], [t]);
    const navigationState = useMemo(() => ({ index, routes }), [index, routes]);

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

    const imageCount = photosPaging?.pages[0]?.pagination?.total || 0;
    const videoCount = videosPaging?.pages[0]?.pagination?.total || 0;
    const postCount = feedPaging?.pages[0]?.pagination?.total || 0;

    const { data: musicPaging } = useInfiniteMusic(profileId);
    const music = useMemo(() => musicPaging?.pages.flatMap(p => p.data) || [], [musicPaging]);
    const currentTrack = music[0];
    const hasMusic = !!currentTrack;
    const profileMusicId = currentTrack ? `profile-music-${currentTrack.id}` : null;
    const isMusicPlaying = profileMusicId ? currentlyPlayingId === profileMusicId : false;

    const openGallery = useGalleryStore(state => state.openGallery);

    const galleryImages = useMemo(() =>
        images.map(m => ({
            uri: choosenMediaPath(m) || 'https://picsum.photos/200',
            caption: m.caption || undefined,
            profileName: profile?.name,
            isVerified: profile?.is_verified,
            musicUrl: currentTrack?.preview_url,
            musicTitle: currentTrack?.title,
            blurhash: m.blurhash,
        })),
        [images, profile?.name, profile?.is_verified, currentTrack?.preview_url, currentTrack?.title]);

    const handlePhotoPress = useCallback((photoIndex: number) => {
        openGallery(galleryImages, photoIndex);
    }, [openGallery, galleryImages]);

    const handleVideoPress = useCallback((video: any) => {
        const videoUrl = choosenMediaPath(video);
        router.push({
            pathname: '/video_player',
            params: {
                videoUrl,
                name: profile?.name || 'Video',
                caption: video.caption || '',
                portrait: 'true',
            }
        });
    }, [router, profile?.name]);

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

    // Collapsible header content – reanimated-tab-view API
    const renderHeader = useCallback((_props: HeaderRendererProps) => {
        return (
            <ProfileHeader
                profile={profile}
                colors={colors}
                common={common}
                insets={insets}
                postCount={postCount}
                imageCount={imageCount}
                videoCount={videoCount}
                isMusicPlaying={isMusicPlaying}
                hasMusic={hasMusic}
                currentTrack={currentTrack}
                handleMusicPress={handleMusicPress}
                flagCode={flagCode}
                t={t}
                router={router}
                socialLinks={socialLinks}
                addresses={addresses}
                workplaces={workplaces}
                briefSheetRef={briefSheetRef}
                musicSheetRef={musicSheetRef}
                familySheetRef={familySheetRef}
                socialSheetRef={socialSheetRef}
                addressSheetRef={addressSheetRef}
                workplaceSheetRef={workplaceSheetRef}
                isOwner={isOwner}
            />
        );
    }, [profile, colors, common, insets, postCount, imageCount, videoCount, isMusicPlaying, hasMusic, currentTrack, handleMusicPress, flagCode, t, router, socialLinks, addresses, workplaces, isOwner]);

    const renderPostItem = useCallback(({ item }: { item: any }) => (
        <PostItem
            post={item}
            onOptionsPress={handleOptionsPress}
            onLikeCountPress={handleLikeCountPress}
            onCommentPress={handleCommentPress}
        />
    ), [handleOptionsPress, handleLikeCountPress, handleCommentPress]);


    const renderImageItem = useCallback(({ item, index: idx }: { item: any; index: number }) => {
        const isFirst = idx === 0;
        const isTopRight = idx === 2 || (idx === 1 && images.length === 2) || (idx === 0 && images.length === 1);

        return (
            <Pressable
                onPress={() => handlePhotoPress(idx)}
                style={[
                    styles.gridItem,
                    isFirst && { borderTopLeftRadius: 16 },
                    isTopRight && { borderTopRightRadius: 16 }
                ]}
            >
                <Image
                    source={{ uri: choosenMediaPath(item) || 'https://picsum.photos/200' }}
                    style={{
                        width: '100%',
                        height: '100%',
                        borderTopLeftRadius: isFirst ? 16 : 0,
                        borderTopRightRadius: isTopRight ? 16 : 0
                    }}
                    contentFit="cover"
                />
            </Pressable>
        );
    }, [handlePhotoPress, images.length]);

    const renderVideoItem = useCallback(({ item, index: idx }: { item: any; index: number }) => {
        const videoHeight = GRID_ITEM_SIZE * (16 / 9);
        const isFirst = idx === 0;
        const isTopRight = idx === 2 || (idx === 1 && videos.length === 2) || (idx === 0 && videos.length === 1);

        return (
            <Pressable
                onPress={() => handleVideoPress(item)}
                style={[
                    styles.gridItem,
                    { height: videoHeight },
                    isFirst && { borderTopLeftRadius: 16 },
                    isTopRight && { borderTopRightRadius: 16 }
                ]}
            >
                <Image
                    source={{ uri: item.thumbnail_url || choosenMediaPath(item) || 'https://picsum.photos/200' }}
                    style={{
                        width: GRID_ITEM_SIZE,
                        height: videoHeight,
                        borderTopLeftRadius: isFirst ? 16 : 0,
                        borderTopRightRadius: isTopRight ? 16 : 0
                    }}
                    contentFit="cover"
                />
                <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    borderTopLeftRadius: isFirst ? 16 : 0,
                    borderTopRightRadius: isTopRight ? 16 : 0
                }}>
                    <PlayBold size={24} color="#ffffff" />
                </View>
            </Pressable>
        );
    }, [handleVideoPress, videos.length]);

    // Tab scenes
    const renderScene = useCallback(({ route }: any) => {
        switch (route.key) {
            case "posts":
                return (
                    <RTVFlatList
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
                        ListEmptyComponent={!isFetchingPosts ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="document-text-outline" size={48} color={colors.muted} />
                                <FlexText style={[common.body, { color: colors.text, fontWeight: 'bold', marginTop: 12 }]}>{t('profile.empty.feed.title')}</FlexText>
                                <FlexText style={[common.body, { color: colors.muted, marginTop: 4 }]}>{t('profile.empty.feed.message')}</FlexText>
                            </View>
                        ) : null}
                    />
                );
            case "images":
                return (
                    <RTVFlatList
                        data={images}
                        numColumns={3}
                        renderItem={renderImageItem}
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
                        ListEmptyComponent={!isFetchingPhotos ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="images-outline" size={48} color={colors.muted} />
                                <FlexText style={[common.body, { color: colors.text, fontWeight: 'bold', marginTop: 12 }]}>{t('profile.empty.images.title')}</FlexText>
                                <FlexText style={[common.body, { color: colors.muted, marginTop: 4 }]}>{t('profile.empty.images.message')}</FlexText>
                            </View>
                        ) : null}
                    />
                );
            case "videos":
                return (
                    <RTVFlatList
                        data={videos}
                        numColumns={3}
                        renderItem={renderVideoItem}
                        keyExtractor={(item: any) => item.id}
                        showsVerticalScrollIndicator={false}
                        removeClippedSubviews
                        maxToRenderPerBatch={9}
                        windowSize={5}
                        columnWrapperStyle={{ gap: 2 }}
                        ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
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
                        ListEmptyComponent={!isFetchingVideos ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="videocam-outline" size={48} color={colors.muted} />
                                <FlexText style={[common.body, { color: colors.text, fontWeight: 'bold', marginTop: 12 }]}>{t('profile.empty.videos.title')}</FlexText>
                                <FlexText style={[common.body, { color: colors.muted, marginTop: 4 }]}>{t('profile.empty.videos.message')}</FlexText>
                            </View>
                        ) : null}
                    />
                );
            default:
                return null;
        }
    }, [posts, images, videos, hasNextPosts, isFetchingPosts, fetchNextPosts, hasNextPhotos, isFetchingPhotos, fetchNextPhotos, hasNextVideos, isFetchingVideos, fetchNextVideos, renderPostItem, renderImageItem, renderVideoItem]);

    const tabBarConfig = useMemo(() => ({
        renderTabBar: () => (
            <Tabs
                value={routes[index].key}
                onValueChange={(val: string) => {
                    const newIndex = routes.findIndex(r => r.key === val);
                    if (newIndex >= 0) tabViewRef.current?.jumpTo(routes[newIndex].key);
                }}
                style={{ paddingHorizontal: 8 }}
            >
                <Tabs.List>
                    <Tabs.ScrollView scrollAlign="center">
                        <Tabs.Indicator />
                        {routes.map((route: Route) => (
                            <Tabs.Trigger key={route.key} value={route.key}>
                                <Tabs.Label>{route.title}</Tabs.Label>
                            </Tabs.Trigger>
                        ))}
                    </Tabs.ScrollView>
                </Tabs.List>
            </Tabs>
        ),
    }), [routes, index]);

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
            <TabView
                ref={tabViewRef}
                navigationState={navigationState}
                renderScene={renderScene}
                onIndexChange={setIndex}
                renderHeader={renderHeader}
                renderMode="lazy"
                jumpMode="smooth"
                tabBarConfig={tabBarConfig}
                initialLayout={{
                    tabView: { width: SCREEN_WIDTH },
                    tabViewHeader: { width: SCREEN_WIDTH, height: 800 },
                }}
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
                profileId={profileId}
                isOwner={isOwner}
            />
            <RelationshipSheet
                ref={familySheetRef}
                data={profile?.loved_ones || []}
            />
            <SocialSheet
                ref={socialSheetRef}
                data={socialLinks}
                profileId={profileId}
                isOwner={isOwner}
            />
            <AddressSheet
                ref={addressSheetRef}
                data={addresses}
                profileId={profileId}
                isOwner={isOwner}
            />
            <WorkplaceSheet
                ref={workplaceSheetRef}
                data={workplaces}
                profileId={profileId}
                isOwner={isOwner}
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
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
    },
});

export default ProfileNew;