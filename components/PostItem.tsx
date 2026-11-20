import MusicIcon from "@/assets/images/svg/music-2.svg";
import { resolveBlurhash } from "@/components/gallery/fallbackBlurhash";
import BookmarkIcon from "@/icons/bookmark";
import BookmarkSolidIcon from "@/icons/bookmarksolid";
import CommentIcon from "@/icons/comment";
import LikeIcon from "@/icons/like";
import LikeSolidIcon from "@/icons/likedsolid";
import ShareIcon from "@/icons/share";
import VerifiedIcon from "@/icons/verified";
import { checkPostDownloadStatus, useDownloadedMediaStore } from "@/services/downloadedMediaDatabase";
import { Link, Media, Post } from "@/types/post";
import { stripYouTubeUrls } from "@/utils/youtube";
import { guessLanguageAsync } from "@bsky.app/expo-guess-language";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { SquircleView } from "expo-squircle-view";
import { Button } from "heroui-native/button";
import { Dialog } from "heroui-native/dialog";
import { Spinner } from "panelui-native";
import React, { useCallback, useEffect, useState } from "react";
import { Dimensions, Easing, Pressable, StyleSheet, TouchableOpacity, View } from "react-native";
import { easeGradient } from "react-native-easing-gradient";
import { ScrollView } from 'react-native-gesture-handler';
import i18n, { LANGUAGE_LABELS, SupportedLanguage } from "../i18n";
import { useLanguageStore } from "../stores/language";
import { useTranslationStore } from "../stores/translation";
import { usePostItemViewModel } from "../viewmodels/PostItemViewModel";
import { AbbreviatedSlidingNumber } from "./AbbreviatedSlidingNumber";
import CaptionText from "./CaptionText";
import { FlexText } from "./FlexText";
import { PostAudioWaveform } from "./PostAudioWaveform";
import { LINK_CARD_WIDTH, PostLinkPreview } from "./PostLinkPreview";
import { MEDIA_BORDER_RADIUS, PostMediaCarousel } from "./PostMediaCarousel";
import { PostMetaInfo } from "./PostMetaInfo";
import { YouTubePostPlayer } from "./YouTubePostPlayer";

const videoHeaderScrim = easeGradient({
    colorStops: {
        0: { color: 'rgba(0, 0, 0, 0.68)' },
        0.55: { color: 'rgba(0, 0, 0, 0.30)', easing: Easing.out(Easing.cubic) },
        1: { color: 'rgba(0, 0, 0, 0)' },
    },
    extraColorStopsPerTransition: 6,
});

const languageDetectionCache = new Map<string, boolean>();

export interface PostItemProps {
    post: Post;
    onOptionsPress?: (post: Post) => void;
    onLikeCountPress?: (post: Post) => void;
    onCommentPress?: (post: Post) => void;
    onCrossPostPress?: (post: Post) => void;
    onCaptionPress?: (post: Post) => void;
    isBookmarked?: boolean;
    metricsOnly?: boolean;
    isDetail?: boolean;
}

const SavedPostBadge = React.memo(({ post, borderColor }: { post: Post; borderColor: string }) => {
    const isExternalPost = React.useMemo(() => {
        return (
            post.device === 'X for Mobile' ||
            post.device?.includes('Twitter') ||
            post.device?.includes('fxtwitter')
        );
    }, [post.device]);

    const downloadVersion = useDownloadedMediaStore((s) => s.version);
    const isFullySaved = React.useMemo(() => {
        if (!isExternalPost || !post.media || post.media.length === 0) return false;
        return checkPostDownloadStatus(post).isFullyDownloaded;
    }, [post, isExternalPost, downloadVersion]);

    if (!isFullySaved) return null;

    return (
        <View
            style={{
                position: 'absolute',
                top: -1,
                right: -1,
                backgroundColor: '#10B981',
                borderRadius: 999,
                width: 14,
                height: 14,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1.5,
                borderColor: borderColor,
            }}
        >
            <Ionicons name="checkmark" size={9} color="#FFFFFF" />
        </View>
    );
});
SavedPostBadge.displayName = "SavedPostBadge";

