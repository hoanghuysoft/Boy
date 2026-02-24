import BookmarkIcon from "@/icons/bookmark";
import BookmarkSolidIcon from "@/icons/bookmarksolid";
import CommentIcon from "@/icons/comment";
import LikeIcon from "@/icons/like";
import LikeSolidIcon from "@/icons/likedsolid";
import ShareIcon from "@/icons/share";
import VerifiedIcon from "@/icons/verified";
import { Link, Post } from "@/types/post";
import { Ionicons } from "@expo/vector-icons";
import { VolumeCrossBold, VolumeLoudBold } from '@solar-icons/react-native';
import React from "react";
import { Dimensions, Linking, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Pressable } from 'react-native-gesture-handler';
import TurboImage from 'react-native-turbo-image';
import { usePostItemViewModel } from "../viewmodels/PostItemViewModel";
import CaptionText from "./CaptionText";
import { PostMediaCarousel } from "./PostMediaCarousel";
import { PostMetaInfo } from "./PostMetaInfo";

// TurboImage cache policy - use dataCache for aggressive local caching
const IMAGE_CACHE_POLICY = "dataCache" as const;

interface PostItemProps {
    post: Post;
    onOptionsPress?: (post: Post) => void;
    onLikeCountPress?: (post: Post) => void;
}

export const PostItem = ({ post, onOptionsPress, onLikeCountPress }: PostItemProps) => {
    const vm = usePostItemViewModel({ post, onOptionsPress, onLikeCountPress });

    return (
        <View style={{}}>
            {/* Header */}
            <View style={[vm.common.row, { justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 8 }]}>
                <Pressable onPress={vm.handleProfilePress} style={[vm.common.row, { gap: 12, flex: 1 }]}>
                    <TurboImage
                        source={{ uri: post.profile_avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png" }}
                        style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: vm.colors.divider }}
                        cachePolicy={IMAGE_CACHE_POLICY}
                        fadeDuration={100}
                    />
                    <View>
                        <View style={[vm.common.row, { gap: 4 }]}>
                            <Text style={[vm.common.heading, { fontSize: 16 }]}>{post.profile_name}</Text>
                            {post.profile_is_verified && <VerifiedIcon size={14} backgroundColor={vm.colors.verify} />}
                        </View>
                        <PostMetaInfo post={post} />
                    </View>
                </Pressable>
                <Pressable
                    hitSlop={10}
                    style={{ backgroundColor: vm.colors.card, borderRadius: 999, alignItems: 'center', justifyContent: 'center', width: 40, height: 40 }}
                    onPress={vm.handleOptionsPress}
                >
                    <Ionicons name="ellipsis-horizontal" size={20} color={vm.colors.text} />
                </Pressable>
            </View>

            {/* Caption */}
            {post.content ? (
                <View style={{ paddingHorizontal: 16 }}>
                    <CaptionText caption={post.content} colors={vm.colors} common={vm.common} />
                </View>
            ) : null}

            {/* Media & Audio Overlay */}
            <View>
                <PostMediaCarousel
                    media={post.media}
                    profileName={post.profile_name}
                    content={post.content}
                    colors={vm.colors}
                    isAdult={post.is_adult}
                    isVerified={post.profile_is_verified}
                    musicUrl={post.music?.preview_url}
                    musicTitle={post.music ? `${post.music.artist} - ${post.music.title}` : undefined}
                />

                {vm.hasMedia && vm.hasMusic && (
                    <TouchableOpacity
                        onPress={vm.toggleMusic}
                        style={{
                            position: 'absolute',
                            bottom: 24,
                            right: 16,
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            padding: 8,
                            borderRadius: 20,
                            zIndex: 20
                        }}
                    >
                        {vm.isPlaying ? <VolumeLoudBold size={18} color="white" /> : <VolumeCrossBold size={18} color="white" />}
                    </TouchableOpacity>
                )}
            </View>
            {/* Invisible Spacer for No-Media Posts */}
            {!vm.hasMedia && (
                <View style={{ width: Dimensions.get("window").width, height: 1 }} />
            )}

            {/* Audio Button for No-Media Posts */}
            {!vm.hasMedia && vm.hasMusic && (
                <View style={{ alignItems: 'flex-end', paddingHorizontal: 16, marginBottom: 12 }}>
                    <TouchableOpacity
                        onPress={vm.toggleMusic}
                        style={{
                            backgroundColor: vm.colors.card,
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 20,
                            borderWidth: 1,
                            borderColor: vm.colors.divider,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6
                        }}
                    >
                        <Ionicons name={vm.isPlaying ? "volume-high" : "volume-mute"} size={16} color={vm.colors.text} />
                        <Text style={[vm.common.label, { fontSize: 12 }]}>Preview</Text>
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
                                    backgroundColor: vm.colors.card,
                                    paddingHorizontal: 12,
                                    paddingVertical: 8,
                                    borderRadius: 8,
                                    marginRight: 8,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 6,
                                    borderWidth: 1,
                                    borderColor: vm.colors.divider
                                }}
                            >
                                <Ionicons name="link-outline" size={16} color={vm.colors.muted} />
                                <Text style={[vm.common.label, { color: vm.colors.text, fontSize: 13, fontWeight: '500' }]}>
                                    {item.label}
                                </Text>
                                <Ionicons name="open-outline" size={14} color={vm.colors.muted} style={{ marginLeft: 4 }} />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {post.device && <Text style={[vm.common.label, { color: vm.colors.muted, fontSize: 13, marginBottom: 8, paddingHorizontal: 16 }]}>This post was created on {post.device}</Text>}

            {/* Action Bar */}
            <View style={[vm.common.row, { justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 16 }]}>
                <View style={[vm.common.row, { gap: 20 }]}>
                    <View style={[vm.common.row, { gap: 6, alignItems: 'center' }]}>
                        <TouchableOpacity hitSlop={10} onPress={vm.handleLikePress}>
                            {vm.isLiked ? (
                                <LikeSolidIcon size={24} color={vm.colors.text} />
                            ) : (
                                <LikeIcon size={24} color={vm.colors.text} />
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity hitSlop={10} onPress={vm.handleLikeCountPress}>
                            <Text style={[vm.common.label, { color: vm.colors.text, fontWeight: '800' }]}>{vm.likeCount}</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity hitSlop={10} style={[vm.common.row, { gap: 6, alignItems: 'center' }]}>
                        <CommentIcon size={24} color={vm.colors.text} />
                        <Text style={[vm.common.label, { color: vm.colors.text, fontWeight: '800' }]}>{post.comment_count}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity hitSlop={10} style={[vm.common.row, { gap: 6, alignItems: 'center' }]}>
                        <ShareIcon size={24} color={vm.colors.text} />
                        <Text style={[vm.common.label, { color: vm.colors.text, fontWeight: '800' }]}>{post.share_count}</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity hitSlop={10}>
                    {post.is_bookmarked ? (
                        <BookmarkSolidIcon size={24} color={vm.colors.text} />
                    ) : (
                        <BookmarkIcon size={24} color={vm.colors.text} />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};
