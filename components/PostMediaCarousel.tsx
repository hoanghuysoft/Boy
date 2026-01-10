import PlayIcon from "@/icons/play";
import { useSettingsStore } from "@/stores/settings";
import { Media } from "@/types/post";
import FastImage from "@d11/react-native-fast-image";
import { Ionicons } from "@expo/vector-icons";
import Galeria from "@nandorojo/galeria/build/GaleriaView";
import { FlashList as FlashListOriginal } from "@shopify/flash-list";
import { Blur, Canvas, Image as SkiaImage, useImage } from "@shopify/react-native-skia";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const FlashList = FlashListOriginal as any;

interface PostMediaCarouselProps {
    media: Media[];
    profileName: string;
    content?: string;
    colors: any;
    isAdult?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ASPECT_RATIO = 3 / 4;

// Skia Blur Overlay Component
interface BlurOverlayProps {
    imageUrl: string;
    width: number;
    height: number;
    onReveal: () => void;
}

const BlurOverlay = ({ imageUrl, width, height, onReveal }: BlurOverlayProps) => {
    const image = useImage(imageUrl);
    const isLoading = !image;

    return (
        <TouchableOpacity
            onPress={onReveal}
            activeOpacity={1}
            style={[StyleSheet.absoluteFill, { zIndex: 10 }]}
        >
            {/* Dark overlay shown while blur is loading */}
            {isLoading && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.95)' }]} />
            )}
            {/* Skia blur shown when image is ready */}
            {image && (
                <Canvas style={StyleSheet.absoluteFill}>
                    <SkiaImage
                        x={0}
                        y={0}
                        width={width}
                        height={height}
                        image={image}
                        fit="cover"
                    >
                        <Blur blur={30} mode="clamp" />
                    </SkiaImage>
                </Canvas>
            )}
            <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: isLoading ? 'transparent' : 'rgba(0,0,0,0.3)' }]}>
                <View style={{ alignItems: 'center', gap: 8 }}>
                    <Ionicons name="eye-off-outline" size={32} color="white" />
                    <Text style={{ color: 'white', fontWeight: '600' }}>Sensitive Content</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Tap to see</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

export const PostMediaCarousel = ({ media, profileName, content, colors, isAdult = false }: PostMediaCarouselProps) => {
    const router = useRouter();
    const [activeIndex, setActiveIndex] = useState(0);
    const { showSensitiveContent, setShowSensitiveContent } = useSettingsStore();
    const [isRevealed, setIsRevealed] = useState(false);

    // If "Everyone" setting is ON, we are revealed by default.
    // If OFF, we respect "isAdult" -> if isAdult, then not revealed.
    // However, user can tap to reveal locally.

    const shouldBlur = isAdult && !showSensitiveContent && !isRevealed;

    const onReveal = () => {
        setIsRevealed(true);
        // Requirement: "save the config". 
        // If users taps reveal, do we enable it GLOBALLY? 
        // "touching it will shows the content and save the config"
        setShowSensitiveContent(true);
    };

    // Filter urls for Galeria (only photos)
    const photoUrls = useMemo(() =>
        media.filter(m => m.type === 'photo').map(m => m.url),
        [media]);

    const onViewableItemsChanged = ({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setActiveIndex(viewableItems[0].index || 0);
        }
    };

    // Calculate media height based on aspect ratio
    const mediaHeight = SCREEN_WIDTH / ASPECT_RATIO;

    if (!media || media.length === 0) return null;

    return (
        <View style={{ marginBottom: 16 }}>
            <Galeria urls={photoUrls}>
                <FlashList
                    data={media}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    estimatedItemSize={SCREEN_WIDTH}
                    keyExtractor={(item: Media) => item.id}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                    renderItem={({ item, index }: { item: Media, index: number }) => {
                        // Calculate index for Galeria: count how many photos appeared before this item
                        const photoIndex = media.slice(0, index).filter(m => m.type === 'photo').length;

                        if (item.type === 'video') {
                            return (
                                <View style={{ width: SCREEN_WIDTH }}>
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={() => router.push({ pathname: '/video_player', params: { videoUrl: item.url, name: profileName, caption: content, portrait: 'true' } })}
                                        style={{ width: '100%', aspectRatio: ASPECT_RATIO }}
                                    >
                                        <FastImage
                                            source={{ uri: item.thumbnail_url || item.url }}
                                            style={{ width: '100%', height: '100%', backgroundColor: colors.divider }}
                                            resizeMode="cover"
                                        >
                                            {shouldBlur && (
                                                <TouchableOpacity
                                                    onPress={onReveal}
                                                    activeOpacity={1}
                                                    style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 10, justifyContent: 'center', alignItems: 'center' }]}
                                                >
                                                    <View style={{ alignItems: 'center', gap: 8 }}>
                                                        <Ionicons name="eye-off-outline" size={32} color="white" />
                                                        <Text style={{ color: 'white', fontWeight: '600' }}>Sensitive Content</Text>
                                                        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Tap to see</Text>
                                                    </View>
                                                </TouchableOpacity>
                                            )}
                                            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.1)' }}>
                                                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
                                                    <PlayIcon size={24} color="#ffffff" style={{ marginLeft: 4 }} />
                                                </View>
                                            </View>
                                        </FastImage>
                                    </TouchableOpacity>
                                </View>
                            );
                        }

                        // Photo
                        return (
                            <View style={{ width: SCREEN_WIDTH }}>
                                <Galeria.Image index={photoIndex}>
                                    <View>
                                        <Image
                                            source={{ uri: item.url }}
                                            style={{ width: '100%', aspectRatio: ASPECT_RATIO, backgroundColor: colors.divider }}
                                            resizeMode="cover"
                                        />
                                        {shouldBlur && (
                                            <BlurOverlay
                                                imageUrl={item.url}
                                                width={SCREEN_WIDTH}
                                                height={mediaHeight}
                                                onReveal={onReveal}
                                            />
                                        )}
                                    </View>
                                </Galeria.Image>
                            </View>
                        );
                    }}
                />
            </Galeria>

            {/* Pagination Dots */}
            {media.length > 1 && (
                <View style={{ position: 'absolute', bottom: 12, flexDirection: 'row', width: '100%', justifyContent: 'center', gap: 6 }}>
                    {media.map((_, i) => (
                        <View
                            key={i}
                            style={{
                                width: 6,
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: i === activeIndex ? '#ffffff' : 'rgba(255,255,255,0.4)',
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.3,
                                shadowRadius: 2,
                            }}
                        />
                    ))}
                </View>
            )}
        </View>
    );
};
