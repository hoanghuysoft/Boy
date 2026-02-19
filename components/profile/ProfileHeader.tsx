import VerifiedIcon from '@/icons/verified';
import { getTiktokProfile } from '@/services/tiktok';
import FastImage from '@d11/react-native-fast-image';
import { MeshGradient } from '@kuss/react-native-mesh-gradient';
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { Galeria } from '@nandorojo/galeria';
import { CaseMinimalisticBold, PlayCircleBold, PlayCircleOutline, PointOnMapBold } from '@solar-icons/react-native';
import { SquircleView } from 'expo-squircle-view';
import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
    Animated,
    Dimensions,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import CountryFlag from "react-native-country-flag";
import { getColors } from 'react-native-image-colors';
import { createMMKV } from 'react-native-mmkv';
import { useThemeContext } from "../../context/ThemeContext";
import { useAudioStore } from '../../stores/audio';
import { createCommonStyles } from "../../styles/common";
import { ProfileAddress } from "../../types/profileaddress";
import { ProfileDetail } from "../../types/profiledetail";
import { ProfileLink } from "../../types/profilelink";
import { ProfileMusic } from "../../types/profilemusic";
import { Workplace } from "../../types/profileworplace";
import { TabPillGroup } from "../tabpill";
import BirthdayCard from './BirthdayCard';
import DynamicAvatar from './DynamicAvatar';
import ProfileBriefInfo from './ProfileBriefInfo';
import QuickPreviewModal from './QuickPreviewModal';

const COVER_HEIGHT = 250;
const { height } = Dimensions.get("window");
const storage = createMMKV();

type TabType = "Information" | "Images" | "Videos" | "Feed";

