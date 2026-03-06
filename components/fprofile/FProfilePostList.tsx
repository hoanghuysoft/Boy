import { FBPost, FBPostList } from '@/types/localfb';
import { Ionicons } from '@expo/vector-icons';
import { Galeria } from '@nandorojo/galeria';
import { LinkRoundBold, PinBold } from '@solar-icons/react-native';
import React, { memo, useState } from 'react';
import {
    Dimensions,
    Linking,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useThemeContext } from '../../context/ThemeContext';
import { createCommonStyles } from '../../styles/common';
import CachedImage from './CachedImage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHARACTER_THRESHOLD = 150;

// ─── Caption with Read more / less ──────────────────────────────────────────
const FBCaptionText: React.FC<{ text: string; colors: any; common: any }> = ({
    text,
    colors,
    common,
}) => {
    const [expanded, setExpanded] = useState(false);
    const needsReadMore = text.length > CHARACTER_THRESHOLD;
    const displayText = !expanded && needsReadMore
        ? text.slice(0, CHARACTER_THRESHOLD) + '...'
        : text;

    return (
        <View style={{ paddingHorizontal: 16 }}>
            <Text style={[common.body, { color: colors.text, marginTop: 10, marginBottom: 10, fontSize: 14 }]}>
                {displayText}
                {needsReadMore && (
                    <Text
                        onPress={() => setExpanded(!expanded)}
                        style={{ color: colors.verify, fontWeight: '600' }}
                        suppressHighlighting
                    >
                        {expanded ? ' Read less' : ' Read more'}
                    </Text>
                )}
            </Text>
        </View>
    );
};

const MemoFBCaptionText = memo(FBCaptionText);

