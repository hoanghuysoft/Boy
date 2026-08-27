import { FlexText } from "@/components/FlexText";
import { VideoItem } from "@/types/video";
import { formatCompactNumber } from "@/utils/formatNumber";
import { useEventListener } from "expo";
import { Image } from "expo-image";
import { router } from "expo-router";
import { VideoPlayer, VideoView } from "expo-video";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Platform,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    useWindowDimensions,
    View,
} from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { FloatingHeart } from "./FloatingHeart";
import { ShotSeekBar } from "./ShotSeekBar";

const IS_ANDROID = Platform.OS === 'android';

// ─── Thumbnail / Poster Placeholder (matches Bluesky VideoItemPlaceholder) ───
function VideoItemPlaceholder({
    thumbnailUrl,
    mediaUrl,
}: {
    thumbnailUrl?: string | null;
    mediaUrl?: string | null;
}) {
    const src = thumbnailUrl || mediaUrl;
    if (!src) return null;

    return (
        <Image
            source={{ uri: src }}
            style={StyleSheet.absoluteFill}
            contentFit="contain"
            cachePolicy="disk"
            accessibilityIgnoresInvertColors
        />
    );
}

// ─── Inner Video Component (matches Bluesky VideoItemInner) ──────────
interface VideoItemInnerProps {
    player: VideoPlayer;
    isActive: boolean;
}

const VideoItemInner = React.memo(function VideoItemInner({
    player,
    isActive,
}: VideoItemInnerProps) {
    const [isReady, setIsReady] = useState(!IS_ANDROID);

    useEventListener(player, "timeUpdate", (evt) => {
        if (IS_ANDROID && !isReady && evt.currentTime >= 0.05) {
            setIsReady(true);
        }
    });

    useEventListener(player, "statusChange", ({ status }) => {
        if (status === "readyToPlay" && isActive) {
            setIsReady(true);
        }
    });

    return (
        <VideoView
            player={player}
            style={[
                StyleSheet.absoluteFill,
                !isReady && { opacity: 0 },
            ]}
            contentFit="contain"
            surfaceType={IS_ANDROID ? 'textureView' : 'surfaceView'}
            nativeControls={false}
            onFirstFrameRender={() => {
                setIsReady(true);
            }}
        />
    );
});

// ─── Props ──────────────────────────────────────────────────────────
export interface ShotItemProps {
    item: VideoItem;
    player?: VideoPlayer;
    isActive: boolean;
    isAdjacent: boolean;
    isFocused: boolean;
    itemHeight: number;
    isLiked: boolean;
    likeCount: number;
    onLikePress: () => void;
    onCommentPress: () => void;
    onSeekingChange?: (seeking: boolean) => void;
    colors: any;
    insets: any;
    isCommentsOpen: boolean;
}

