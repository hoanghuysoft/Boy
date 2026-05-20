import BookmarkIcon from "@/icons/bookmark";
import BookmarkSolidIcon from "@/icons/bookmarksolid";
import CommentIcon from "@/icons/comment";
import LikeIcon from "@/icons/like";
import LikeSolidIcon from "@/icons/likedsolid";
import ShareIcon from "@/icons/share";
import VerifiedIcon from "@/icons/verified";
import { useFeedVideoStore } from "@/stores/feedVideo";
import { Link, Post } from "@/types/post";
import { stripYouTubeUrls } from "@/utils/youtube";
import { Ionicons } from "@expo/vector-icons";
import { MusicNotesBold, MusicNotesOutline, VolumeCrossBold, VolumeLoudBold } from '@solar-icons/react-native';
import React from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, TouchableOpacity, View } from "react-native";
import { Pressable, ScrollView } from 'react-native-gesture-handler';
import { NitroImage } from "react-native-nitro-image";
import { usePostItemViewModel } from "../viewmodels/PostItemViewModel";
import CaptionText from "./CaptionText";
import { FlexText } from "./FlexText";
import { PostAudioWaveform } from "./PostAudioWaveform";
import { LINK_CARD_WIDTH, PostLinkPreview } from "./PostLinkPreview";
import { PostMediaCarousel } from "./PostMediaCarousel";
import { PostMetaInfo } from "./PostMetaInfo";
import { YouTubePostPlayer } from "./YouTubePostPlayer";

// TurboImage cache policy - use dataCache for aggressive local caching
const IMAGE_CACHE_POLICY = "dataCache" as const;

interface PostItemProps {
    post: Post;
    onOptionsPress?: (post: Post) => void;
    onLikeCountPress?: (post: Post) => void;
    onCommentPress?: (post: Post) => void;
    isBookmarked?: boolean;
}