// ─── Media Grid (matches PostMediaCarousel photo layout) ─────────────────────
const FBMediaGrid: React.FC<{
    attachments: { id: string; type: string; thumbnail: string }[];
}> = ({ attachments }) => {
    if (!attachments || attachments.length === 0) return null;

    const photoUrls = attachments
        .filter((a) => a.thumbnail)
        .map((a) => a.thumbnail);

    if (photoUrls.length === 0) return null;

    const hasVideo = attachments.some((a) => a.type === 'Video');

    if (photoUrls.length === 1) {
        return (
            <Galeria urls={photoUrls}>
                <View style={{ position: 'relative' }}>
                    <Galeria.Image index={0}>
                        <CachedImage
                            uri={photoUrls[0]}
                            style={{ width: SCREEN_WIDTH, aspectRatio: 3 / 4 }}
                            resizeMode="cover"
                        />
                    </Galeria.Image>
                    {hasVideo && (
                        <View style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            alignItems: 'center', justifyContent: 'center',
                        }}>
                            <View style={{
                                width: 48, height: 48, borderRadius: 24,
                                backgroundColor: 'rgba(0,0,0,0.5)',
                                alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Ionicons name="play" size={24} color="#FFF" style={{ marginLeft: 3 }} />
                            </View>
                        </View>
                    )}
                </View>
            </Galeria>
        );
    }

    // Multiple attachments — 2-column grid
    return (
        <Galeria urls={photoUrls}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
                {photoUrls.slice(0, 4).map((url, i) => {
                    const isDoubleWide = photoUrls.length === 2 || (photoUrls.length === 3 && i === 0);
                    const itemWidth = isDoubleWide
                        ? (photoUrls.length === 2 ? (SCREEN_WIDTH - 2) / 2 : SCREEN_WIDTH)
                        : (SCREEN_WIDTH - 2) / 2;
                    const itemHeight = isDoubleWide && photoUrls.length === 3 && i === 0
                        ? 200
                        : 200;

                    return (
                        <View key={i} style={{ position: 'relative' }}>
                            <Galeria.Image index={i}>
                                <CachedImage
                                    uri={url}
                                    style={{ width: itemWidth, height: itemHeight }}
                                    resizeMode="cover"
                                />
                            </Galeria.Image>

                            {/* +N overlay on last visible image */}
                            {i === 3 && photoUrls.length > 4 && (
                                <View style={{
                                    position: 'absolute', top: 0, left: 0,
                                    width: itemWidth, height: itemHeight,
                                    backgroundColor: 'rgba(0,0,0,0.5)',
                                    alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Text style={{ color: '#FFF', fontSize: 24, fontWeight: '700' }}>
                                        +{photoUrls.length - 4}
                                    </Text>
                                </View>
                            )}

                            {/* Video badge on first video */}
                            {i === 0 && attachments[i]?.type === 'Video' && (
                                <View style={{
                                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                    alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <View style={{
                                        width: 40, height: 40, borderRadius: 20,
                                        backgroundColor: 'rgba(0,0,0,0.5)',
                                        alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <Ionicons name="play" size={20} color="#FFF" style={{ marginLeft: 2 }} />
                                    </View>
                                </View>
                            )}
                        </View>
                    );
                })}
            </View>
        </Galeria>
    );
};

// ─── Single Post Card (mimics PostItem design) ──────────────────────────────
const FBPostCard: React.FC<{
    post: FBPost;
    formatTimestamp: (timestamp: number) => string;
}> = ({ post, formatTimestamp }) => {
    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);

    const messageText = post.message || post.content.text || '';
    const hasAttachments = post.content.attachments.length > 0;

    const privacyIcon =
        post.privacy.scope === 'EVERYONE'
            ? 'globe-outline'
            : post.privacy.scope === 'FRIENDS'
                ? 'people-outline'
                : 'lock-closed-outline';

    return (
        <View style={{ marginBottom: 4 }}>
            {/* Header — matches PostItem header exactly */}
            <View style={[common.row, { justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 8 }]}>
                <TouchableOpacity
                    onPress={() => { if (post.actor.url) Linking.openURL(post.actor.url); }}
                    style={[common.row, { gap: 12, flex: 1 }]}
                    activeOpacity={0.8}
                >
                    <CachedImage
                        uri={post.actor.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                        style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.divider }}
                        resizeMode="cover"
                    />
                    <View>
                        <View style={[common.row, { gap: 4 }]}>
                            <Text style={[common.heading, { fontSize: 16 }]}>{post.actor.name}</Text>
                        </View>
                        <View style={[common.row, { gap: 4 }]}>
                            <Text style={[common.label, { color: colors.muted, fontSize: 12 }]}>
                                {formatTimestamp(post.creation_time)}
                            </Text>
                            <Text style={{ color: colors.muted, fontSize: 12 }}> · </Text>
                            <Ionicons name={privacyIcon as any} size={11} color={colors.muted} />
                            {post.is_pinned && (
                                <>
                                    <Text style={{ color: colors.muted, fontSize: 12 }}> · </Text>
                                    <PinBold size={11} color={colors.muted} />
                                </>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={{
                        backgroundColor: colors.card,
                        borderRadius: 999,
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 40,
                        height: 40,
                    }}
                    onPress={() => { if (post.url) Linking.openURL(post.url); }}
                    activeOpacity={0.7}
                >
                    <LinkRoundBold size={18} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* Caption — matches CaptionText style */}
            {messageText.length > 0 && (
                <MemoFBCaptionText text={messageText} colors={colors} common={common} />
            )}

            {/* Media — matches PostMediaCarousel layout */}
            {hasAttachments && (
                <FBMediaGrid attachments={post.content.attachments} />
            )}

            {/* No-media spacer (matches PostItem) */}
            {!hasAttachments && (
                <View style={{ width: SCREEN_WIDTH, height: 1 }} />
            )}

            {/* Action Bar — matches PostItem action bar */}
            <View style={[common.row, { justifyContent: 'flex-start', paddingHorizontal: 16, marginTop: 10, marginBottom: 16, gap: 20 }]}>
                {/* Reactions */}
                {post.reactions.total > 0 && (
                    <View style={[common.row, { gap: 6, alignItems: 'center' }]}>
                        <Ionicons name="heart" size={22} color={colors.text} />
                        <Text style={[common.label, { color: colors.text, fontWeight: '800' }]}>
                            {post.reactions.total}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
};

export const MemoFBPostCard = memo(FBPostCard);

// ─── Post List ──────────────────────────────────────────────────────────────────
interface FProfilePostListProps {
    posts: FBPostList | null;
    fbColors: any;
    formatTimestamp: (timestamp: number) => string;
}

const FProfilePostList: React.FC<FProfilePostListProps> = ({
    posts,
    fbColors,
    formatTimestamp,
}) => {
    const { colors } = useThemeContext();

    if (!posts || posts.length === 0) {
        return (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Text style={{ fontSize: 15, color: fbColors.secondaryText }}>
                    No posts available
                </Text>
            </View>
        );
    }

    return (
        <View style={{ marginTop: 8 }}>
            {/* {posts.map((post) => (
                <FBPostCard
                    key={post.id}
                    post={post}
                    formatTimestamp={formatTimestamp}
                />
            ))} */}
            {posts.map((post) => (
                <MemoFBPostCard
                    key={post.id}
                    post={post}
                    formatTimestamp={formatTimestamp}
                />
            ))}
        </View>
    );
};

export default memo(FProfilePostList);
