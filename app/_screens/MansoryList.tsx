import { FlexText } from "@/components/FlexText";
import { resolveBlurhash } from "@/components/gallery/fallbackBlurhash";
import { getCachedImageDimension, setCachedImageDimension } from "@/components/gallery/imageDimensionCache";
import { ProfilePickerSheet } from "@/components/gallery/sheets/ProfilePickerSheet";
import { useThemeContext } from "@/context/ThemeContext";
import { useInfiniteMedia } from "@/services/media";
import { useAdminCheck, useProfile } from "@/services/userprofile";
import { createCommonStyles } from "@/styles/common";
import { Profile } from "@/types/profile";
import { choosenMediaPath } from "@/utils/imageurl";
import { Ionicons } from "@expo/vector-icons";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { Galeria } from "@nandorojo/galeria";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Dimensions,
    Image as RNImage,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COLUMN_WIDTH = (SCREEN_WIDTH - 24) / 2;
const VIDEO_ASPECT_RATIO = 9 / 16;
const VIDEO_HEIGHT = COLUMN_WIDTH / VIDEO_ASPECT_RATIO;

const prefetchPhotoDimensions = async (items: any[]) => {
    const pending = items.filter((item) => {
        if (item.type !== "photo") return false;
        const url = choosenMediaPath(item);
        if (!url) return false;
        return !getCachedImageDimension(url);
    });

    if (pending.length === 0) return;

    const urls = pending.map((item) => choosenMediaPath(item));

    // Warm expo-image cache in parallel (fire and forget)
    Image.prefetch(urls).catch(() => {});

    await Promise.all(
        urls.map(
            (url) =>
                new Promise<void>((resolve) => {
                    RNImage.getSize(
                        url,
                        (width, height) => {
                            setCachedImageDimension(url, width, height);
                            resolve();
                        },
                        () => resolve(),
                    );
                }),
        ),
    );
};

// Memoized card components — FlashList + Galeria rely on stable measurement
// refs for the zoom-open animation. Plain function components re-render on
// every scroll/parent render, which breaks Galeria's source-rect measurement
// and also defeats FlashList cell recycling. React.memo keeps re-renders
// scoped to actual prop changes.
const PhotoCard = React.memo(({ item, colors }: any) => {
    const sourceUrl = choosenMediaPath(item);
    const cached = getCachedImageDimension(sourceUrl);
    const imageHeight = cached
        ? COLUMN_WIDTH / (cached.width / cached.height)
        : 200;
    const placeholderBlurhash = resolveBlurhash(item.blurhash, item.id || sourceUrl);

    const handleLoad = useCallback((event: any) => {
        const sourceWidth = event.source?.width;
        const sourceHeight = event.source?.height;
        if (sourceWidth && sourceHeight) {
            setCachedImageDimension(sourceUrl, sourceWidth, sourceHeight);
        }
    }, [sourceUrl]);

    return (
        <View style={[styles.cardContainer, { backgroundColor: colors.background }]}>
            <Galeria urls={[sourceUrl]}>
                <Galeria.Image>
                    <Image
                        source={{ uri: sourceUrl }}
                        recyclingKey={sourceUrl}
                        style={{ width: "100%", height: imageHeight }}
                        contentFit="cover"
                        placeholder={{ blurhash: placeholderBlurhash }}
                        onLoad={handleLoad}
                    />
                </Galeria.Image>
            </Galeria>
            {item.caption ? (
                <FlexText
                    numberOfLines={2}
                    style={[styles.caption, { color: colors.text }]}
                >
                    {item.caption}
                </FlexText>
            ) : null}
        </View>
    );
});
PhotoCard.displayName = "PhotoCard";

