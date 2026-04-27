import { FlexText } from "@/components/FlexText";
import { useStatusBar } from "@/context/StatusBarContext";
import { useThemeContext } from "@/context/ThemeContext";
import { useTrendingAll } from "@/hooks/useMovies";
import VerifiedIcon from "@/icons/verified";
import { useInfiniteMedia } from "@/services/media";
import { useProfile } from "@/services/userprofile";
import { createCommonStyles } from "@/styles/common";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { ClapperboardBold, TvBold } from "@solar-icons/react-native";
import { BlurTargetView, BlurView } from "expo-blur";
import { Image } from "expo-image";
import { router } from "expo-router";
import { SquircleView } from "expo-squircle-view";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DashboardScreenV1 = () => {
    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const { data: profile } = useProfile("me", true);
    const insets = useSafeAreaInsets();
    const statusBar = useStatusBar();
    const { t } = useTranslation();

    // Disable the status bar fade only while this screen is focused.
    // Using useFocusEffect (instead of useEffect) ensures we also re-enable
    // the fade when the user navigates to another tab/screen, even if this
    // screen stays mounted in the background.
    useFocusEffect(
        useCallback(() => {
            statusBar.setShowStatusBarFade(false);
            return () => {
                statusBar.setShowStatusBarFade(true);
            };
        }, [statusBar]),
    );
    return (
        <View style={[common.screen, { gap: 4 }]}>
            <View style={{ height: 180, width: '100%', backgroundColor: colors.containerContent }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, paddingTop: insets.top + 50 }}>
                    <Image source={{ uri: profile?.avatar_url }} style={{
                        width: 64, height: 64, borderRadius: 8,
                    }} />
                    <View style={{ flex: 1, justifyContent: 'space-between', alignItems: 'flex-start', height: 64 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <FlexText style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>{profile?.name} </FlexText>
                            {profile?.is_verified && <VerifiedIcon size={14} backgroundColor={colors.verify} />}
                        </View>
                        <FlexText style={{ fontSize: 16, color: colors.muted }}>{profile?.username || profile?.email}</FlexText>
                    </View>
                    <TouchableOpacity activeOpacity={0.7} onPress={() => router.push(`/profile/${profile?.id}?isMe=false`)}>
                        <Ionicons name="chevron-forward" size={24} color={colors.muted} />
                    </TouchableOpacity>
                </View>
            </View>
            <View style={{ width: '100%', backgroundColor: colors.containerContent, padding: 16, gap: 12 }}>
                <FlexText style={{ fontSize: 16, fontWeight: 'bold', color: colors.muted, marginBottom: 8 }}>
                    {t('dashboard.sections.services')}
                </FlexText>
                <TouchableOpacity onPress={() => router.push("/webview?url=https://reclipnew.onrender.com/")} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <Image source={{ uri: 'https://wsrv.nl/?url=https%3A%2F%2Fipfs.io%2Fipfs%2FQma91KiDAvy7QPj6c7a9nmNEUkTarx43vjnqJRYvu3VjU1&w=256&h=undefined&q=75&ll=&default=https%3A%2F%2Fipfs.io%2Fipfs%2FQma91KiDAvy7QPj6c7a9nmNEUkTarx43vjnqJRYvu3VjU1&output=webp' }} style={{ width: 28, height: 28, borderRadius: 8 }} />
                    <FlexText style={{ fontSize: 16, color: colors.text }}>ReClip</FlexText>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push("/webview?url=https://onflix.my/&isUseSafeArea=true&safeAreaColor=black&isShowBackButton=false")} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <Image source={{ uri: 'https://onflix.my/app/asset/logo.png' }} style={{ width: 28, height: 28, borderRadius: 8 }} contentFit="contain" />
                    <FlexText style={{ fontSize: 16, color: colors.text }}>OnFlix</FlexText>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push("/_screens/Bulletinboard")} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: colors.secondary, justifyContent: 'center', alignItems: 'center' }}>
                        <Ionicons name="megaphone" size={16} color="#fff" />
                    </View>
                    <FlexText style={{ fontSize: 16, color: colors.text }}>Bulletin Board</FlexText>
                </TouchableOpacity>
            </View>

            <View style={{ width: '100%', backgroundColor: colors.containerContent, padding: 16, gap: 12 }}>
                <FlexText style={{ fontSize: 16, fontWeight: 'bold', color: colors.muted, marginBottom: 8 }}>
                    {t('dashboard.sections.entertainment')}
                </FlexText>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <TvBold size={28} color={colors.text} />
                    <FlexText style={{ fontSize: 16, color: colors.text }}>WeLoveTV</FlexText>
                </TouchableOpacity>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <ClapperboardBold size={28} color={colors.text} />
                    <FlexText style={{ fontSize: 16, color: colors.text }}>Movies & TV</FlexText>
                </TouchableOpacity>
            </View>
        </View>
    )
}