export const PostItem = React.memo(({ post, onOptionsPress, onLikeCountPress, onCommentPress, onCrossPostPress, onCaptionPress, isBookmarked = false, metricsOnly = false, isDetail = false }: PostItemProps) => {
    const screenWidth = Dimensions.get('window').width;
    const t = i18n.t.bind(i18n);
    const translationLanguage = useLanguageStore(s => s.translationLanguage);
    const translation = useTranslationStore(s => s.translations[post.id]);
    const translate = useTranslationStore(s => s.translate);
    const clearTranslation = useTranslationStore(s => s.clearTranslation);
    const setActivePost = useTranslationStore(s => s.setActivePost);

    const handlePostPress = useCallback(() => {
        if (isDetail) return;
        if (onCaptionPress) {
            onCaptionPress(post);
        } else {
            router.push({
                pathname: '/post/[id]',
                params: { id: post.id },
            });
        }
    }, [isDetail, onCaptionPress, post]);

    // If server provides post.lang, check translation need synchronously without async promises
    const hasServerLang = post.lang !== undefined;
    const cacheKey = `${post.id}:${translationLanguage}`;
    const [clientNeedsTranslation, setClientNeedsTranslation] = useState(() => {
        if (hasServerLang || !post.content) return false;
        return languageDetectionCache.get(cacheKey) || false;
    });
    const needsTranslation = hasServerLang
        ? Boolean(post.content && post.lang && post.lang.split('-')[0] !== translationLanguage.split('-')[0])
        : clientNeedsTranslation;

    useEffect(() => {
        if (hasServerLang || !post.content) {
            return;
        }

        // Return cached result if we've already detected language for this post content
        if (languageDetectionCache.has(cacheKey)) {
            const cached = languageDetectionCache.get(cacheKey) || false;
            setClientNeedsTranslation(prev => prev !== cached ? cached : prev);
            return;
        }

        guessLanguageAsync(post.content).then((guessed: any) => {
            const detected = guessed?.[0]?.language;
            const needs = !!(detected && detected.split('-')[0] !== translationLanguage.split('-')[0]);
            languageDetectionCache.set(cacheKey, needs);
            setClientNeedsTranslation(prev => prev !== needs ? needs : prev);
        }).catch(() => { });
    }, [hasServerLang, cacheKey, post.content, translationLanguage]);

    const isRepost = !!post.reposted_post;
    const originalPost = post.reposted_post;
    const isRepostDeleted = isRepost && originalPost.deleted;

    // Use server pre-merged display assets if available; otherwise merge client-side
    const displayPost = React.useMemo(() => {
        if (post.display_media !== undefined) {
            return {
                ...post,
                media: post.display_media,
                music: post.display_music ?? post.music,
                links: post.display_links ?? post.links,
                audio_url: post.display_audio_url ?? post.audio_url,
                device: post.display_device ?? post.device,
            };
        }
        if (isRepost && !isRepostDeleted) {
            return {
                ...post,
                media: originalPost.media,
                music: originalPost.music,
                links: originalPost.links,
                audio_url: originalPost.audio_url,
                device: originalPost.device,
            };
        }
        return post;
    }, [post, isRepost, isRepostDeleted, originalPost]);

    const vm = usePostItemViewModel({ post: displayPost, onOptionsPress, onLikeCountPress, onCommentPress });

    // Feed video state - prefer server has_video flag over array scan
    const hasVideo = post.has_video !== undefined
        ? post.has_video
        : !!displayPost.media?.some((m: Media) => m.type === 'video');

    // Caption without any YouTube URLs — prefer server pre-cleaned content over regex
    const captionWithoutYouTube = React.useMemo(
        () => post.clean_content ?? (post.content ? stripYouTubeUrls(post.content) : ''),
        [post.clean_content, post.content]
    );



    const originalAvatarPlaceholder = React.useMemo(
        () => resolveBlurhash(undefined, originalPost?.profile_id),
        [originalPost?.profile_id]
    );

    const isSingleVideo =
        displayPost.media?.length === 1 &&
        displayPost.media[0]?.type === 'video';

    const hasCaptionContent = Boolean(
        isRepost ||
        captionWithoutYouTube ||
        (needsTranslation && !translation) ||
        translation
    );

    const renderHeaderRow = (overlaid: boolean) => (
        <View
            pointerEvents={overlaid ? 'box-none' : 'auto'}
            style={[
                vm.common.row,
                {
                    justifyContent: 'space-between',
                    paddingHorizontal: 16,
                    ...(overlaid
                        ? { paddingTop: 14, paddingBottom: 22 }
                        : { marginBottom: 8 }),
                },
            ]}
        >
            <Pressable
                onPress={vm.handleProfilePress}
                disabled={metricsOnly}
                style={({ pressed }) => [vm.common.row, { gap: 12, flex: 1, opacity: pressed ? 0.7 : 1 }]}
            >
                <ExpoImage
                    source={{ uri: post.profile_avatar }}
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        ...(overlaid ? { borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' } : {}),
                    }}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                />
                <View>
                    <View style={[vm.common.row, { gap: 4 }]}>
                        <FlexText
                            style={[
                                vm.common.heading,
                                { fontSize: 16 },
                                overlaid && {
                                    color: '#FFFFFF',
                                    textShadowColor: 'rgba(0,0,0,0.45)',
                                    textShadowOffset: { width: 0, height: 1 },
                                    textShadowRadius: 3,
                                },
                            ]}
                        >
                            {post.profile_name}
                        </FlexText>
                        {post.profile_is_verified && <VerifiedIcon size={16} />}
                    </View>
                    <PostMetaInfo
                        post={post}
                        textColor={overlaid ? 'rgba(255,255,255,0.82)' : undefined}
                    />
                </View>
            </Pressable>
            {!isBookmarked && !isDetail && (!metricsOnly || !!onOptionsPress) && (
                <Pressable
                    hitSlop={10}
                    style={({ pressed }) => ({
                        backgroundColor: overlaid ? 'rgba(0,0,0,0.42)' : vm.colors.surfaceContainerHigh,
                        borderRadius: 999,
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 40,
                        height: 40,
                        opacity: pressed ? 0.7 : 1,
                    })}
                    onPress={vm.handleOptionsPress}
                >
                    <Ionicons
                        name="ellipsis-horizontal"
                        size={20}
                        color={overlaid ? '#FFFFFF' : vm.colors.onSurface}
                    />
                    <SavedPostBadge
                        post={displayPost}
                        borderColor={overlaid ? 'rgba(0,0,0,0.6)' : vm.colors.surface}
                    />
                </Pressable>
            )}
        </View>
    );

    const renderOverlaidHeader = () => (
        <View
            pointerEvents="box-none"
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                borderTopLeftRadius: MEDIA_BORDER_RADIUS,
                borderTopRightRadius: MEDIA_BORDER_RADIUS,
                overflow: 'hidden',
                zIndex: 20,
            }}
        >
            <LinearGradient
                pointerEvents="none"
                colors={videoHeaderScrim.colors as [string, string, ...string[]]}
                locations={videoHeaderScrim.locations as [number, number, ...number[]]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            {renderHeaderRow(true)}
        </View>
    );

    const renderCaptionsBlock = (belowVideo: boolean) => (
        <Pressable
            onPress={isDetail ? undefined : handlePostPress}
            disabled={isDetail}
            style={{
                paddingHorizontal: 16,
                ...(belowVideo ? { marginTop: -4, marginBottom: 12 } : { marginBottom: 8 }),
            }}
        >
            {isRepost ? (
                isRepostDeleted ? (
                    <View style={{ gap: 8 }}>
                        {!!captionWithoutYouTube && (
                            <CaptionText maxLines={isDetail ? undefined : 3} caption={captionWithoutYouTube} captionParts={post.caption_parts} colors={vm.colors} common={vm.common} />)}
                        <View style={[vm.common.row, {
                            borderLeftWidth: 3,
                            borderLeftColor: vm.colors.error,
                            paddingLeft: 12,
                            paddingVertical: 4,
                            gap: 8,
                            alignItems: 'center'
                        }]}>
                            <Ionicons name="alert-circle-outline" size={16} color={vm.colors.onSurfaceVariant} />
                            <FlexText lite={false} style={[vm.common.bodySmall, { color: vm.colors.onSurfaceVariant, fontStyle: 'italic' }]}>
                                {originalPost.text || t('post.dialogs.repostFailed')}
                            </FlexText>
                        </View>
                    </View>
                ) : (
                    <View style={{ gap: 8 }}>
                        {/* Reposter's quote caption (if it exists) */}
                        {!!captionWithoutYouTube && (
                            <CaptionText maxLines={isDetail ? undefined : 3} caption={captionWithoutYouTube} captionParts={post.caption_parts} colors={vm.colors} common={vm.common} />
                        )}

                        {/* Quoted Original Post with author info right under it */}
                        <View style={{
                            borderLeftWidth: 3,
                            borderLeftColor: vm.colors.primary,
                            paddingLeft: 12,
                            paddingVertical: 2,
                        }}>
                            {!!originalPost.content && (
                                <CaptionText
                                    maxLines={isDetail ? undefined : 4}
                                    caption={originalPost.clean_content || originalPost.content}
                                    captionParts={originalPost.caption_parts}
                                    colors={vm.colors}
                                    common={vm.common}
                                />
                            )}
                            <TouchableOpacity
                                onPress={() => {
                                    router.push({
                                        pathname: '/profile/[id]',
                                        params: { id: originalPost.profile_id },
                                    });
                                }}
                                style={[vm.common.row, { gap: 6, alignItems: 'center', marginTop: 4 }]}
                            >
                                <ExpoImage
                                    source={{ uri: originalPost.profile_avatar }}
                                    style={{ width: 18, height: 18, borderRadius: 9999 }}
                                    contentFit="cover"
                                    placeholder={{ blurhash: originalAvatarPlaceholder }}
                                />
                                <FlexText lite={false} style={[vm.common.label, { color: vm.colors.onSurfaceVariant, fontSize: 11, fontWeight: '600' }]}>
                                    Reposted from {originalPost.profile_name}
                                </FlexText>
                            </TouchableOpacity>
                        </View>
                    </View>
                )
            ) : (
                captionWithoutYouTube ? (
                    <CaptionText maxLines={isDetail ? undefined : 3} caption={captionWithoutYouTube} captionParts={post.caption_parts} colors={vm.colors} common={vm.common} />
                ) : null
            )}

            {/* Translation Link / Translation Results */}
            {needsTranslation && !translation && (
                <TouchableOpacity
                    onPress={() => translate(post.id, post.content, translationLanguage)}
                    style={{ marginTop: 4, alignSelf: 'flex-start' }}
                >
                    <FlexText style={[vm.common.bodySmall, { color: vm.colors.primary, fontWeight: '600' }]}>
                        {t('post.translate', 'Translate')}
                    </FlexText>
                </TouchableOpacity>
            )}

            {translation && (
                <View style={{ marginTop: 8 }}>
                    {translation.isTranslating && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}>
                            <Spinner size="sm" color={vm.colors.primary} />
                            <FlexText style={[vm.common.bodySmall, { color: vm.colors.muted }]}>
                                {t('post.translating', 'Translating...')}
                            </FlexText>
                        </View>
                    )}

                    {translation.translatedText && !translation.isTranslating && (
                        <SquircleView cornerSmoothing={100} preserveSmoothing style={{
                            padding: 12,
                            marginTop: 6,
                            borderWidth: 1,
                            borderColor: vm.colors.outlineVariant,
                            borderRadius: 16,
                            gap: 6,
                            position: 'relative',
                        }}>
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                paddingRight: 24, // Leave space for close button
                            }}>
                                {translation.detectedLanguage ? (
                                    <>
                                        <FlexText style={[vm.common.label, { color: vm.colors.onSurfaceVariant, fontSize: 11 }]}>
                                            {LANGUAGE_LABELS[translation.detectedLanguage as SupportedLanguage] || translation.detectedLanguage.toUpperCase()}
                                        </FlexText>
                                        <Ionicons name="arrow-forward" size={10} color={vm.colors.onSurfaceVariant} style={{ marginHorizontal: 4 }} />
                                        <FlexText style={[vm.common.label, { color: vm.colors.onSurfaceVariant, fontSize: 11 }]}>
                                            {LANGUAGE_LABELS[translation.targetLanguage as SupportedLanguage] || translation.targetLanguage.toUpperCase()}
                                        </FlexText>
                                    </>
                                ) : (
                                    <FlexText style={[vm.common.label, { color: vm.colors.onSurfaceVariant, fontSize: 11 }]}>
                                        {t('post.translated', 'Translated')}
                                    </FlexText>
                                )}

                                <FlexText style={{ color: vm.colors.onSurfaceVariant, fontSize: 11, marginHorizontal: 4 }}>
                                    &middot;
                                </FlexText>

                                <TouchableOpacity onPress={() => {
                                    setActivePost(post.id, post.content);
                                    TrueSheet.present('translation-language-sheet');
                                }}>
                                    <FlexText style={[vm.common.label, { color: vm.colors.primary, fontSize: 11, fontWeight: '600' }]}>
                                        {t('post.changeLanguage', 'Change')}
                                    </FlexText>
                                </TouchableOpacity>
                            </View>
                            <FlexText lite={false} selectable style={[vm.common.body, { fontSize: 14, color: vm.colors.onSurface, marginTop: 2 }]}>
                                {translation.translatedText}
                            </FlexText>
                            <TouchableOpacity
                                onPress={() => clearTranslation(post.id)}
                                style={{
                                    position: 'absolute',
                                    top: 10,
                                    right: 10,
                                    padding: 4,
                                }}
                            >
                                <Ionicons name="close" size={16} color={vm.colors.onSurfaceVariant} />
                            </TouchableOpacity>
                        </SquircleView>
                    )}

                    {translation.translationError && !translation.isTranslating && (
                        <View style={{
                            padding: 10,
                            backgroundColor: vm.colors.errorContainer,
                            borderRadius: 12,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                        }}>
                            <Ionicons name="alert-circle" size={16} color={vm.colors.onErrorContainer} />
                            <FlexText style={[vm.common.bodySmall, { color: vm.colors.onErrorContainer, flex: 1, fontSize: 12 }]}>
                                {translation.translationError}
                            </FlexText>
                            <TouchableOpacity onPress={() => clearTranslation(post.id)}>
                                <Ionicons name="close" size={14} color={vm.colors.onErrorContainer} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}
        </Pressable>
    );

    const renderYouTubePlayer = () => {
        if (isRepost && !isRepostDeleted && originalPost.content) {
            return (
                <YouTubePostPlayer
                    postId={originalPost.id}
                    caption={originalPost.content}
                    videoIds={originalPost.youtube_ids}
                />
            );
        }
        if (post.content) {
            return (
                <YouTubePostPlayer
                    postId={post.id}
                    caption={post.content}
                    videoIds={post.youtube_ids}
                />
            );
        }
        return null;
    };

    return (
        <View style={{}}>
            {/* Standard Header & Captions (non-single-video posts) */}
            {!isSingleVideo && renderHeaderRow(false)}
            {!isSingleVideo && renderCaptionsBlock(false)}
            {!isSingleVideo && renderYouTubePlayer()}

            {/* Media & Audio Overlay */}
            <View>
                <PostMediaCarousel
                    media={displayPost.media}
                    postId={post.id}
                    profileName={displayPost.profile_name}
                    content={displayPost.content}
                    colors={vm.colors}
                    isAdult={displayPost.is_adult}
                    isVerified={displayPost.profile_is_verified}
                    musicUrl={displayPost.music?.preview_url}
                    musicTitle={displayPost.music ? `${displayPost.music.artist} - ${displayPost.music.title}` : undefined}
                />

                {isSingleVideo && renderOverlaidHeader()}

                {/* Music icon */}
                {vm.hasMedia && vm.hasMusic && (
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={vm.toggleMusic}
                        style={{
                            position: 'absolute',
                            bottom: 24,
                            right: hasVideo ? 56 : 16,
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            padding: 8,
                            borderRadius: 20,
                            zIndex: 20
                        }}
                    >
                        {vm.isPlaying ? (
                            <MusicIcon width={18} height={18} color="white" fill="white" />
                        ) : (
                            <MusicIcon width={18} height={18} color="white" fill="none" />
                        )}
                    </TouchableOpacity>
                )}
            </View>

            {/* Captions & YouTube Player below single-video card */}
            {isSingleVideo && hasCaptionContent && renderCaptionsBlock(true)}
            {isSingleVideo && renderYouTubePlayer()}

            {/* Audio Waveform — shown when post has a direct audio_url */}
            {!!displayPost.audio_url && (
                <PostAudioWaveform
                    postId={post.id}
                    audioUrl={displayPost.audio_url}
                    colors={vm.colors}
                    label={displayPost.profile_name}
                />
            )}

            {/* Invisible Spacer for No-Media Posts */}
            {!vm.hasMedia && (
                <View style={{ width: screenWidth, height: 1 }} />
            )}

            {/* Audio Button for No-Media Posts */}
            {!vm.hasMedia && vm.hasMusic && (
                <View style={{ alignItems: 'flex-end', paddingHorizontal: 16, marginBottom: 12 }}>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={vm.toggleMusic}
                        style={{
                            backgroundColor: vm.colors.surfaceContainerHigh,
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 20,
                            borderWidth: 1,
                            borderColor: vm.colors.outlineVariant,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6
                        }}
                    >
                        <Ionicons name={vm.isPlaying ? "volume-high" : "volume-mute"} size={16} color={vm.colors.onSurface} />
                        <FlexText style={[vm.common.label, { fontSize: 12 }]}>
                            {t('post.audioPreview')}
                        </FlexText>
                    </TouchableOpacity>
                </View>
            )}

            {/* Links — single link: full-width symmetric view; multiple: horizontal peek scroll */}
            {displayPost.links && displayPost.links.length > 0 && (
                displayPost.links.length === 1 ? (
                    // Single link — equal 16px padding both sides, card fills the gap
                    (<View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
                        <PostLinkPreview
                            key={displayPost.links[0].url || 0}
                            url={displayPost.links[0].url}
                            label={displayPost.links[0].label}
                            colors={vm.colors}
                            cardWidth={screenWidth - 32}
                        />
                    </View>)
                ) : (
                    // Multiple links — peek-through horizontal scroll
                    (<ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        decelerationRate="fast"
                        snapToOffsets={displayPost.links.map((_: Link, i: number) => i * (LINK_CARD_WIDTH + 10))}
                        snapToAlignment="start"
                        contentContainerStyle={{
                            paddingHorizontal: 16,
                            paddingBottom: 12,
                            gap: 10,
                        }}
                        style={{ marginBottom: 4 }}
                    >
                        {displayPost.links.map((item: Link, index: number) => (
                            <PostLinkPreview
                                key={item.url || index}
                                url={item.url}
                                label={item.label}
                                colors={vm.colors}
                            />
                        ))}
                    </ScrollView>)
                )
            )}

            {displayPost.device && (
                <Pressable
                    onPress={isDetail ? undefined : handlePostPress}
                    disabled={isDetail}
                >
                    <FlexText
                        style={[
                            vm.common.label,
                            { color: vm.colors.onSurfaceVariant, fontSize: 13, marginBottom: 8, paddingHorizontal: 16 },
                        ]}
                    >
                        {t('post.createdOnDevice', { device: displayPost.device })}
                    </FlexText>
                </Pressable>
            )}

            {/* Action Bar */}
            {metricsOnly ? (
                // Metrics-only mode with interactive Share button for Cross-posting
                <View style={[vm.common.row, { justifyContent: 'flex-start', paddingHorizontal: 16, marginBottom: 16, gap: 24 }]}>
                    <View style={[vm.common.row, { gap: 6, alignItems: 'center' }]}>
                        <LikeIcon size={22} color={vm.colors.onSurfaceVariant} />
                        <FlexText style={[vm.common.label, { color: vm.colors.onSurface, fontWeight: '700' }]}>{post.like_count || 0}</FlexText>
                    </View>
                    <View style={[vm.common.row, { gap: 6, alignItems: 'center' }]}>
                        <CommentIcon size={22} color={vm.colors.onSurfaceVariant} />
                        <FlexText style={[vm.common.label, { color: vm.colors.onSurface, fontWeight: '700' }]}>{post.comment_count || 0}</FlexText>
                    </View>
                    {onCrossPostPress ? (
                        <TouchableOpacity
                            hitSlop={10}
                            activeOpacity={0.7}
                            onPress={() => onCrossPostPress(post)}
                            style={[vm.common.row, { gap: 6, alignItems: 'center' }]}
                        >
                            <ShareIcon size={22} color={vm.colors.onSurface} />
                            <FlexText style={[vm.common.label, { color: vm.colors.onSurface, fontWeight: '700' }]}>{post.share_count || 0}</FlexText>
                        </TouchableOpacity>
                    ) : (
                        <View style={[vm.common.row, { gap: 6, alignItems: 'center' }]}>
                            <ShareIcon size={22} color={vm.colors.onSurfaceVariant} />
                            <FlexText style={[vm.common.label, { color: vm.colors.onSurface, fontWeight: '700' }]}>{post.share_count || 0}</FlexText>
                        </View>
                    )}
                    {post.view_count > 0 && (
                        <View style={[vm.common.row, { gap: 6, alignItems: 'center' }]}>
                            <Ionicons name="bar-chart-outline" size={18} color={vm.colors.onSurfaceVariant} />
                            <FlexText style={[vm.common.label, { color: vm.colors.onSurface, fontWeight: '700' }]}>{post.view_count}</FlexText>
                        </View>
                    )}
                </View>
            ) : isBookmarked ? (
                // Bookmarks screen: read-only stats, no bookmark button
                (<View style={[vm.common.row, { justifyContent: 'flex-start', paddingHorizontal: 16, marginBottom: 16, gap: 20 }]}>
                    <View style={[vm.common.row, { gap: 6, alignItems: 'center' }]}>
                        <Pressable hitSlop={10} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })} onPress={vm.handleLikePress}>
                            {vm.isLiked ? (
                                <LikeSolidIcon size={24} color={vm.colors.onSurface} />
                            ) : (
                                <LikeIcon size={24} color={vm.colors.onSurface} />
                            )}
                        </Pressable>
                        <Pressable hitSlop={10} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })} onPress={vm.handleLikeCountPress}>
                            <AbbreviatedSlidingNumber value={vm.likeCount} digits={1} size={18} weight="bold" color={vm.colors.onSurface} />
                        </Pressable>
                    </View>
                    <Pressable hitSlop={10} style={({ pressed }) => [vm.common.row, { gap: 6, alignItems: 'center', opacity: pressed ? 0.7 : 1 }]} onPress={vm.handleCommentPress}>
                        <CommentIcon size={24} color={vm.colors.onSurface} />
                        <AbbreviatedSlidingNumber value={post.comment_count} digits={1} size={18} weight="bold" color={vm.colors.onSurface} />
                    </Pressable>
                    <Pressable hitSlop={10} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })} onPress={vm.handleBookmarkPress}>
                        {vm.isBookmarked ? (
                            <BookmarkSolidIcon size={24} color={vm.colors.onSurface} />
                        ) : (
                            <BookmarkIcon size={24} color={vm.colors.onSurface} />
                        )}
                    </Pressable>
                </View>)
            ) : (
                // Feed: full interactive action bar with bookmark toggle
                (<View style={[vm.common.row, { justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 16 }]}>
                    <View style={[vm.common.row, { gap: 20 }]}>
                        <View style={[vm.common.row, { gap: 6, alignItems: 'center' }]}>
                            <Pressable hitSlop={10} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })} onPress={vm.handleLikePress}>
                                {vm.isLiked ? (
                                    <LikeSolidIcon size={24} color={vm.colors.onSurface} />
                                ) : (
                                    <LikeIcon size={24} color={vm.colors.onSurface} />
                                )}
                            </Pressable>
                            <Pressable hitSlop={10} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })} onPress={vm.handleLikeCountPress}>
                                <AbbreviatedSlidingNumber value={vm.likeCount} digits={1} size={18} weight="bold" color={vm.colors.onSurface} />
                            </Pressable>
                        </View>
                        <Pressable hitSlop={10} style={({ pressed }) => [vm.common.row, { gap: 6, alignItems: 'center', opacity: pressed ? 0.7 : 1 }]} onPress={vm.handleCommentPress}>
                            <CommentIcon size={24} color={vm.colors.onSurface} />
                            <AbbreviatedSlidingNumber value={post.comment_count} digits={1} size={18} weight="bold" color={vm.colors.onSurface} />
                        </Pressable>
                        {!isRepost && (
                            <Pressable hitSlop={10} style={({ pressed }) => [vm.common.row, { gap: 6, alignItems: 'center', opacity: pressed ? 0.7 : 1 }]} onPress={vm.handleSharePress}>
                                <ShareIcon size={24} color={vm.colors.onSurface} />
                                <AbbreviatedSlidingNumber value={post.share_count} digits={1} size={18} weight="bold" color={vm.colors.onSurface} />
                            </Pressable>
                        )}
                    </View>
                    <Pressable hitSlop={10} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })} onPress={vm.handleBookmarkPress}>
                        {vm.isBookmarked ? (
                            <BookmarkSolidIcon size={24} color={vm.colors.onSurface} />
                        ) : (
                            <BookmarkIcon size={24} color={vm.colors.onSurface} />
                        )}
                    </Pressable>
                </View>)
            )}

            {vm.dialog !== null && (
                <Dialog isOpen={true} onOpenChange={(open) => !open && vm.closeDialog()}>
                    <Dialog.Portal>
                        <Dialog.Overlay />
                        <Dialog.Content>
                            <Dialog.Close />
                            <View style={{ marginBottom: 20, gap: 6 }}>
                                <Dialog.Title>{vm.dialog?.title}</Dialog.Title>
                                <Dialog.Description>{vm.dialog?.text}</Dialog.Description>
                            </View>
                            {vm.dialog?.buttons ? (
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    {vm.dialog.buttons.map((btn, idx) => (
                                        <Button
                                            key={idx}
                                            variant={btn.variant ?? "primary"}
                                            onPress={btn.onPress}
                                            style={{ flex: 1 }}
                                        >
                                            {btn.text}
                                        </Button>
                                    ))}
                                </View>
                            ) : (
                                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                                    {vm.dialog?.dismissText && (
                                        <Button variant="ghost" onPress={vm.closeDialog}>
                                            {vm.dialog.dismissText}
                                        </Button>
                                    )}
                                    <Button
                                        variant={vm.dialog?.isDestructive || vm.dialog?.onConfirm ? "danger" : "primary"}
                                        onPress={() => vm.dialog?.onConfirm ? vm.dialog.onConfirm() : vm.closeDialog()}
                                    >
                                        {vm.dialog?.confirmText ?? t('post.dialogs.ok')}
                                    </Button>
                                </View>
                            )}
                        </Dialog.Content>
                    </Dialog.Portal>
                </Dialog>
            )}
        </View>
    );
}, (prev, next) => {
    const prevRepost = prev.post.reposted_post;
    const nextRepost = next.post.reposted_post;

    const isRepostEqual = prevRepost === nextRepost || (
        !!prevRepost && !!nextRepost &&
        prevRepost.id === nextRepost.id &&
        prevRepost.deleted === nextRepost.deleted &&
        prevRepost.content === nextRepost.content &&
        prevRepost.text === nextRepost.text &&
        prevRepost.profile_id === nextRepost.profile_id &&
        prevRepost.profile_name === nextRepost.profile_name &&
        prevRepost.profile_avatar === nextRepost.profile_avatar &&
        prevRepost.audio_url === nextRepost.audio_url &&
        prevRepost.device === nextRepost.device &&
        prevRepost.media?.length === nextRepost.media?.length &&
        prevRepost.links?.length === nextRepost.links?.length &&
        prevRepost.music?.preview_url === nextRepost.music?.preview_url
    );

    return (
        prev.post.id === next.post.id &&
        prev.post.is_liked === next.post.is_liked &&
        prev.post.like_count === next.post.like_count &&
        prev.post.comment_count === next.post.comment_count &&
        prev.post.share_count === next.post.share_count &&
        prev.post.is_bookmarked === next.post.is_bookmarked &&
        prev.isBookmarked === next.isBookmarked &&
        prev.isDetail === next.isDetail &&
        isRepostEqual
    );
});
PostItem.displayName = "PostItem";