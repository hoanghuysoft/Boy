import FastImage from '@d11/react-native-fast-image';
import { Ionicons } from '@expo/vector-icons';
import { LinkPreview } from '@flyerhq/react-native-link-preview';
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import React, { forwardRef, memo } from "react";
import { FlatList, Linking, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from "../../../context/ThemeContext";
import { createCommonStyles } from "../../../styles/common";
import { ProfileLink } from '../../../types/profilelink';

interface SocialSheetProps {
    data: ProfileLink[];
}


const getPlatformDetails = (platform: string, url: string, theme: 'light' | 'dark') => {
    const p = platform?.toLowerCase() || '';

    // Default fallback
    let icon = 'link-outline';
    let color = theme === 'dark' ? '#ffffff' : '#000000';

    if (p.includes('twitter') || p.includes('x')) {
        icon = p.includes('x') ? 'logo-x' : 'logo-twitter';
        color = '#1DA1F2';
    } else if (p.includes('facebook')) {
        icon = 'logo-facebook';
        color = '#1877F2';
    } else if (p.includes('instagram')) {
        icon = 'logo-instagram';
        color = '#E4405F';
    } else if (p.includes('linkedin')) {
        icon = 'logo-linkedin';
        color = '#0A66C2';
    } else if (p.includes('github')) {
        icon = 'logo-github';
        color = theme === 'dark' ? '#ffffff' : '#181717';
    } else if (p.includes('youtube')) {
        icon = 'logo-youtube';
        color = '#FF0000';
    } else if (p.includes('tiktok')) {
        icon = 'logo-tiktok';
        color = theme === 'dark' ? '#ffffff' : '#000000';
    } else if (p.includes('whatsapp')) {
        icon = 'logo-whatsapp';
        color = '#25D366';
    }

    return { icon, color };
};

const FormattedLink = ({ url, username, common }: { url: string, username?: string, common: any }) => {
    let display = username || url;

    if (!username && url) {
        try {
            const urlObj = new URL(url);
            if (urlObj.pathname.length > 1 && !urlObj.pathname.includes('/p/')) { // exclude instagram posts
                const segment = urlObj.pathname.split('/').filter(Boolean).pop() || '';
                display = segment.startsWith('@') ? segment : '@' + segment;
            } else {
                display = urlObj.hostname + (urlObj.pathname.length > 1 ? urlObj.pathname : '');
            }
        } catch (e) {
            display = url;
        }
    } else if (username && !username.startsWith('@')) {
        display = '@' + username;
    }

    return (
        <Text style={[common.bodySmall, { opacity: 0.7 }]} numberOfLines={1}>
            {display}
        </Text>
    );
}


const SocialLinkItem = memo(({ item, colors, common, theme }: { item: ProfileLink, colors: any, common: any, theme: 'light' | 'dark' }) => {
    const { icon, color } = getPlatformDetails(item.platform, item.url, theme);
    const isGeneric = icon === 'link-outline';

    if (isGeneric) {
        return (
            <View style={{ marginBottom: 12, overflow: 'hidden', }}>
                <LinkPreview
                    text={item.url}
                    renderLinkPreview={({ previewData }) => (
                        <TouchableOpacity
                            onPress={() => Linking.openURL(item.url)}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}
                        >
                            {previewData?.image ? (
                                <FastImage
                                    source={{ uri: previewData.image.url }}
                                    style={{ width: 44, height: 44, borderRadius: 8, marginRight: 12 }}
                                    resizeMode={FastImage.resizeMode.cover}
                                />
                            ) : (
                                <View style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 8,
                                    backgroundColor: colors.card,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginRight: 12
                                }}>
                                    <Ionicons name="link" size={24} color={colors.text} />
                                </View>
                            )}

                            <View style={{ flex: 1 }}>
                                <Text style={common.heading} numberOfLines={1}>{previewData?.title || item.platform || 'Link'}</Text>
                                <FormattedLink url={item.url} username={item.username} common={common} />
                            </View>
                            <Ionicons name="arrow-forward" size={20} color={colors.muted} />
                        </TouchableOpacity>
                    )}
                />
            </View>
        );
    }

    return (
        <TouchableOpacity
            onPress={() => Linking.openURL(item.url)}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                borderRadius: 9999,
            }}
        >
            <View style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: color + '20',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 16
            }}>
                <Ionicons name={icon as any} size={24} color={color} />
            </View>

            <View style={{ flex: 1 }}>
                <Text style={common.heading}>{item.platform}</Text>
                <FormattedLink url={item.url} username={item.username} common={common} />
            </View>

            <Ionicons name="arrow-forward" size={20} color={colors.muted} />
        </TouchableOpacity>
    );
});

export const SocialSheet = memo(forwardRef<TrueSheet, SocialSheetProps>(({ data }, ref) => {
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const inset = useSafeAreaInsets();

    return (
        <TrueSheet
            ref={ref}
            scrollable={true}
            cornerRadius={24}
            backgroundColor={theme === 'dark' ? colors.containerContent : 'white'}
            grabberOptions={{
                color: colors.text
            }}
        >
            <View style={{ flex: 1, padding: 24, paddingBottom: inset.bottom + 20 }}>
                <Text style={[common.heading, { marginBottom: 16 }]}>Social Links</Text>
                <FlatList
                    scrollEnabled={false}
                    data={data}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <SocialLinkItem item={item} colors={colors} common={common} theme={theme} />}
                />
            </View>
        </TrueSheet>
    );
}));
