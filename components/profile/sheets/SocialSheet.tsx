import FastImage from '@d11/react-native-fast-image';
import { Ionicons } from '@expo/vector-icons';
import { LinkPreview } from '@flyerhq/react-native-link-preview';
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import React, { forwardRef, memo } from "react";
import { FlatList, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from "../../../context/ThemeContext";
import { createCommonStyles } from "../../../styles/common";
import { ProfileLink } from '../../../types/profilelink';

interface SocialSheetProps {
    data: ProfileLink[];
    onEndReached?: () => void;
}

// Helper to get brand colors and icons
const getPlatformDetails = (platform: string, theme: 'light' | 'dark') => {
    const p = platform?.toLowerCase() || '';

    let icon = 'link-outline';
    let color = theme === 'dark' ? '#ffffff' : '#000000';

    if (p.includes('twitter') || p.includes('x')) {
        icon = p.includes('x') ? 'logo-x' : 'logo-twitter';
        color = '#1DA1F2'; // Twitter Blue
        if (p.includes('x')) color = theme === 'dark' ? '#ffffff' : '#000000';
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

// Clean URL formatter
const FormattedLink = ({ url, username, common, color }: { url: string, username?: string, common: any, color: string }) => {
    let display = username || url;

    if (!username && url) {
        try {
            const urlObj = new URL(url);
            if (urlObj.pathname.length > 1 && !urlObj.pathname.includes('/p/')) {
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
        <Text style={[common.bodySmall, { color: color, opacity: 0.6, marginTop: 2 }]} numberOfLines={1}>
            {display}
        </Text>
    );
};

// Reusable Card Component
const LinkCard = ({
    onPress,
    iconNode,
    title,
    url,
    username,
    colors,
    common
}: {
    onPress: () => void,
    iconNode: React.ReactNode,
    title: string,
    url: string,
    username?: string,
    colors: any,
    common: any
}) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 8,
                marginBottom: 12,
            }}
        >
            {/* Icon Container */}
            <View style={{ marginRight: 16 }}>
                {iconNode}
            </View>

            {/* Text Content */}
            <View style={{ flex: 1, justifyContent: 'center' }}>
                <Text style={[common.heading, { fontSize: 16 }]} numberOfLines={1}>
                    {title}
                </Text>
                <FormattedLink url={url} username={username} common={common} color={colors.text} />
            </View>

            {/* Action Arrow */}
            <Ionicons name="chevron-forward" size={20} color={colors.muted || '#999'} style={{ marginLeft: 8 }} />
        </TouchableOpacity>
    );
};


const SocialLinkItem = memo(({ item, colors, common, theme }: { item: ProfileLink, colors: any, common: any, theme: 'light' | 'dark' }) => {
    const { icon, color } = getPlatformDetails(item.platform, theme);
    const isGeneric = icon === 'link-outline';

    // 1. GENERIC LINK (With Preview Fetching)
    if (isGeneric) {
        return (
            <LinkPreview
                text={item.url}
                enableAnimation={true}
                renderLinkPreview={({ previewData }) => {
                    const imageUrl = previewData?.image?.url;

                    const IconNode = imageUrl ? (
                        <FastImage
                            source={{ uri: imageUrl }}
                            style={{ width: 48, height: 48, borderRadius: 999 }}
                            resizeMode={FastImage.resizeMode.cover}
                        />
                    ) : (
                        <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
                            <Ionicons name="link" size={24} color={colors.text} />
                        </View>
                    );

                    return (
                        <LinkCard
                            onPress={() => Linking.openURL(item.url)}
                            iconNode={IconNode}
                            title={previewData?.title || item.platform || 'Website'}
                            url={item.url}
                            username={item.label || undefined}
                            colors={colors}
                            common={common}
                        />
                    );
                }}
            />
        );
    }

    // 2. SOCIAL PLATFORM LINK (Specific Styling)
    const IconNode = (
        <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
            <Ionicons name={icon as any} size={24} color={color} />
        </View>
    );

    return (
        <LinkCard
            onPress={() => Linking.openURL(item.url)}
            iconNode={IconNode}
            title={item.platform}
            url={item.url}
            username={item.label || undefined}
            colors={colors}
            common={common}
        />
    );
});


export const SocialSheet = memo(forwardRef<TrueSheet, SocialSheetProps>(({ data, onEndReached }, ref) => {
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const inset = useSafeAreaInsets();

    // Safety check for empty data
    if (!data || data.length === 0) return null;

    return (
        <TrueSheet
            ref={ref}
            scrollable={true}
            backgroundColor={theme === 'dark' ? colors.containerContent : '#ffffff'}
            grabberOptions={{
                color: colors.muted || '#C4C4C4',
                height: 4,
                width: 32,
            }}
        >
            <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 24 }}>

                {/* Header */}
                <View style={{ marginBottom: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                        <Text style={[common.heading, { fontSize: 24 }]}>Socials</Text>
                        <Text style={[common.bodySmall, { color: colors.muted, marginTop: 4 }]}>
                            Connect with me on these platforms
                        </Text>
                    </View>
                </View>

                {/* List */}
                <FlatList
                    nestedScrollEnabled
                    onEndReached={onEndReached}
                    onEndReachedThreshold={0.5}
                    data={data}
                    keyExtractor={(item, index) => item.id || index.toString()}
                    renderItem={({ item }) => (
                        <SocialLinkItem
                            key={item.id}
                            item={item}
                            colors={colors}
                            common={common}
                            theme={theme}
                        />
                    )}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />

                {/* Optional Close Button (Good UX for tall sheets) */}
                <TouchableOpacity
                    onPress={() => (ref as any)?.current?.dismiss()}
                    style={{
                        paddingVertical: 16,
                        alignItems: 'center',
                        marginTop: 8,
                        marginBottom: inset.bottom > 0 ? 0 : 16
                    }}
                >
                </TouchableOpacity>

            </View>
        </TrueSheet>
    );
}));

const styles = StyleSheet.create({
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 999,
        justifyContent: 'center',
        alignItems: 'center',
    }
});