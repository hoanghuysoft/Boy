import { FlexText } from '@/components/FlexText';
import { Ionicons } from '@expo/vector-icons';
import { LinkPreview } from '@flyerhq/react-native-link-preview';
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { FlashList } from '@shopify/flash-list';
import { EarthBold } from '@solar-icons/react-native';
import React, { forwardRef, memo, useCallback } from "react";
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { NitroImage } from 'react-native-nitro-image';
import NitroInAppBrowser from 'react-native-nitro-in-app-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from "../../../context/ThemeContext";
import { createCommonStyles } from "../../../styles/common";
import { ProfileLink } from '../../../types/profilelink';
import { useSheetBackHandler } from "./useSheetBackHandler";


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
    } else if (p.includes('telegram')) {
        icon = 'logo-telegram';
        color = '#229ED9';
    } else if (p.includes('snapchat')) {
        icon = 'logo-snapchat';
        color = '#FFFC00';
    } else if (p.includes('threads')) {
        icon = 'logo-threads';
        color = theme === 'dark' ? '#ffffff' : '#000000';
    } else if (p.includes('discord')) {
        icon = 'logo-discord';
        color = theme === 'dark' ? '#ffffff' : '#000000';
    } else if (p.includes('twitch')) {
        icon = 'logo-twitch';
        color = theme === 'dark' ? '#ffffff' : '#000000';
    } else if (p.includes('reddit')) {
        icon = 'logo-reddit';
        color = theme === 'dark' ? '#ffffff' : '#000000';
    } else if (p.includes('soundcloud')) {
        icon = 'logo-soundcloud';
        color = theme === 'dark' ? '#ffffff' : '#000000';
    } else if (p.includes('paypal')) {
        icon = 'logo-paypal';
        color = theme === 'dark' ? '#ffffff' : '#000000';
    } else if (p.includes('cashapp')) {
        icon = 'logo-cashapp';
        color = theme === 'dark' ? '#ffffff' : '#000000';
    } else if (p.includes('venmo')) {
        icon = 'logo-venmo';
        color = theme === 'dark' ? '#ffffff' : '#000000';
    } else if (p.includes('cashapp')) {
        icon = 'logo-cashapp';
        color = theme === 'dark' ? '#ffffff' : '#000000';
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
            console.error(e);
        }
    } else if (username && !username.startsWith('@')) {
        display = '@' + username;
    }

    return (
        <FlexText style={[common.bodySmall, { color: color, opacity: 0.6, marginTop: 2 }]} numberOfLines={1}>
            {display}
        </FlexText>
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
            <View style={{ marginRight: 16 }}>
                {iconNode}
            </View>

            <View style={{ flex: 1, justifyContent: 'center' }}>
                <FlexText style={[common.heading, { fontSize: 16 }]} numberOfLines={1}>
                    {title}
                </FlexText>
                <FormattedLink url={url} username={username} common={common} color={colors.text} />
            </View>

            <Ionicons name="chevron-forward" size={20} color={colors.muted || '#999'} style={{ marginLeft: 8 }} />
        </TouchableOpacity>
    );
};


const SocialLinkItem = memo(({ item, colors, common, theme }: { item: ProfileLink, colors: any, common: any, theme: 'light' | 'dark' }) => {
    const { t } = useTranslation();
    const { icon, color } = getPlatformDetails(item.platform, theme);
    const isGeneric = icon === 'link-outline';

    const handleOpenLink = useCallback(async () => {
        try {
            await NitroInAppBrowser.open(item.url, {
                presentationStyle: 'fullScreen',
                dismissButtonLabel: 'close',
            });
        } catch (error) {
            console.error(error);
        }
    }, [item.url]);

    if (isGeneric) {
        return (
            <LinkPreview
                text={item.url}
                enableAnimation={true}
                renderLinkPreview={({ previewData }) => {
                    const imageUrl = previewData?.image?.url;

                    const IconNode = imageUrl ? (
                        <View style={{ width: 48, height: 48, borderRadius: 999, overflow: 'hidden' }}>
                            <NitroImage
                                image={{ url: imageUrl }}
                                style={{ width: 48, height: 48, borderRadius: 999 }}
                                resizeMode="cover"
                            />
                        </View>
                    ) : (
                        <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
                            <EarthBold size={24} color={colors.text} />
                        </View>
                    );

                    return (
                        <LinkCard
                            onPress={() => handleOpenLink()}
                            iconNode={IconNode}
                            title={previewData?.title || item.platform || t('profile.sheets.social.website')}
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
            onPress={() => handleOpenLink()}
            iconNode={IconNode}
            title={item.platform}
            url={item.url}
            username={item.label || undefined}
            colors={colors}
            common={common}
        />
    );
});
SocialLinkItem.displayName = 'SocialLinkItem';



export const SocialSheet = memo(forwardRef<TrueSheet, SocialSheetProps>(({ data, onEndReached }, ref) => {
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const { t } = useTranslation();
    const inset = useSafeAreaInsets();
    const backHandler = useSheetBackHandler(ref);

    // Safety check for empty data
    if (!data || data.length === 0) return null;

    return (
        <TrueSheet
            ref={ref}
            scrollable={true}
            backgroundColor={theme === 'dark' ? colors.containerContent : '#ffffff'}
            grabberOptions={{
                color: colors.muted || "#C4C4C4",
                height: 5,
                width: 40,
            }}
            detents={['auto']}
            onDidPresent={backHandler.onDidPresent}
            onDidDismiss={backHandler.onDidDismiss}
        >
            <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 24 }}>

                {/* Header */}
                <View style={{ marginBottom: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                        <FlexText style={[common.heading, { fontSize: 24 }]}>{t('profile.sheets.social.title')}</FlexText>
                        <FlexText style={[common.bodySmall, { color: colors.muted, marginTop: 4 }]}>
                            {t('profile.sheets.social.subtitle')}
                        </FlexText>
                    </View>
                </View>

                {/* List */}
                <FlashList
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