// ─── Component ──────────────────────────────────────────────────────
export const ShotItem = React.memo(function ShotItem({
    item,
    player,
    isActive,
    isAdjacent,
    isFocused,
    itemHeight,
    isLiked,
    likeCount,
    onLikePress,
    onCommentPress,
    onSeekingChange,
    colors,
    insets,
    isCommentsOpen,
}: ShotItemProps) {
    const { width: screenWidth } = useWindowDimensions();

    // Local user pause toggle
    const [userPaused, setUserPaused] = useState(false);

    // Hardware surface optimization (Bluesky pattern):
    // Android: render VideoView only for active item
    // iOS: render for active and adjacent items
    const shouldRenderVideo = (isActive || (!IS_ANDROID && isAdjacent)) && !!player;

    useEffect(() => {
        if (isActive) {
            setUserPaused(false);
        }
    }, [isActive, item.id]);

    // ─── Double-tap to like / single-tap to pause ─────────────────────────
    const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
    const lastTapTime = useRef(0);
    const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleVideoPress = (e: any) => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        if (singleTapTimer.current) {
            clearTimeout(singleTapTimer.current);
            singleTapTimer.current = null;
        }

        if (now - lastTapTime.current < DOUBLE_TAP_DELAY) {
            // Double tap — like
            if (!isLiked) {
                onLikePress();
            }
            const { locationX, locationY } = e.nativeEvent;
            setHearts(prev => [...prev, { id: now + Math.random(), x: locationX, y: locationY }]);
            lastTapTime.current = now;
        } else {
            lastTapTime.current = now;
            singleTapTimer.current = setTimeout(() => {
                if (player) {
                    try {
                        if (player.playing) {
                            player.pause();
                            setUserPaused(true);
                        } else {
                            player.play();
                            setUserPaused(false);
                        }
                    } catch { }
                }
                singleTapTimer.current = null;
            }, DOUBLE_TAP_DELAY);
        }
    };

    const removeHeart = useCallback((id: number) => {
        setHearts(prev => prev.filter(h => h.id !== id));
    }, []);

    return (
        <View style={[styles.itemContainer, { height: itemHeight, width: screenWidth }]}>
            {/* Video area — pure black background */}
            <View style={[styles.videoArea, { height: itemHeight, width: screenWidth }]}>
                {/* Pure Black Canvas */}
                <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} />

                {/* Video Placeholder / Thumbnail (matches Bluesky VideoItemPlaceholder) */}
                <VideoItemPlaceholder
                    thumbnailUrl={item.thumbnail_url}
                    mediaUrl={item.media_url}
                />

                {/* Video View (matches Bluesky VideoItemInner) */}
                {shouldRenderVideo && player && (
                    <VideoItemInner
                        player={player}
                        isActive={isActive}
                    />
                )}
            </View>

            {/* Tap layer — covers full item for pause/like */}
            <TouchableWithoutFeedback onPress={handleVideoPress}>
                <View style={StyleSheet.absoluteFill} />
            </TouchableWithoutFeedback>

            {/* Floating hearts */}
            {hearts.map(heart => (
                <FloatingHeart
                    key={heart.id}
                    x={heart.x}
                    y={heart.y}
                    onComplete={() => removeHeart(heart.id)}
                />
            ))}

            {/* Paused indicator */}
            {userPaused && isActive && (
                <View style={styles.pausedOverlay} pointerEvents="none">
                    <Ionicons name="play" size={64} color="rgba(255,255,255,0.8)" />
                </View>
            )}

            {/* Seek bar — only rendered for active item (Bluesky Scrubber pattern) */}
            {isActive && player && (
                <ShotSeekBar
                    player={player}
                    isActive={isActive}
                    bottom={insets.bottom + 95}
                    onSeekingChange={onSeekingChange}
                />
            )}

            {/* Bottom info — username & caption */}
            <View style={[styles.bottomInfo, { paddingBottom: insets.bottom + 130 }]} pointerEvents="box-none">
                <TouchableOpacity
                    onPress={() => router.push(`/profile/${item.profile_id}`)}
                    style={styles.profileRow}
                >
                    {item.profile_avatar && (
                        <Image
                            source={{ uri: item.profile_avatar }}
                            style={styles.avatar}
                            contentFit="cover"
                        />
                    )}
                    <FlexText style={styles.profileName}>{item.profile_name}</FlexText>
                </TouchableOpacity>
                {item.caption && (
                    <FlexText style={styles.caption} numberOfLines={2}>
                        {item.caption}
                    </FlexText>
                )}
            </View>

            {/* Right side actions */}
            <View style={[styles.rightActions, { bottom: insets.bottom + 140 }]}>
                {/* Like */}
                <TouchableOpacity style={styles.actionButton} onPress={onLikePress} hitSlop={10}>
                    {!isLiked
                        ? <Image source={{ uri: "https://ico.hugeicons.com/love-korean-finger-stroke-sharp@3x.webp?x=365593185" }} style={{ width: 36, height: 36 }} contentFit="cover" tintColor={'white'} />
                        : <Image source={{ uri: "https://ico.hugeicons.com/love-korean-finger-solid-standard@3x.webp?x=365593185" }} style={{ width: 36, height: 36 }} contentFit="cover" tintColor={'white'} />
                    }
                    <FlexText style={[styles.actionText, isLiked && { color: 'white' }]}>
                        {formatCompactNumber(likeCount)}
                    </FlexText>
                </TouchableOpacity>

                {/* Comments */}
                <TouchableOpacity style={styles.actionButton} onPress={onCommentPress} hitSlop={10}>
                    <Image source={{ uri: 'https://ico.hugeicons.com/chat-favourite-01-solid-rounded@3x.webp?x=830623945' }} style={{ width: 36, height: 36 }} contentFit="cover" tintColor={'white'} />
                    <FlexText style={styles.actionText}>
                        {formatCompactNumber(item.comment_count)}
                    </FlexText>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                    <Image source={{ uri: 'https://ico.hugeicons.com/bookmark-02-solid-rounded@3x.webp?x=94312725' }} style={{ width: 36, height: 36 }} contentFit="cover" tintColor={'white'} />
                    <FlexText style={styles.actionText}>
                        {formatCompactNumber(item.comment_count)}
                    </FlexText>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                    <Image source={{ uri: 'https://ico.hugeicons.com/repost-solid-rounded@3x.webp?x=2071587840' }} style={{ width: 36, height: 36 }} contentFit="cover" tintColor={'white'} />
                    <FlexText style={styles.actionText}>
                        {formatCompactNumber(item.comment_count)}
                    </FlexText>
                </TouchableOpacity>

                {/* Share */}
                <TouchableOpacity style={styles.actionButton}>
                    <Image source={{ uri: 'https://ico.hugeicons.com/share-01-solid-rounded@3x.webp?x=731754750' }} style={{ width: 36, height: 36 }} contentFit="cover" tintColor={'white'} />
                    <FlexText style={styles.actionText}>
                        {formatCompactNumber(item.comment_count)}
                    </FlexText>
                </TouchableOpacity>
            </View>
        </View>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.player === nextProps.player &&
        prevProps.isActive === nextProps.isActive &&
        prevProps.isAdjacent === nextProps.isAdjacent &&
        prevProps.isFocused === nextProps.isFocused &&
        prevProps.itemHeight === nextProps.itemHeight &&
        prevProps.item.id === nextProps.item.id &&
        prevProps.item.comment_count === nextProps.item.comment_count &&
        prevProps.isLiked === nextProps.isLiked &&
        prevProps.likeCount === nextProps.likeCount &&
        prevProps.isCommentsOpen === nextProps.isCommentsOpen
    );
});

ShotItem.displayName = 'ShotItem';

// ─── Styles ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    itemContainer: {
        backgroundColor: '#000000',
        overflow: "hidden",
    },
    videoArea: {
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000000',
    },
    pausedOverlay: {
        ...StyleSheet.absoluteFill,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomInfo: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 70,
        paddingHorizontal: 16,
        zIndex: 1000,
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    avatar: {
        marginRight: 10,
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    profileName: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    caption: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 16,
        lineHeight: 18,
    },
    rightActions: {
        position: 'absolute',
        right: 12,
        alignItems: 'center',
        gap: 15,
    },
    actionButton: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionText: {
        color: 'white',
        fontSize: 16,
        marginTop: 2,
        fontWeight: '600',
    },
});