interface ProfileHeaderProps {
    scrollY: Animated.Value;
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    tabContent?: React.ReactNode;
    profile?: ProfileDetail | null;
    isMe?: boolean;
    musicSheetRef?: React.RefObject<TrueSheet | null>;
    socialSheetRef?: React.RefObject<TrueSheet | null>;
    addressSheetRef?: React.RefObject<TrueSheet | null>;
    workplaceSheetRef?: React.RefObject<TrueSheet | null>;
    workplaces?: Workplace[];
    music?: ProfileMusic[];
    socialLinks?: ProfileLink[];
    addresses?: ProfileAddress[];
    onMusicEndReached?: () => void;
    onSocialEndReached?: () => void;
    onAddressesEndReached?: () => void;
    onWorkplacesEndReached?: () => void;
    imageCount?: number;
    videoCount?: number;
    postCount?: number;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = memo(({
    scrollY,
    activeTab,
    onTabChange,
    tabContent,
    profile,
    musicSheetRef,
    socialSheetRef,
    addressSheetRef,
    workplaceSheetRef,
    workplaces = [],
    music = [],
    socialLinks = [],
    addresses = [],
    onMusicEndReached,
    onSocialEndReached,
    onAddressesEndReached,
    onWorkplacesEndReached,
    imageCount = 0,
    videoCount = 0,
    postCount = 0,
    isMe = false,
}) => {
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const style = styles(colors);
    const { currentlyPlayingId, playTrack, stopPlayback } = useAudioStore();
    const [gradientColors, setGradientColors] = useState<string[]>([]);
    const [avatarPreviewVisible, setAvatarPreviewVisible] = useState(false);

    const PLACEHOLDER_COVER = "https://pbs.twimg.com/media/GeMS4yjWIAA14OG.jpg";
    const MESH_GRADIENT_DEFAULTS = {
        speed: 5,
        brightness: 0.8,
        contrast: 1.2,
        frequency: 5,
        amplitude: 30,
    };

    useEffect(() => {
        countries.registerLocale(en);
    }, []);

    const hasCover = !!profile?.cover_url;
    const currentMusic = music?.[0];
    const currentAvatar = profile?.avatar_url || null;
    const genderFallbackSource = profile?.gender === 'male'
        ? require('../../assets/images/AV17.png')
        : profile?.gender
            ? require('../../assets/images/AV86.png')
            : null;

    // Parse metadata to extract threed_emoji
    const parsedMetadata = useMemo(() => {
        if (!profile?.metadata) return null;
        try {
            return typeof profile.metadata === 'string'
                ? JSON.parse(profile.metadata)
                : profile.metadata;
        } catch {
            return null;
        }
    }, [profile?.metadata]);

    const threedEmoji = parsedMetadata?.threed_emoji || null;

    const primaryAddress = addresses.find(a => a.is_primary) || addresses[0];
    const homeInfo = profile?.hometown || (primaryAddress ? `${primaryAddress.city}${primaryAddress.country ? `, ${primaryAddress.country}` : ''}` : null);

    const flagCode = useMemo(() => {
        if (!homeInfo) return null;
        const parts = homeInfo.split(',');
        const potentialCountry = parts[parts.length - 1].trim();
        return countries.getAlpha2Code(potentialCountry, "en");
    }, [homeInfo]);

    // Extract colors for mesh gradient when cover is not available
    useEffect(() => {
        if (hasCover) {
            setGradientColors([]);
            return;
        }

        const extractColors = async () => {
            const imageSource = currentAvatar || PLACEHOLDER_COVER;
            const cacheKey = `mesh_colors_${imageSource}`;

            if (storage.contains(cacheKey)) {
                const cachedColors = storage.getString(cacheKey);
                if (cachedColors) {
                    setGradientColors(JSON.parse(cachedColors));
                    return;
                }
            }

            try {
                const colorsData = await getColors(imageSource, {
                    fallback: '#3b5998',
                    cache: true,
                    key: imageSource,
                });

                let extractedColors: string[] = [];

                if (colorsData.platform === 'android') {
                    // Prefer light colors for better visual effect
                    let lightColors: string[] = Object.entries(colorsData)
                        .filter(([key]) => key.includes('light_'))
                        .map(([_, value]) => value as string);

                    if (lightColors.length < 4) {
                        lightColors = lightColors.concat([
                            colorsData.average,
                            colorsData.dominant,
                            colorsData.vibrant,
                            colorsData.muted,
                        ].filter(Boolean) as string[]);
                    }
                    extractedColors = lightColors.slice(0, 4);
                } else if (colorsData.platform === 'ios') {
                    extractedColors = [
                        colorsData.primary,
                        colorsData.secondary,
                        colorsData.background,
                        colorsData.detail,
                    ].filter(Boolean) as string[];
                }

                while (extractedColors.length < 4) {
                    extractedColors.push(extractedColors[0] || '#3b5998');
                }
                extractedColors = extractedColors.slice(0, 4);

                setGradientColors(extractedColors);
                storage.set(cacheKey, JSON.stringify(extractedColors));
            } catch (error) {
                console.error('Failed to extract colors:', error);
                setGradientColors(['#667eea', '#764ba2', '#f093fb', '#f5576c']);
            }
        };

        extractColors();
    }, [hasCover, currentAvatar]);

    const coverTranslateY = scrollY.interpolate({
        inputRange: [-COVER_HEIGHT, 0, COVER_HEIGHT],
        outputRange: [-COVER_HEIGHT, 0, COVER_HEIGHT * 0.5],
        extrapolate: "clamp",
    });

    // Use a stable ID for the profile music player
    const profileMusicId = currentMusic ? `profile-music-${currentMusic.id}` : null;
    const isPlaying = profileMusicId ? currentlyPlayingId === profileMusicId : false;

    const handleInfoTab = useCallback(() => onTabChange("Information"), [onTabChange]);
    const handleImagesTab = useCallback(() => onTabChange("Images"), [onTabChange]);
    const handleVideosTab = useCallback(() => onTabChange("Videos"), [onTabChange]);
    const handleFeedTab = useCallback(() => onTabChange("Feed"), [onTabChange]);

    const toggleMusic = useCallback(() => {
        if (!currentMusic?.preview_url || !profileMusicId) return;

        if (isPlaying) {
            stopPlayback();
        } else {
            playTrack(profileMusicId, currentMusic.preview_url, {
                title: currentMusic.title,
                artist: currentMusic.artist,
                coverUrl: currentMusic.cover_url,
            });
        }
    }, [currentMusic, profileMusicId, isPlaying, playTrack, stopPlayback]);

    const testTiktokProfile = async () => {
        const res = await getTiktokProfile("dreww_ohi7")
    }

    const tabs = useMemo(() => [
        { name: "Images", onClick: handleImagesTab },
        { name: "Videos", onClick: handleVideosTab },
        { name: "Feed", onClick: handleFeedTab },
        { name: "Information", onClick: handleInfoTab },
    ], [handleInfoTab, handleImagesTab, handleVideosTab, handleFeedTab]);

    return (
        <>
            {hasCover ? (
                <Animated.Image
                    source={{
                        uri: profile?.cover_url,
                        cache: 'force-cache'
                    }}
                    style={[
                        style.coverImage,
                        {
                            transform: [{ translateY: coverTranslateY }],
                        },
                    ]}
                    resizeMode="cover"
                />
            ) : (
                <Animated.View
                    style={[
                        style.coverImage,
                        {
                            transform: [{ translateY: coverTranslateY }],
                        },
                    ]}
                >
                    {gradientColors.length === 4 && (
                        <MeshGradient
                            brightness={MESH_GRADIENT_DEFAULTS.brightness}
                            contrast={MESH_GRADIENT_DEFAULTS.contrast}
                            speed={MESH_GRADIENT_DEFAULTS.speed}
                            colors={gradientColors}
                            frequency={MESH_GRADIENT_DEFAULTS.frequency}
                            amplitude={MESH_GRADIENT_DEFAULTS.amplitude}
                            style={style.meshGradient}
                        />
                    )}
                </Animated.View>
            )}
            <SquircleView cornerSmoothing={100} preserveSmoothing style={{
                borderRadius: 8,
                marginTop: -8,
                backgroundColor: colors.background,
            }}>

                <View style={common.screenPadding}>
                    <View style={[common.row, { marginTop: -55, gap: 12, alignItems: 'stretch' }]}>
                        {threedEmoji ? (
                            <>
                                <Pressable
                                    onLongPress={() => setAvatarPreviewVisible(true)}
                                    onPressOut={() => setAvatarPreviewVisible(false)}
                                    delayLongPress={200}
                                >
                                    <DynamicAvatar
                                        uri={currentAvatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                        threedEmoji={threedEmoji}
                                        styles={common.avatarLarge}
                                    />
                                </Pressable>
                                <QuickPreviewModal
                                    visible={avatarPreviewVisible}
                                    imageUrl={currentAvatar}
                                    onClose={() => setAvatarPreviewVisible(false)}
                                />
                            </>
                        ) : currentAvatar ? (
                            <Galeria urls={[currentAvatar]}>
                                <Galeria.Image>
                                    <Image
                                        source={{ uri: currentAvatar }}
                                        resizeMode="cover"
                                        style={common.avatarLarge}
                                    />
                                </Galeria.Image>
                            </Galeria>
                        ) : genderFallbackSource ? (
                            <FastImage
                                source={genderFallbackSource}
                                resizeMode={FastImage.resizeMode.cover}
                                style={common.avatarLarge}
                            />
                        ) : (
                            <FastImage
                                source={{ uri: "https://cdn-icons-png.flaticon.com/512/149/149071.png" }}
                                resizeMode={FastImage.resizeMode.cover}
                                style={common.avatarLarge}
                            />
                        )}
                        <View style={{ flex: 1, paddingTop: 10, justifyContent: 'flex-end' }}>
                            <View style={[common.row, { gap: 4 }]}>
                                <Text style={[common.heading, { fontWeight: '700' }]}>{profile?.name || "Boy not found"}</Text>
                                {profile?.is_verified && <VerifiedIcon size={14} backgroundColor={colors.verify} />}
                                {flagCode && <CountryFlag isoCode={flagCode} size={12} style={{ borderRadius: 2, marginLeft: 4 }} />}
                            </View>
                            <View style={[common.row, { gap: 6, marginTop: 2 }]}>
                                <Text style={common.bodySmall}>
                                    <Text style={{ fontWeight: '700' }}>{imageCount}</Text> images
                                </Text>
                                <Text style={[common.bodySmall, { color: colors.muted }]}>·</Text>
                                <Text style={common.bodySmall}>
                                    <Text style={{ fontWeight: '700' }}>{videoCount}</Text> videos
                                </Text>
                                <Text style={[common.bodySmall, { color: colors.muted }]}>·</Text>
                                <Text style={common.bodySmall}>
                                    <Text style={{ fontWeight: '700' }}>{postCount}</Text> posts
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View>
                        {profile?.username && (
                            <Text style={[{ fontSize: 12, marginTop: 8, fontWeight: '700', color: colors.text }]}>
                                @{profile.username}
                            </Text>
                        )}
                        {profile?.pronouns && (
                            <Text style={[common.muted, { fontSize: 12, marginTop: 8 }]}>
                                {profile.pronouns}
                            </Text>
                        )}
                        {profile?.bio && (
                            <Text style={[common.bodySmall, { paddingTop: 8 }]}>
                                {profile.bio}
                            </Text>
                        )}

                        <ProfileBriefInfo profile={profile} workplaces={workplaces} homeInfo={homeInfo} />

                        <ScrollView
                            style={{ marginTop: 16, marginHorizontal: -16 }}
                            contentContainerStyle={{ paddingHorizontal: 16 }}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                        >

                            {profile?.birthday && (
                                <BirthdayCard birthday={profile.birthday} />
                            )}
                            {currentMusic && isMe && (
                                <TouchableOpacity
                                    onPress={() => musicSheetRef?.current?.present()}
                                    activeOpacity={0.9}
                                    style={{ height: 70, backgroundColor: colors.card, width: 170, borderRadius: 100, overflow: "hidden", justifyContent: "space-between", alignItems: "center", flexDirection: "row", marginRight: 8 }}
                                >
                                    <FastImage
                                        source={{ uri: currentMusic.cover_url }}
                                        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                                        resizeMode={FastImage.resizeMode.cover}
                                    />
                                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />
                                    <TouchableOpacity onPress={toggleMusic} style={{ borderRadius: 999, padding: 6, backgroundColor: colors.card, justifyContent: "center", alignItems: "center", marginLeft: 8 }}>
                                        {isPlaying ? <PlayCircleBold size={20} color={colors.text} /> : <PlayCircleOutline size={20} color={colors.text} />}
                                    </TouchableOpacity>
                                    <Text numberOfLines={2} style={[common.bodySmall, { marginLeft: 8, marginRight: 4, flex: 1, color: 'white' }]}>
                                        {currentMusic.artist} - {currentMusic.title}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {socialLinks && socialLinks.length > 0 && (
                                <TouchableOpacity
                                    onPress={() => socialSheetRef?.current?.present()}
                                    style={{ height: 70, backgroundColor: colors.card, width: 170, borderRadius: 100, overflow: "hidden", justifyContent: "space-between", alignItems: "center", flexDirection: "row", marginRight: 8 }}
                                >
                                    <FastImage
                                        source={{ uri: "https://womendobusiness.eu/wp-content/uploads/social-media.jpg" }}
                                        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                                        resizeMode={FastImage.resizeMode.cover}
                                    />
                                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />
                                    <Text numberOfLines={2} style={[common.label, { marginHorizontal: 10, flex: 1, color: 'white', textAlign: 'center' }]}>
                                        {socialLinks.length} social link{socialLinks.length > 1 ? 's' : ''}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {addresses && addresses.length > 0 && (
                                <TouchableOpacity
                                    onPress={() => addressSheetRef?.current?.present()}
                                    style={{ height: 70, backgroundColor: colors.card, width: 170, borderRadius: 100, overflow: "hidden", justifyContent: "space-between", alignItems: "center", flexDirection: "row", marginRight: 8 }}
                                >
                                    <View style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, backgroundColor: colors.text, opacity: 0.1 }} />
                                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center', marginLeft: 12 }}>
                                        <PointOnMapBold size={20} color={colors.text} />
                                    </View>
                                    <Text numberOfLines={2} style={[common.label, { marginHorizontal: 10, flex: 1 }]}>
                                        {addresses.length} address{addresses.length > 1 ? 'es' : ''}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {workplaces.length > 0 && (
                                <TouchableOpacity
                                    onPress={() => workplaceSheetRef?.current?.present()}
                                    style={{ height: 70, backgroundColor: colors.card, width: 170, borderRadius: 100, overflow: "hidden", justifyContent: "space-between", alignItems: "center", flexDirection: "row", marginRight: 8 }}
                                >
                                    <View style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, backgroundColor: colors.text, opacity: 0.1 }} />
                                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center', marginLeft: 12 }}>
                                        <CaseMinimalisticBold size={20} color={colors.text} />
                                    </View>
                                    <Text numberOfLines={2} style={[common.label, { marginHorizontal: 10, flex: 1 }]}>
                                        {workplaces.length} workplace{workplaces.length > 1 ? 's' : ''}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </ScrollView>

                        <TabPillGroup
                            tabs={tabs}
                            activeTab={activeTab}
                            containerStyle={{ marginTop: 16, marginHorizontal: -16 }}
                            scrollViewStyle={{ paddingHorizontal: 16 }}
                            renderContent={false}
                        />

                        {tabContent}
                    </View>
                </View>
            </SquircleView>
        </>
    );
});

const styles = (colors: any) =>
    StyleSheet.create({
        coverImage: {
            width: "100%",
            height: COVER_HEIGHT,
            overflow: 'hidden',
        },
        meshGradient: {
            flex: 1,
            height: '100%',
            width: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
        },
    });

export { COVER_HEIGHT };
export default ProfileHeader;