export const PostItem = React.memo(({ post, onOptionsPress, onLikeCountPress, onCommentPress, isBookmarked = false }: PostItemProps) => {
    const vm = usePostItemViewModel({ post, onOptionsPress, onLikeCountPress, onCommentPress });
    const { t } = useTranslation();

    // Feed video state - optimally select ONLY boolean to prevent mass re-renders
    const isActiveVideoPost = useFeedVideoStore(s => s.activePostId === post.id);
    const isVideoMuted = useFeedVideoStore(s => s.isMuted);
    const toggleVideoMute = useFeedVideoStore(s => s.toggleMute);
    const hasVideo = post.media?.some(m => m.type === 'video');

    // Caption without any YouTube URLs — those are rendered by YouTubePostPlayer.
    const captionWithoutYouTube = React.useMemo(
        () => (post.content ? stripYouTubeUrls(post.content) : ''),
        [post.content]
    );

    return (
        <View style={{}}>
            {/* Header */}
            <View style={[vm.common.row, { justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 8 }]}>
                <Pressable onPress={vm.handleProfilePress} style={[vm.common.row, { gap: 12, flex: 1 }]}>
                    <View style={{ borderRadius: 9999, overflow: "hidden", width: 40, height: 40 }}>
                        <NitroImage
                            image={{ url: post.profile_avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png" }}
                            style={{ width: 40, height: 40 }}
                            resizeMode="cover"
                        />
                    </View>
                    <View>
                        <View style={[vm.common.row, { gap: 4 }]}>
                            <FlexText style={[vm.common.heading, { fontSize: 16 }]}>{post.profile_name}</FlexText>
                            {post.profile_is_verified && <VerifiedIcon size={14} backgroundColor={vm.colors.verify} />}
                        </View>
                        <PostMetaInfo post={post} />
                    </View>
                </Pressable>
                {!isBookmarked && (
                    <Pressable
                        hitSlop={10}
                        style={{ backgroundColor: vm.colors.card, borderRadius: 999, alignItems: 'center', justifyContent: 'center', width: 40, height: 40 }}
                        onPress={vm.handleOptionsPress}
                    >
                        <Ionicons name="ellipsis-horizontal" size={20} color={vm.colors.text} />
                    </Pressable>
                )}
            </View>

            {/* Caption — YouTube URLs are stripped since they're rendered by YouTubePostPlayer below */}
            {captionWithoutYouTube ? (
                <View style={{ paddingHorizontal: 16 }}>
                    <CaptionText caption={captionWithoutYouTube} colors={vm.colors} common={vm.common} />
                </View>
            ) : null}

            {/* YouTube links detected in the caption — single player or carousel */}
            {post.content ? (
                <YouTubePostPlayer postId={post.id} caption={post.content} />
            ) : null}

            {/* Media & Audio Overlay */}
            <View>
                <PostMediaCarousel
                    media={post.media}
                    postId={post.id}
                    profileName={post.profile_name}
                    content={post.content}
                    colors={vm.colors}
                    isAdult={post.is_adult}
                    isVerified={post.profile_is_verified}
                    musicUrl={post.music?.preview_url}
                    musicTitle={post.music ? `${post.music.artist} - ${post.music.title}` : undefined}
                />

                {/* Video mute/unmute icon — shown when this post is actively playing a video */}
                {vm.hasMedia && isActiveVideoPost && hasVideo && (
                    <Pressable
                        onPress={toggleVideoMute}
                        style={{
                            position: 'absolute',
                            bottom: 24,
                            right: vm.hasMusic ? 56 : 16,
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            padding: 8,
                            borderRadius: 20,
                            zIndex: 20,
                        }}
                    >
                        {isVideoMuted ? <VolumeCrossBold size={18} color="white" /> : <VolumeLoudBold size={18} color="white" />}
                    </Pressable>
                )}

                {/* Music icon */}
                {vm.hasMedia && vm.hasMusic && (
                    <Pressable
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
                        {vm.isPlaying ? <MusicNotesBold size={18} color="white" /> : <MusicNotesOutline size={18} color="white" />}
                    </Pressable>
                )}
            </View>

            {/* Audio Waveform — shown when post has a direct audio_url */}
            {!!post.audio_url && (
                <PostAudioWaveform
                    postId={post.id}
                    audioUrl={post.audio_url}
                    colors={vm.colors}
                    label={post.profile_name}
                />
            )}

            {/* Invisible Spacer for No-Media Posts */}
            {!vm.hasMedia && (
                <View style={{ width: Dimensions.get("window").width, height: 1 }} />
            )}

            {/* Audio Button for No-Media Posts */}
            {!vm.hasMedia && vm.hasMusic && (
                <View style={{ alignItems: 'flex-end', paddingHorizontal: 16, marginBottom: 12 }}>
                    <Pressable
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
                        <FlexText style={[vm.common.label, { fontSize: 12 }]}>
                            {t('post.audioPreview')}
                        </FlexText>
                    </Pressable>
                </View>
            )}

            {/* Links — single link: full-width symmetric view; multiple: horizontal peek scroll */}
            {post.links && post.links.length > 0 && (
                post.links.length === 1 ? (
                    // Single link — equal 16px padding both sides, card fills the gap
                    <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
                        <PostLinkPreview
                            key={post.links[0].url || 0}
                            url={post.links[0].url}
                            label={post.links[0].label}
                            colors={vm.colors}
                            cardWidth={Dimensions.get('window').width - 32}
                        />
                    </View>
                ) : (
                    // Multiple links — peek-through horizontal scroll
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        decelerationRate="fast"
                        snapToOffsets={post.links.map((_, i) => i * (LINK_CARD_WIDTH + 10))}
                        snapToAlignment="start"
                        contentContainerStyle={{
                            paddingHorizontal: 16,
                            paddingBottom: 12,
                            gap: 10,
                        }}
                        style={{ marginBottom: 4 }}
                    >
                        {post.links.map((item: Link, index: number) => (
                            <PostLinkPreview
                                key={item.url || index}
                                url={item.url}
                                label={item.label}
                                colors={vm.colors}
                            />
                        ))}
                    </ScrollView>
                )
            )}

            {post.device && (
                <FlexText
                    style={[
                        vm.common.label,
                        { color: vm.colors.muted, fontSize: 13, marginBottom: 8, paddingHorizontal: 16 },
                    ]}
                >
                    {t('post.createdOnDevice', { device: post.device })}
                </FlexText>
            )}

            {/* Action Bar */}
            {isBookmarked ? (
                // Bookmarks screen: read-only stats, no bookmark button
                <View style={[vm.common.row, { justifyContent: 'flex-start', paddingHorizontal: 16, marginBottom: 16, gap: 20 }]}>
                    <View style={[vm.common.row, { gap: 6, alignItems: 'center' }]}>
                        <Pressable hitSlop={10} onPress={vm.handleLikePress}>
                            {vm.isLiked ? (
                                <LikeSolidIcon size={24} color={vm.colors.text} />
                            ) : (
                                <LikeIcon size={24} color={vm.colors.text} />
                            )}
                        </Pressable>
                        <TouchableOpacity hitSlop={10} onPress={vm.handleLikeCountPress}>
                            <FlexText style={[vm.common.label, { color: vm.colors.text, fontWeight: '800' }]}>{vm.likeCount}</FlexText>
                        </TouchableOpacity>
                    </View>
                    <Pressable hitSlop={10} onPress={vm.handleCommentPress} style={[vm.common.row, { gap: 6, alignItems: 'center' }]}>
                        <CommentIcon size={24} color={vm.colors.text} />
                        <FlexText style={[vm.common.label, { color: vm.colors.text, fontWeight: '800' }]}>{post.comment_count}</FlexText>
                    </Pressable>
                    <Pressable hitSlop={10} onPress={vm.handleBookmarkPress}>
                        {vm.isBookmarked ? (
                            <BookmarkSolidIcon size={24} color={vm.colors.text} />
                        ) : (
                            <BookmarkIcon size={24} color={vm.colors.text} />
                        )}
                    </Pressable>
                </View>
            ) : (
                // Feed: full interactive action bar with bookmark toggle
                <View style={[vm.common.row, { justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 16 }]}>
                    <View style={[vm.common.row, { gap: 20 }]}>
                        <View style={[vm.common.row, { gap: 6, alignItems: 'center' }]}>
                            <Pressable hitSlop={10} onPress={vm.handleLikePress}>
                                {vm.isLiked ? (
                                    <LikeSolidIcon size={24} color={vm.colors.text} />
                                ) : (
                                    <LikeIcon size={24} color={vm.colors.text} />
                                )}
                            </Pressable>
                            <Pressable hitSlop={10} onPress={vm.handleLikeCountPress}>
                                <FlexText style={[vm.common.label, { color: vm.colors.text, fontWeight: '800' }]}>{vm.likeCount}</FlexText>
                            </Pressable>
                        </View>
                        <Pressable hitSlop={10} onPress={vm.handleCommentPress} style={[vm.common.row, { gap: 6, alignItems: 'center' }]}>
                            <CommentIcon size={24} color={vm.colors.text} />
                            <FlexText style={[vm.common.label, { color: vm.colors.text, fontWeight: '800' }]}>{post.comment_count}</FlexText>
                        </Pressable>
                        <Pressable hitSlop={10} style={[vm.common.row, { gap: 6, alignItems: 'center' }]}>
                            <ShareIcon size={24} color={vm.colors.text} />
                            <FlexText style={[vm.common.label, { color: vm.colors.text, fontWeight: '800' }]}>{post.share_count}</FlexText>
                        </Pressable>
                    </View>
                    <Pressable hitSlop={10} onPress={vm.handleBookmarkPress}>
                        {vm.isBookmarked ? (
                            <BookmarkSolidIcon size={24} color={vm.colors.text} />
                        ) : (
                            <BookmarkIcon size={24} color={vm.colors.text} />
                        )}
                    </Pressable>
                </View>
            )}
        </View>
    );
}, (prev, next) => {
    return (
        prev.post.id === next.post.id &&
        prev.post.is_liked === next.post.is_liked &&
        prev.post.like_count === next.post.like_count &&
        prev.post.comment_count === next.post.comment_count &&
        prev.post.is_bookmarked === next.post.is_bookmarked &&
        prev.isBookmarked === next.isBookmarked
    );
});
PostItem.displayName = "PostItem";
