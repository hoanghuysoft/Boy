import BookmarkIcon from "@/icons/bookmark";
import CommentIcon from "@/icons/comment";
import LikeIcon from "@/icons/like";
import ShareIcon from "@/icons/share";
import VerifiedIcon from "@/icons/verified";
import { Link, Post } from "@/types/post";
import FastImage from "@d11/react-native-fast-image";
import { Ionicons } from "@expo/vector-icons";
import { FlashList as FlashListOriginal } from "@shopify/flash-list";
import { useAudioPlayer } from "expo-audio";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Linking, Text, TouchableOpacity, View } from "react-native";
import { useThemeContext } from "../context/ThemeContext";
import { useAudioStore } from "../stores/audio";
import { createCommonStyles } from "../styles/common";
import CaptionText from "./CaptionText";
import { PostMediaCarousel } from "./PostMediaCarousel";
import { PostMetaInfo } from "./PostMetaInfo";

const FlashList = FlashListOriginal as any;

interface PostItemProps {
    post: Post;
    onOptionsPress?: (post: Post) => void;
}

export const PostItem = ({ post, onOptionsPress }: PostItemProps) => {
    const router = useRouter();
    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const [isPlaying, setIsPlaying] = useState(false);

    // Global store for single play enforcement
    const { currentlyPlayingId, setCurrentlyPlayingId } = useAudioStore();

    // Only initialize player if preview_url exists
    const audioSource = post.music?.preview_url ? { uri: post.music.preview_url } : null;
    const player = useAudioPlayer(audioSource);

    // Sync player state with store
    useEffect(() => {
        if (!player) return;

        // If another post started playing, pause this one
        if (currentlyPlayingId !== post.id && isPlaying) {
            player.pause();
            setIsPlaying(false);
        }
    }, [currentlyPlayingId, player, post.id, isPlaying]);

    useEffect(() => {
        // Poll for playing state to keep UI in sync
        const interval = setInterval(() => {
            if (player) {
                // If player finished naturally
                if (player.playing !== isPlaying) {
                    setIsPlaying(player.playing);
                    if (!player.playing && currentlyPlayingId === post.id) {
                        // Optional: reset store if needed, or keep it as 'last played'
                    }
                }
            }
        }, 500);
        return () => clearInterval(interval);
    }, [player, isPlaying, currentlyPlayingId, post.id]);

    const toggleMusic = () => {
        if (!player) return;

        if (player.playing) {
            player.pause();
            setIsPlaying(false);
            setCurrentlyPlayingId(null);
        } else {
            // Set this as the currently playing ID BEFORE playing
            setCurrentlyPlayingId(post.id);

            // Restart if near end
            if (player.duration > 0 && Math.abs(player.currentTime - player.duration) < 0.5) {
                player.seekTo(0);
            }
            player.play();
            setIsPlaying(true);
        }
    };

    const hasMedia = post.media && post.media.length > 0;
    const hasMusic = !!post.music?.preview_url;

    return (
        <View style={{}}>
            {/* Header */}
            <View style={[common.row, { justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 8 }]}>
                <TouchableOpacity onPress={() => router.push({ pathname: '/profile/[id]', params: { id: post.profile_id } })} style={[common.row, { gap: 12 }]}>
                    <FastImage source={{ uri: post.profile_avatar }} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.divider }} />
                    <View>
                        <View style={[common.row, { gap: 2 }]}>
                            <Text style={[common.heading, { fontSize: 16 }]}>{post.profile_name}</Text>
                            {post.profile_is_verified && <VerifiedIcon size={16} backgroundColor={colors.verify} />}
                        </View>
                        <PostMetaInfo post={post} />
                    </View>
                </TouchableOpacity>
                <TouchableOpacity
                    hitSlop={10}
                    style={{ backgroundColor: colors.card, borderRadius: 999, alignItems: 'center', justifyContent: 'center', width: 40, height: 40 }}
                    onPress={() => onOptionsPress?.(post)}
                >
                    <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* Caption */}
            {post.content ? (
                <View style={{ paddingHorizontal: 16 }}>
                    <CaptionText caption={post.content} colors={colors} common={common} />
                </View>
            ) : null}

            {/* Media & Audio Overlay */}
            <View>
                <PostMediaCarousel
                    media={post.media}
                    profileName={post.profile_name}
                    content={post.content}
                    colors={colors}
                    isAdult={post.is_adult}
                    isVerified={post.profile_is_verified}
                    musicUrl={post.music?.preview_url}
                    musicTitle={post.music ? `${post.music.artist} - ${post.music.title}` : undefined}
                />

                {hasMedia && hasMusic && (
                    <TouchableOpacity
                        onPress={toggleMusic}
                        style={{
                            position: 'absolute',
                            bottom: 24, // Sits above the marginBottom of PostMediaCarousel or at bottom right
                            right: 16,
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            padding: 8,
                            borderRadius: 20,
                            zIndex: 20
                        }}
                    >
                        <Ionicons name={isPlaying ? "volume-high" : "volume-mute"} size={18} color="white" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Audio Button for No-Media Posts */}
            {!hasMedia && hasMusic && (
                <View style={{ alignItems: 'flex-end', paddingHorizontal: 16, marginBottom: 12 }}>
                    <TouchableOpacity
                        onPress={toggleMusic}
                        style={{
                            backgroundColor: colors.card,
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 20,
                            borderWidth: 1,
                            borderColor: colors.divider,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6
                        }}
                    >
                        <Ionicons name={isPlaying ? "volume-high" : "volume-mute"} size={16} color={colors.text} />
                        <Text style={[common.label, { fontSize: 12 }]}>Preview</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Links */}
            {post.links && post.links.length > 0 && (
                <View style={{ marginBottom: 12 }}>
                    <FlashList
                        data={post.links}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        estimatedItemSize={120}
                        contentContainerStyle={{ paddingHorizontal: 16 }}
                        renderItem={({ item }: { item: Link }) => (
                            <TouchableOpacity
                                onPress={() => Linking.openURL(item.url)}
                                style={{
                                    backgroundColor: colors.card,
                                    paddingHorizontal: 12,
                                    paddingVertical: 8,
                                    borderRadius: 8,
                                    marginRight: 8,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 6,
                                    borderWidth: 1,
                                    borderColor: colors.divider
                                }}
                            >
                                <Ionicons name="link-outline" size={16} color={colors.muted} />
                                <Text style={[common.label, { color: colors.text, fontSize: 13, fontWeight: '500' }]}>
                                    {item.label}
                                </Text>
                                <Ionicons name="open-outline" size={14} color={colors.muted} style={{ marginLeft: 4 }} />
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}

            {post.device && <Text style={[common.label, { color: colors.muted, fontSize: 13, marginBottom: 8, paddingHorizontal: 16 }]}>This post was created on {post.device}</Text>}

            {/* Action Bar */}
            <View style={[common.row, { justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 16 }]}>
                <View style={[common.row, { gap: 20 }]}>
                    <TouchableOpacity hitSlop={10} style={[common.row, { gap: 6, alignItems: 'center' }]}>
                        <LikeIcon size={24} color={colors.text} />
                        <Text style={[common.label, { color: colors.text, fontWeight: '600' }]}>{post.like_count}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity hitSlop={10} style={[common.row, { gap: 6, alignItems: 'center' }]}>
                        <CommentIcon size={24} color={colors.text} />
                        <Text style={[common.label, { color: colors.text, fontWeight: '600' }]}>{post.comment_count}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity hitSlop={10} style={[common.row, { gap: 6, alignItems: 'center' }]}>
                        <ShareIcon size={24} color={colors.text} />
                        <Text style={[common.label, { color: colors.text, fontWeight: '600' }]}>{post.share_count}</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity hitSlop={10}>
                    <BookmarkIcon size={24} color={colors.text} />
                </TouchableOpacity>
            </View>
        </View>
    );
};
