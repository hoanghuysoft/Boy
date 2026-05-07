import { FBPost } from '@/types/localfb';
import { Ionicons } from '@expo/vector-icons';
import { LinkRoundBold, PinBold } from '@solar-icons/react-native';
import { MediaViewer } from 'expo-media-viewer';
import React, { memo, useState } from 'react';
import {
    Dimensions,
    Linking,
    TouchableOpacity,
    View
} from 'react-native';
import { useThemeContext } from '../../context/ThemeContext';
import { createCommonStyles } from '../../styles/common';
import { FlexText } from '../FlexText';
import CachedImage from './CachedImage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHARACTER_THRESHOLD = 150;

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
            <FlexText style={[common.body, { color: colors.text, marginTop: 10, marginBottom: 10, fontSize: 14 }]}>
                {displayText}
                {needsReadMore && (
                    <FlexText
                        onPress={() => setExpanded(!expanded)}
                        style={{ color: colors.verify, fontWeight: '600' }}
                        suppressHighlighting
                    >
                        {expanded ? ' Read less' : ' Read more'}
                    </FlexText>
                )}
            </FlexText>
        </View>
    );
};

const MemoFBCaptionText = memo(FBCaptionText);

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
            <MediaViewer urls={photoUrls} mediaTypes={["image"]}>
                <View style={{ position: 'relative' }}>
                    <MediaViewer.Image index={0}>
                        <CachedImage
                            uri={photoUrls[0]}
                            style={{ width: SCREEN_WIDTH, aspectRatio: 3 / 4 }}
                            resizeMode="cover"
                        />
                    </MediaViewer.Image>
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
            </MediaViewer>
        );
    }

    return (
        <MediaViewer urls={photoUrls} mediaTypes={["image"]}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
                {photoUrls.slice(0, 4).map((url, i) => {
                    const isDoubleWide = photoUrls.length === 2 || (photoUrls.length === 3 && i === 0);
                    const itemWidth = isDoubleWide
                        ? (photoUrls.length === 2 ? (SCREEN_WIDTH - 2) / 2 : SCREEN_WIDTH)
                        : (SCREEN_WIDTH - 2) / 2;
                    const itemHeight = 200;

                    return (
                        <View key={i} style={{ position: 'relative' }}>
                            <MediaViewer.Image index={i}>
                                <CachedImage
                                    uri={url}
                                    style={{ width: itemWidth, height: itemHeight }}
                                    resizeMode="cover"
                                />
                            </MediaViewer.Image>

                            {i === 3 && photoUrls.length > 4 && (
                                <View style={{
                                    position: 'absolute', top: 0, left: 0,
                                    width: itemWidth, height: itemHeight,
                                    backgroundColor: 'rgba(0,0,0,0.5)',
                                    alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <FlexText style={{ color: '#FFF', fontSize: 24, fontWeight: '700' }}>
                                        +{photoUrls.length - 4}
                                    </FlexText>
                                </View>
                            )}

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
        </MediaViewer>
    );
};

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
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 8 }}>
                <TouchableOpacity
                    onPress={() => { if (post.actor.url) Linking.openURL(post.actor.url); }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}
                    activeOpacity={0.8}
                >
                    <CachedImage
                        uri={post.actor.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                        style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.divider }}
                        resizeMode="cover"
                    />
                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <FlexText style={[common.heading, { fontSize: 16 }]}>{post.actor.name}</FlexText>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <FlexText style={[common.label, { color: colors.muted, fontSize: 12 }]}>
                                {formatTimestamp(post.creation_time)}
                            </FlexText>
                            <FlexText style={{ color: colors.muted, fontSize: 12 }}> · </FlexText>
                            <Ionicons name={privacyIcon as any} size={11} color={colors.muted} />
                            {post.is_pinned && (
                                <>
                                    <FlexText style={{ color: colors.muted, fontSize: 12 }}> · </FlexText>
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

            {messageText.length > 0 && (
                <MemoFBCaptionText text={messageText} colors={colors} common={common} />
            )}

            {hasAttachments && (
                <FBMediaGrid attachments={post.content.attachments} />
            )}

            {!hasAttachments && (
                <View style={{ width: SCREEN_WIDTH, height: 1 }} />
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'flex-start', paddingHorizontal: 16, marginTop: 10, marginBottom: 16, gap: 20 }}>
                {post.reactions.total > 0 && (
                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                        <Ionicons name="heart" size={22} color={colors.text} />
                        <FlexText style={[common.label, { color: colors.text, fontWeight: '800' }]}>
                            {post.reactions.total}
                        </FlexText>
                    </View>
                )}
            </View>
        </View>
    );
};

export const MemoFBPostCard = memo(FBPostCard);
export default FBPostCard;
