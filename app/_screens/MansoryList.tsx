import { FlexText } from "@/components/FlexText";
import { resolveBlurhash } from "@/components/gallery/fallbackBlurhash";
import { getCachedImageDimension, setCachedImageDimension } from "@/components/gallery/imageDimensionCache";
import { ProfilePickerSheet } from "@/components/gallery/sheets/ProfilePickerSheet";
import { ThemeColors, useThemeContext } from "@/context/ThemeContext";
import { useInfiniteMedia } from "@/services/media";
import { useAdminCheck, useProfile } from "@/services/userprofile";
import { useScrollStore } from "@/stores/scroll";
import { createCommonStyles } from "@/styles/common";
import { Media } from "@/types/media";
import { Profile } from "@/types/profile";
import { choosenMediaPath } from "@/utils/imageurl";
import { Ionicons } from "@expo/vector-icons";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { FlashList } from "@shopify/flash-list";
import dayjs from "dayjs";
import { Image } from "expo-image";
import { MediaViewer } from "expo-media-viewer";
import { SquircleView } from "expo-squircle-view";
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
import { NitroImage } from "react-native-nitro-image";
import { WebImages } from "react-native-nitro-web-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COLUMN_WIDTH = (SCREEN_WIDTH - 24) / 2;
const VIDEO_ASPECT_RATIO = 9 / 16;
const VIDEO_HEIGHT = COLUMN_WIDTH / VIDEO_ASPECT_RATIO;

const prefetchPhotoDimensions = async (items: any[]) => {
    // 1) Server-provided dimensions → seed into MMKV cache immediately.
    //    This avoids any getSize network round-trip and prevents layout jump.
    items.forEach((item) => {
        if (item.type !== "photo") return;
        if (!item.width || !item.height) return;
        const url = choosenMediaPath(item);
        if (!url) return;
        if (getCachedImageDimension(url)) return;
        setCachedImageDimension(url, item.width, item.height);
    });

    // 2) Warm the expo-image byte cache for every photo URL in the batch,
    //    regardless of whether we already know dimensions.
    const allPhotoUrls = items
        .filter((item) => item.type === "photo")
        .map((item) => choosenMediaPath(item))
        .filter(Boolean);

    if (allPhotoUrls.length > 0) {
        for (const url of allPhotoUrls) WebImages.preload(url);
    }

    // 3) For items still missing dimensions (no server value AND no cache),
    //    fall back to RNImage.getSize.
    const pending = items.filter((item) => {
        if (item.type !== "photo") return false;
        if (item.width && item.height) return false;
        const url = choosenMediaPath(item);
        if (!url) return false;
        return !getCachedImageDimension(url);
    });

    if (pending.length === 0) return;

    await Promise.all(
        pending.map((item) => {
            const url = choosenMediaPath(item);
            return new Promise<void>((resolve) => {
                RNImage.getSize(
                    url,
                    (width, height) => {
                        setCachedImageDimension(url, width, height);
                        resolve();
                    },
                    () => resolve(),
                );
            });
        }),
    );
};

// Memoized card components — FlashList + Galeria rely on stable measurement
// refs for the zoom-open animation. Plain function components re-render on
// every scroll/parent render, which breaks Galeria's source-rect measurement
// and also defeats FlashList cell recycling. React.memo keeps re-renders
// scoped to actual prop changes.

const MediaFooter = React.memo(({ item, colors }: { item: Media; colors: any }) => (
    <>
        {item.caption ? (
            <FlexText
                numberOfLines={2}
                style={[styles.caption, { color: colors.text }]}
            >
                {item.caption}
            </FlexText>
        ) : null}
        {item.created_at ? (
            <FlexText
                numberOfLines={2}
                style={[styles.caption, { color: colors.text, textAlign: "right", fontWeight: "500" }]}
            >
                {dayjs(item.created_at).format("DD/MM/YYYY")}
            </FlexText>
        ) : null}
    </>
));
MediaFooter.displayName = "MediaFooter";