const VideoCard = React.memo(({ item, colors, onPress }: any) => {
    const thumbnailUrl = item.thumbnail_url || choosenMediaPath(item);
    const placeholderBlurhash = resolveBlurhash(item.blurhash, item.id || thumbnailUrl);

    const handlePress = useCallback(() => onPress?.(item), [onPress, item]);

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={handlePress}
            style={[styles.cardContainer, { backgroundColor: colors.background }]}
        >
            <View style={{ width: "100%", height: VIDEO_HEIGHT }}>
                <Image
                    source={{ uri: thumbnailUrl }}
                    recyclingKey={thumbnailUrl}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                    transition={200}
                    placeholder={{ blurhash: placeholderBlurhash }}
                />
                <View style={styles.playBadge}>
                    <Ionicons name="play" size={18} color="white" />
                </View>
            </View>
            {item.caption ? (
                <FlexText
                    numberOfLines={2}
                    style={[styles.caption, { color: colors.text }]}
                >
                    {item.caption}
                </FlexText>
            ) : null}
        </TouchableOpacity>
    );
});
VideoCard.displayName = "VideoCard";

const MansoryListScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const { t } = useTranslation();

    const { data: myProfile } = useProfile("me", true);
    const { data: adminData } = useAdminCheck();
    const isAdmin = !!(adminData?.isAdmin ?? adminData?.is_admin ?? myProfile?.is_admin);

    // Selected profile — null means "view my gallery"
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

    const activeProfile = selectedProfile ?? myProfile ?? null;
    const effectiveProfileId = activeProfile?.id ?? "";

    const pickerSheetRef = useRef<TrueSheet>(null);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = useInfiniteMedia(effectiveProfileId);

    const media = useMemo(
        () => data?.pages.flatMap((page) => page.data) ?? [],
        [data],
    );

    const [isPrefetching, setIsPrefetching] = useState(true);
    const didInitialPrefetchRef = useRef(false);
    const lastPrefetchedProfileId = useRef<string>("");

    useEffect(() => {
        if (isLoading) return;

        if (!effectiveProfileId || media.length === 0) {
            setIsPrefetching(false);
            return;
        }

        const profileChanged = lastPrefetchedProfileId.current !== effectiveProfileId;
        if (profileChanged) {
            didInitialPrefetchRef.current = false;
            lastPrefetchedProfileId.current = effectiveProfileId;
            setIsPrefetching(true);
        }

        if (didInitialPrefetchRef.current) {
            prefetchPhotoDimensions(media);
            return;
        }

        didInitialPrefetchRef.current = true;
        prefetchPhotoDimensions(media).finally(() => {
            setIsPrefetching(false);
        });
    }, [media, isLoading, effectiveProfileId]);

    const handleVideoPress = useCallback((video: any) => {
        const videoUrl = choosenMediaPath(video);
        router.push({
            pathname: "/video_player",
            params: {
                videoUrl,
                name: activeProfile?.name || "Video",
                caption: video.caption || "",
                portrait: "true",
            },
        });
    }, [router, activeProfile?.name]);

    const handlePickProfile = useCallback((profile: Profile | null) => {
        if (profile && profile.id === myProfile?.id) {
            setSelectedProfile(null);
        } else {
            setSelectedProfile(profile);
        }
    }, [myProfile?.id]);

    const openPicker = useCallback(() => {
        pickerSheetRef.current?.present();
    }, []);

    const isViewingOther = !!selectedProfile && selectedProfile.id !== myProfile?.id;

    const renderItem = useCallback(({ item }: any) => {
        if (item.type === "video") {
            return (
                <VideoCard
                    item={item}
                    colors={colors}
                    onPress={handleVideoPress}
                />
            );
        }
        return <PhotoCard item={item} colors={colors} />;
    }, [colors, handleVideoPress]);

    const handleEndReached = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const isBusy = isLoading || isPrefetching;

    const headerTitle = isViewingOther && activeProfile?.name
        ? activeProfile.name
        : t("gallery.title");

    const ListHeaderComponent = useCallback(
        () => (
            <View
                style={{
                    marginTop: insets.top + 16,
                    paddingHorizontal: 16,
                    marginBottom: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <View style={{ flex: 1, paddingRight: 12 }}>
                    <FlexText
                        style={[common.heading, { fontSize: 28 }]}
                        numberOfLines={1}
                    >
                        {headerTitle}
                    </FlexText>
                    <FlexText style={[common.bodySmall, { color: colors.muted, marginTop: 2 }]}>
                        {isBusy
                            ? t("gallery.subtitle")
                            : media.length > 0
                                ? t("gallery.mediaCount", { count: media.length })
                                : t("gallery.subtitle")}
                    </FlexText>
                </View>

                {isAdmin && (
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={openPicker}
                        style={[
                            styles.headerAvatarButton,
                            {
                                borderColor: isViewingOther
                                    ? colors.verify || colors.text
                                    : "transparent",
                            },
                        ]}
                    >
                        {activeProfile?.avatar_url ? (
                            <Image
                                source={{ uri: activeProfile.avatar_url }}
                                style={styles.headerAvatar}
                                contentFit="cover"
                                recyclingKey={activeProfile.avatar_url}
                            />
                        ) : (
                            <Image
                                source={
                                    activeProfile?.gender === "male"
                                        ? require("../../assets/images/AV17.png")
                                        : require("../../assets/images/AV86.png")
                                }
                                style={styles.headerAvatar}
                                contentFit="cover"
                            />
                        )}
                        <View
                            style={[
                                styles.headerAvatarBadge,
                                {
                                    backgroundColor:
                                        theme === "dark" ? "#1c1c1e" : "#ffffff",
                                },
                            ]}
                        >
                            <Ionicons
                                name="swap-horizontal"
                                size={12}
                                color={colors.text}
                            />
                        </View>
                    </TouchableOpacity>
                )}
            </View>
        ),
        [
            common,
            colors,
            media.length,
            t,
            isBusy,
            isAdmin,
            isViewingOther,
            activeProfile,
            theme,
            insets.top,
            openPicker,
            headerTitle,
        ],
    );

    const renderEmpty = useCallback(() => {
        if (isBusy) {
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
                                theme === "dark"
                                    ? "rgba(255,255,255,0.05)"
                                    : "rgba(0,0,0,0.04)",
                        },
                    ]}
                >
                    <Ionicons name="images-outline" size={32} color={colors.muted} />
                </View>
                <FlexText style={[common.heading, { fontSize: 20, marginTop: 20, marginBottom: 8 }]}>
                    {t("gallery.emptyTitle")}
                </FlexText>
                <FlexText
                    style={[common.body, { color: colors.muted, textAlign: "center", lineHeight: 22 }]}
                >
                    {t("gallery.emptyBody")}
                </FlexText>
            </View>
        );
    }, [isBusy, colors, common, theme, t]);

    return (
        <View style={common.screen}>
            <FlashList
                data={media}
                keyExtractor={(item: any, index: number) => item.id + index.toString()}
                renderItem={renderItem}
                numColumns={2}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 4, paddingTop: 8, paddingBottom: insets.bottom + 66 }}
                masonry={true}
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.5}
                ListHeaderComponent={ListHeaderComponent}
                ListFooterComponent={
                    isFetchingNextPage ? (
                        <View style={styles.footer}>
                            <ActivityIndicator size="small" color={colors.text} />
                        </View>
                    ) : null
                }
                ListEmptyComponent={renderEmpty}
            />

            {isAdmin && (
                <ProfilePickerSheet
                    ref={pickerSheetRef}
                    selectedProfileId={activeProfile?.id ?? null}
                    onSelect={handlePickProfile}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        marginHorizontal: 4,
        marginBottom: 8,
        borderRadius: 4,
        overflow: "hidden",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    caption: {
        fontSize: 14,
        lineHeight: 16,
        paddingVertical: 6,
    },
    playBadge: {
        position: "absolute",
        top: 8,
        right: 8,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "rgba(0,0,0,0.55)",
        justifyContent: "center",
        alignItems: "center",
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    footer: {
        paddingVertical: 16,
        alignItems: "center",
    },
    empty: {
        paddingVertical: 80,
        alignItems: "center",
    },
    header: {
        paddingHorizontal: 12,
        marginBottom: 12,
    },
    emptyState: {
        flex: 1,
        paddingVertical: 80,
        alignItems: "center",
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    headerAvatarButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        overflow: "visible",
        justifyContent: "center",
        alignItems: "center",
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    headerAvatarBadge: {
        position: "absolute",
        bottom: -2,
        right: -2,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: "center",
        alignItems: "center",
    },
});

export default MansoryListScreen;
