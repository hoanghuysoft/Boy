import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Animated } from "react-native";
import { getColors } from 'react-native-image-colors';
import { createMMKV } from 'react-native-mmkv';
import { useThemeContext } from "../context/ThemeContext";
import { useAudioStore } from '../stores/audio';
import { createCommonStyles } from "../styles/common";
import { ProfileAddress } from "../types/profileaddress";
import { ProfileDetail } from "../types/profiledetail";
import { ProfileMusic } from "../types/profilemusic";

const COVER_HEIGHT = 250;
const PLACEHOLDER_COVER = "https://pbs.twimg.com/media/GeMS4yjWIAA14OG.jpg";
const MESH_GRADIENT_DEFAULTS = {
    speed: 5,
    brightness: 0.8,
    contrast: 1.2,
    frequency: 5,
    amplitude: 30,
};

const storage = createMMKV();

export type TabType = "Images" | "Videos" | "Feed";

interface UseProfileHeaderViewModelOptions {
    scrollY: Animated.Value;
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    profile?: ProfileDetail | null;
    isMe?: boolean;
    music?: ProfileMusic[];
    addresses?: ProfileAddress[];
}

export const useProfileHeaderViewModel = ({
    scrollY,
    activeTab,
    onTabChange,
    profile,
    isMe = false,
    music = [],
    addresses = [],
}: UseProfileHeaderViewModelOptions) => {
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const { currentlyPlayingId, playTrack, stopPlayback } = useAudioStore();

    // ─── State ─────────────────────────────────────────────────────
    const [gradientColors, setGradientColors] = useState<string[]>([]);
    const [avatarPreviewVisible, setAvatarPreviewVisible] = useState(false);

    // ─── Register Locale ───────────────────────────────────────────
    useEffect(() => {
        countries.registerLocale(en);
    }, []);

    // ─── Derived Data ──────────────────────────────────────────────
    const hasCover = !!profile?.cover_url;
    const currentMusic = music?.[0];
    const currentAvatar = profile?.avatar_url || null;

    const genderFallbackSource = profile?.gender === 'male'
        ? require('../assets/images/AV17.png')
        : profile?.gender
            ? require('../assets/images/AV86.png')
            : null;

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

    // ─── Color Extraction for Mesh Gradient ────────────────────────
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

    // ─── Animations ────────────────────────────────────────────────
    const coverTranslateY = scrollY.interpolate({
        inputRange: [-COVER_HEIGHT, 0, COVER_HEIGHT],
        outputRange: [-COVER_HEIGHT, 0, COVER_HEIGHT * 0.5],
        extrapolate: "clamp",
    });

    // ─── Music ─────────────────────────────────────────────────────
    const profileMusicId = currentMusic ? `profile-music-${currentMusic.id}` : null;
    const isPlaying = profileMusicId ? currentlyPlayingId === profileMusicId : false;

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

    // ─── Tab Handlers ──────────────────────────────────────────────
    const handleImagesTab = useCallback(() => onTabChange("Images"), [onTabChange]);
    const handleVideosTab = useCallback(() => onTabChange("Videos"), [onTabChange]);
    const handleFeedTab = useCallback(() => onTabChange("Feed"), [onTabChange]);

    const tabs = useMemo(() => [
        { name: "Images", label: "Images", onClick: handleImagesTab },
        { name: "Videos", label: "Shots", onClick: handleVideosTab },
        { name: "Feed", label: "Feed", onClick: handleFeedTab },
    ], [handleImagesTab, handleVideosTab, handleFeedTab]);

    // ─── Avatar Preview ────────────────────────────────────────────
    const showAvatarPreview = useCallback(() => {
        setAvatarPreviewVisible(true);
    }, []);

    const hideAvatarPreview = useCallback(() => {
        setAvatarPreviewVisible(false);
    }, []);

    // ─── Return ViewModel ──────────────────────────────────────────
    return {
        // Theme
        colors,
        typography,
        theme,
        common,

        // Profile derived data
        hasCover,
        currentMusic,
        currentAvatar,
        genderFallbackSource,
        threedEmoji,
        homeInfo,
        flagCode,

        // Gradient
        gradientColors,
        meshGradientDefaults: MESH_GRADIENT_DEFAULTS,
        coverHeight: COVER_HEIGHT,

        // Animations
        coverTranslateY,

        // Music
        isPlaying,
        toggleMusic,

        // Avatar preview
        avatarPreviewVisible,
        showAvatarPreview,
        hideAvatarPreview,

        // Tabs
        tabs,
    };
};
