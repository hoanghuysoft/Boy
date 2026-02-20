import BookmarkIcon from "@/icons/bookmark";
import CommentIcon from "@/icons/comment";
import LikeIcon from "@/icons/like";
import ShareIcon from "@/icons/share";
import VerifiedIcon from "@/icons/verified";
import { Link, Post } from "@/types/post";
import { Ionicons } from "@expo/vector-icons";
import { VolumeCrossBold, VolumeLoudBold } from '@solar-icons/react-native';
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Dimensions, Linking, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Pressable } from 'react-native-gesture-handler';
import TurboImage from 'react-native-turbo-image';
import { useThemeContext } from "../context/ThemeContext";
import { useAudioStore } from "../stores/audio";
import { createCommonStyles } from "../styles/common";
import CaptionText from "./CaptionText";
import { PostMediaCarousel } from "./PostMediaCarousel";
import { PostMetaInfo } from "./PostMetaInfo";

// TurboImage cache policy - use dataCache for aggressive local caching
const IMAGE_CACHE_POLICY = "dataCache" as const;

interface PostItemProps {
    post: Post;
    onOptionsPress?: (post: Post) => void;
}

export const PostItem = ({ post, onOptionsPress }: PostItemProps) => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const currentProfileId = Array.isArray(params.id) ? params.id[0] : params.id;
    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);

    const handleProfilePress = () => {
        // If we're already on this profile screen, ignore the press to avoid redundant navigation
        if (currentProfileId && String(currentProfileId) === String(post.profile_id)) return;

        router.push({
            pathname: '/profile/[id]',
            params: { id: post.profile_id }
        });
    };

    const { currentlyPlayingId, playTrack, stopPlayback } = useAudioStore();

    const isPlaying = currentlyPlayingId === post.id;

    const toggleMusic = () => {
        if (!post.music?.preview_url) return;

        if (isPlaying) {
            stopPlayback();
        } else {
            playTrack(post.id, post.music.preview_url, {
                title: post.music.title,
                artist: post.music.artist,
                coverUrl: post.music.cover_url,
            });
        }
    };

    const hasMedia = post.media && post.media.length > 0;
    const hasMusic = !!post.music?.preview_url;

    return (
        <View style={{}}>
            {/* Header */}
            <View style={[common.row, { justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 8 }]}>
                <Pressable onPress={handleProfilePress} style={[common.row, { gap: 12, flex: 1 }]}>
                    <TurboImage
                        source={{ uri: post.profile_avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png" }}
                        style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.divider }}
                        cachePolicy={IMAGE_CACHE_POLICY}
                        fadeDuration={100}
                    />
                    <View>
                        <View style={[common.row, { gap: 4 }]}>
                            <Text style={[common.heading, { fontSize: 16 }]}>{post.profile_name}</Text>
                            {post.profile_is_verified && <VerifiedIcon size={14} backgroundColor={colors.verify} />}
                        </View>
                        <PostMetaInfo post={post} />
                    </View>
                </Pressable>
                <Pressable
                    hitSlop={10}
                    style={{ backgroundColor: colors.card, borderRadius: 999, alignItems: 'center', justifyContent: 'center', width: 40, height: 40 }}
                    onPress={() => onOptionsPress?.(post)}
                >
                    <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
                </Pressable>
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
                        {isPlaying ? <VolumeLoudBold size={18} color="white" /> : <VolumeCrossBold size={18} color="white" />}
                    </TouchableOpacity>
                )}
            </View>
            {/* Invisible Spacer for No-Media Posts */}
            {!hasMedia && (
                <View style={{ width: Dimensions.get("window").width, height: 1 }} />
            )}

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
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16 }}
                    >
                        {post.links.map((item: Link, index: number) => (
                            <TouchableOpacity
                                key={item.url || index}
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
                        ))}
                    </ScrollView>
                </View>
            )}

            {post.device && <Text style={[common.label, { color: colors.muted, fontSize: 13, marginBottom: 8, paddingHorizontal: 16 }]}>This post was created on {post.device}</Text>}

            {/* Action Bar */}
            <View style={[common.row, { justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 16 }]}>
                <View style={[common.row, { gap: 20 }]}>
                    <TouchableOpacity hitSlop={10} style={[common.row, { gap: 6, alignItems: 'center' }]}>
                        <LikeIcon size={24} color={colors.text} />
                        <Text style={[common.label, { color: colors.text, fontWeight: '800' }]}>{post.like_count}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity hitSlop={10} style={[common.row, { gap: 6, alignItems: 'center' }]}>
                        <CommentIcon size={24} color={colors.text} />
                        <Text style={[common.label, { color: colors.text, fontWeight: '800' }]}>{post.comment_count}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity hitSlop={10} style={[common.row, { gap: 6, alignItems: 'center' }]}>
                        <ShareIcon size={24} color={colors.text} />
                        <Text style={[common.label, { color: colors.text, fontWeight: '800' }]}>{post.share_count}</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity hitSlop={10}>
                    <BookmarkIcon size={24} color={colors.text} />
                </TouchableOpacity>
            </View>
        </View>
    );
};