const DashboardScreen = () => {
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const { data: profile } = useProfile("me", true);
    const insets = useSafeAreaInsets();
    const statusBar = useStatusBar();
    const { t } = useTranslation();
    const blurTargetRef = useRef<View | null>(null);

    const { data: mediaPages } = useInfiniteMedia(profile?.id ?? "", "photo");
    const photos = mediaPages?.pages.flatMap((p) => p.data) ?? [];
    const [bgImageUrl, setBgImageUrl] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (photos.length === 0) return;
        if (!bgImageUrl) {
            const initial = photos[Math.floor(Math.random() * photos.length)];
            setBgImageUrl(initial.url);
        }
        const timer = setInterval(() => {
            setBgImageUrl((prev) => {
                const candidates = photos.filter((p) => p.url !== prev);
                const pool = candidates.length > 0 ? candidates : photos;
                return pool[Math.floor(Math.random() * pool.length)].url;
            });
        }, 30_000);
        return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [photos.length]);

    const { data: trending, isLoading: isTrendingLoading } = useTrendingAll();
    const weatherCity = profile?.hometown?.trim() || "Ho Chi Minh City";
    // useFocusEffect(
    //     useCallback(() => {
    //         statusBar.setShowStatusBarFade(false);
    //         return () => {
    //             statusBar.setShowStatusBarFade(true);
    //         };
    //     }, [statusBar]),
    // );
    return (
        <View style={[common.screen, { gap: 4 }]}>
            <View style={StyleSheet.absoluteFill}>
                <BlurTargetView ref={blurTargetRef} style={{ flex: 1 }}>
                    <Image
                        source={{ uri: bgImageUrl ?? profile?.avatar_url }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                        transition={{ effect: 'cross-dissolve', duration: 1200 }}
                    />
                </BlurTargetView>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 250 + insets.top, paddingHorizontal: 16, paddingBottom: insets.bottom + 99 }}>
                <FlexText style={{ fontSize: 46, fontWeight: 'bold', color: 'white' }}>{profile?.name} </FlexText>
                <FlexText style={{ fontSize: 16, color: 'white' }}>{profile?.username || profile?.email}</FlexText>
                <SquircleView cornerSmoothing={100} borderRadius={16} style={{ marginTop: 16, overflow: 'hidden' }}>
                    <BlurView blurMethod="dimezisBlurViewSdk31Plus" tint={theme === "dark" ? "systemMaterialDark" : "systemMaterialLight"}
                        intensity={50} blurTarget={blurTargetRef} style={{ padding: 16 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <View style={{ flex: 1, paddingRight: 10 }}>
                                <FlexText style={{ fontSize: 16, fontWeight: "bold", color: colors.text }}>
                                    Weather
                                </FlexText>
                                <FlexText style={{ fontSize: 12, color: colors.text, opacity: 0.7, marginTop: 2 }}>
                                    {weatherCity}
                                </FlexText>
                            </View>
                            <TouchableOpacity style={{ borderRadius: 999, backgroundColor: `${colors.text}18`, paddingHorizontal: 10, paddingVertical: 6 }}>
                                <FlexText style={{ fontSize: 12, color: colors.text, fontWeight: "600" }}>
                                    Refresh
                                </FlexText>
                            </TouchableOpacity>
                        </View>
                        <View style={{ marginTop: 10 }}>
                            <FlexText style={{ fontSize: 34, fontWeight: "700", color: colors.text }}>
                                --°C
                            </FlexText>
                            <FlexText style={{ fontSize: 14, color: colors.text, opacity: 0.82 }}>
                                Weather data will be available soon.
                            </FlexText>
                            <FlexText style={{ fontSize: 12, color: colors.text, opacity: 0.65, marginTop: 8 }}>
                                Coming soon.
                            </FlexText>
                        </View>
                    </BlurView>
                </SquircleView>
                <SquircleView cornerSmoothing={100} borderRadius={16} style={{ marginTop: 50, overflow: 'hidden' }}>
                    <BlurView blurMethod="dimezisBlurViewSdk31Plus" tint={theme === "dark" ? "systemMaterialDark" : "systemMaterialLight"}
                        intensity={50} blurTarget={blurTargetRef} style={{ padding: 16 }}>
                        <FlexText style={{ fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 8 }}>
                            {t('dashboard.sections.services')}
                        </FlexText>
                        <TouchableOpacity onPress={() => router.push("/webview?url=https://reclipnew.onrender.com/")} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                            <Image source={{ uri: 'https://wsrv.nl/?url=https%3A%2F%2Fipfs.io%2Fipfs%2FQma91KiDAvy7QPj6c7a9nmNEUkTarx43vjnqJRYvu3VjU1&w=256&h=undefined&q=75&ll=&default=https%3A%2F%2Fipfs.io%2Fipfs%2FQma91KiDAvy7QPj6c7a9nmNEUkTarx43vjnqJRYvu3VjU1&output=webp' }} style={{ width: 28, height: 28, borderRadius: 8 }} />
                            <FlexText style={{ fontSize: 16, color: colors.text }}>ReClip</FlexText>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push("/webview?url=https://onflix.my/&isUseSafeArea=true&safeAreaColor=black&isShowBackButton=false")} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                            <Image source={{ uri: 'https://onflix.run/app/asset/logo.png' }} style={{ width: 28, height: 28, borderRadius: 8 }} contentFit="contain" />
                            <FlexText style={{ fontSize: 16, color: colors.text }}>OnFlix</FlexText>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push("/_screens/Bulletinboard")} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                            <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: colors.secondary, justifyContent: 'center', alignItems: 'center' }}>
                                <Ionicons name="megaphone" size={16} color="#fff" />
                            </View>
                            <FlexText style={{ fontSize: 16, color: colors.text }}>Bulletin Board</FlexText>
                        </TouchableOpacity>
                    </BlurView>
                </SquircleView>
                <SquircleView cornerSmoothing={100} borderRadius={16} style={{ marginTop: 10, overflow: 'hidden' }}>
                    <BlurView blurMethod="dimezisBlurViewSdk31Plus" tint={theme === "dark" ? "systemMaterialDark" : "systemMaterialLight"}
                        intensity={50} blurTarget={blurTargetRef} style={{ padding: 16 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <FlexText style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>
                                {t('dashboard.sections.entertainment')}
                            </FlexText>
                            <View style={{ borderRadius: 999, backgroundColor: `${colors.secondary}33`, paddingHorizontal: 10, paddingVertical: 4 }}>
                                <FlexText style={{ fontSize: 12, color: colors.text, fontWeight: '600' }}>Coming Soon</FlexText>
                            </View>
                        </View>
                        <FlexText style={{ fontSize: 14, color: colors.text, opacity: 0.8, marginBottom: 14 }}>
                            Personalized channels, quick resume, and curated picks will appear here.
                        </FlexText>
                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                            <SquircleView cornerSmoothing={100} borderRadius={12} style={{ flex: 1, backgroundColor: `${colors.text}14`, padding: 12 }}>
                                <TvBold size={20} color={colors.text} />
                                <FlexText style={{ marginTop: 8, color: colors.text, fontSize: 14, fontWeight: '600' }}>Live Channels</FlexText>
                                <FlexText style={{ marginTop: 2, color: colors.text, opacity: 0.65, fontSize: 12 }}>Preview mode</FlexText>
                            </SquircleView>
                            <SquircleView cornerSmoothing={100} borderRadius={12} style={{ flex: 1, backgroundColor: `${colors.text}14`, padding: 12 }}>
                                <ClapperboardBold size={20} color={colors.text} />
                                <FlexText style={{ marginTop: 8, color: colors.text, fontSize: 14, fontWeight: '600' }}>Movies Hub</FlexText>
                                <FlexText style={{ marginTop: 2, color: colors.text, opacity: 0.65, fontSize: 12 }}>Preview mode</FlexText>
                            </SquircleView>
                        </View>
                        <SquircleView cornerSmoothing={100} borderRadius={12} style={{ backgroundColor: `${colors.text}10`, padding: 12, gap: 10 }}>
                            <FlexText style={{ fontSize: 13, color: colors.text, opacity: 0.75 }}>
                                Trending
                            </FlexText>
                            {isTrendingLoading ? (
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    <View style={{ flex: 1, height: 110, borderRadius: 10, backgroundColor: `${colors.text}14` }} />
                                    <View style={{ flex: 1, height: 110, borderRadius: 10, backgroundColor: `${colors.text}14` }} />
                                    <View style={{ flex: 1, height: 110, borderRadius: 10, backgroundColor: `${colors.text}14` }} />
                                </View>
                            ) : (trending ?? []).length > 0 ? (
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    {(trending ?? []).slice(0, 3).map((item) => (
                                        <TouchableOpacity
                                            key={item.id}
                                            activeOpacity={0.75}
                                            style={{ flex: 1, gap: 6 }}
                                            onPress={() => item.media_type === 'tv'
                                                ? router.push({ pathname: '/tv_detail', params: { id: item.id } })
                                                : router.push({ pathname: '/movie_detail', params: { id: item.id } })
                                            }
                                        >
                                            <Image
                                                source={{
                                                    uri: item.poster_path
                                                        ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
                                                        : undefined,
                                                }}
                                                style={{ width: '100%', aspectRatio: 2 / 3, borderRadius: 10, backgroundColor: `${colors.text}12` }}
                                                contentFit="cover"
                                            />
                                            <FlexText numberOfLines={1} style={{ fontSize: 11, color: colors.text, opacity: 0.85 }}>
                                                {item.title || item.name}
                                            </FlexText>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            ) : (
                                <FlexText style={{ fontSize: 12, color: colors.text, opacity: 0.65 }}>
                                    Trending is not available yet.
                                </FlexText>
                            )}
                        </SquircleView>
                    </BlurView>
                </SquircleView>
            </ScrollView>
        </View>
    )
}

export default DashboardScreen;