const PhotoCard = React.memo(({ item, colors }: { item: Media & { mediaIndex?: number }, colors: any }) => {
    const sourceUrl = choosenMediaPath(item);
    const serverW = item.width;
    const serverH = item.height;
    const hasServerDims = !!(serverW && serverH);
    const cached = hasServerDims ? null : getCachedImageDimension(sourceUrl);
    const resolvedWidth = hasServerDims ? serverW : cached?.width;
    const resolvedHeight = hasServerDims ? serverH : cached?.height;
    const imageHeight = resolvedWidth && resolvedHeight
        ? COLUMN_WIDTH / (resolvedWidth / resolvedHeight)
        : 200;

    return (
        <SquircleView cornerSmoothing={100} preserveSmoothing={true} style={[styles.cardContainer, { backgroundColor: colors.background }]}>
            <MediaViewer.Image
                index={item.mediaIndex ?? 0}
                style={{
                    width: "100%",
                    height: imageHeight,
                    overflow: "hidden",
                    borderRadius: 12,
                }}
            >
                <NitroImage
                    image={{ url: sourceUrl! }}
                    recyclingKey={sourceUrl}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                />
            </MediaViewer.Image>
            <MediaFooter item={item} colors={colors} />
        </SquircleView>
    );
});
PhotoCard.displayName = "PhotoCard";

const VideoCard = React.memo(({ item, colors }: { item: Media & { mediaIndex?: number }, colors: ThemeColors }) => {
    const thumbnailUrl = item.thumbnail_url || choosenMediaPath(item);
    const placeholderBlurhash = resolveBlurhash(item.blurhash, item.id || thumbnailUrl);

    return (
        <SquircleView cornerSmoothing={60} preserveSmoothing={false} style={[styles.cardContainer, { backgroundColor: colors.containerContent }]}>
            <MediaViewer.Image index={item.mediaIndex ?? 0} style={{ width: "100%", height: VIDEO_HEIGHT, overflow: "hidden", borderRadius: 12 }}>
                <Image
                    source={{ uri: thumbnailUrl }}
                    recyclingKey={thumbnailUrl}
                    style={{ width: "100%", height: "100%", borderRadius: 12 }}
                    contentFit="cover"
                    transition={200}
                    placeholder={{ blurhash: placeholderBlurhash }}
                />
                <View style={styles.playBadge}>
                    <Ionicons name="play" size={18} color="white" />
                </View>
            </MediaViewer.Image>
            <MediaFooter item={item} colors={colors} />
        </SquircleView>
    );
});
VideoCard.displayName = "VideoCard";

const MansoryListScreen = () => {
    const scrollTrigger = useScrollStore((state) => state.triggers["profile"]);
    const listRef = useRef<any>(null);

    useEffect(() => {
        if (scrollTrigger && listRef.current) {
            listRef.current.scrollToOffset({ offset: 0, animated: true });
        }
    }, [scrollTrigger]);

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

    const { media, allUrls, allMediaTypes, allPosterUrls } = useMemo(() => {
        const flat = data?.pages.flatMap((page) => page.data) ?? [];
        let idx = 0;
        const urls: string[] = [];
        const types: string[] = [];
        const posters: string[] = [];
        const items = flat.map(item => {
            const url = choosenMediaPath(item);
            if (url) {
                urls.push(url);
                if (item.type === 'video') {
                    types.push('video');
                    posters.push(item.thumbnail_url || url);
                } else {
                    types.push('image');
                    posters.push('');
                }
                return { ...item, mediaIndex: idx++ };
            }
            return item;
        });
        return { media: items, allUrls: urls, allMediaTypes: types, allPosterUrls: posters };
    }, [data]);

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
            return <VideoCard item={item} colors={colors} />;
        }
        return <PhotoCard item={item} colors={colors} />;
    }, [colors]);

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
                                borderColor: "transparent",
                            },
                        ]}
                    >
                        {activeProfile?.avatar_url ? (
                            <View style={styles.headerAvatar}>
                                <NitroImage
                                    image={{ url: activeProfile.avatar_url }}
                                    style={styles.headerAvatar}
                                    resizeMode="cover"
                                    recyclingKey={activeProfile.avatar_url}
                                />
                            </View>
                        ) : (
                            <View style={styles.headerAvatar}>
                                <NitroImage
                                    image={
                                        activeProfile?.gender === "male"
                                            ? require("../../assets/images/AV17.png")
                                            : require("../../assets/images/AV86.png")
                                    }
                                    style={styles.headerAvatar}
                                    resizeMode="cover"
                                />
                            </View>
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
            <MediaViewer urls={allUrls} mediaTypes={allMediaTypes} posterUrls={allPosterUrls} theme="dark">
                <FlashList
                    ref={listRef}
                    data={media}
                    keyExtractor={(item: any, index: number) => item.id + index.toString()}
                    getItemType={(item: any) => item.type}
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
            </MediaViewer>

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
        borderRadius: 16,
        overflow: "hidden"
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
        overflow: "visible",
        justifyContent: "center",
        alignItems: "center",
    },
    headerAvatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        overflow: "hidden",
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
