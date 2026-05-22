import { Ionicons } from '@expo/vector-icons';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { CaseMinimalisticBold, NotesBold, PointOnMapBold } from '@solar-icons/react-native';
import { useRouter } from 'expo-router';
import { SquircleView } from 'expo-squircle-view';
import { Avatar, Button, Tabs } from 'heroui-native';
import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";
import React, { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import CountryFlag from 'react-native-country-flag';
import { NitroImage } from 'react-native-nitro-image';

import VerifiedIcon from '@/icons/verified';
import { ProfileAddress } from '../../types/profileaddress';
import { ProfileDetail } from '../../types/profiledetail';
import { ProfileLink } from '../../types/profilelink';
import { ProfileMusic } from '../../types/profilemusic';
import { Workplace } from '../../types/profileworplace';
import type { TabType } from '../../viewmodels/ProfileHeaderViewModel';
import { useProfileHeaderViewModel } from '../../viewmodels/ProfileHeaderViewModel';
import { FlexText } from '../FlexText';
import BirthdayCard from './BirthdayCard';
import { SOCIAL_BG_URL } from './header/constants';
import { FamilyStackSection, HeaderInfoCard } from './header/parts';
import { headerStyles } from './header/styles';

countries.registerLocale(en);

export const COVER_HEIGHT = 150;

interface ProfileHeaderV3Props {
    scrollY: Animated.Value;
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    profile?: ProfileDetail | null;
    isMe?: boolean;
    musicSheetRef?: React.RefObject<TrueSheet | null>;
    socialSheetRef?: React.RefObject<TrueSheet | null>;
    addressSheetRef?: React.RefObject<TrueSheet | null>;
    workplaceSheetRef?: React.RefObject<TrueSheet | null>;
    familySheetRef?: React.RefObject<TrueSheet | null>;
    briefSheetRef?: React.RefObject<TrueSheet | null>;
    onPresentSheet?: (ref: React.RefObject<any>) => void;
    workplaces?: Workplace[];
    music?: ProfileMusic[];
    socialLinks?: ProfileLink[];
    addresses?: ProfileAddress[];
    imageCount?: number;
    videoCount?: number;
    postCount?: number;
}

const ProfileHeaderV3: React.FC<ProfileHeaderV3Props> = memo(({
    scrollY,
    activeTab,
    onTabChange,
    profile,
    socialSheetRef,
    addressSheetRef,
    workplaceSheetRef,
    familySheetRef,
    briefSheetRef,
    onPresentSheet,
    workplaces = [],
    socialLinks = [],
    addresses = [],
    imageCount = 0,
    videoCount = 0,
    postCount = 0,
    isMe = false,
    music = [], // Need this for VM to not crash if accessed
}) => {
    const { t } = useTranslation();
    const router = useRouter();

    const vm = useProfileHeaderViewModel({
        scrollY,
        activeTab,
        onTabChange,
        profile,
        isMe,
        addresses,
        music,
    });

    const flagCode = useMemo(() => {
        if (!profile?.hometown) return null;
        const parts = profile.hometown.split(',');
        const potentialCountry = parts[parts.length - 1].trim();
        return countries.getAlpha2Code(potentialCountry, "en");
    }, [profile?.hometown]);

    const routes = useMemo(() => [
        { key: "Feed", title: t("profile.tabs.feed") },
        { key: "Images", title: t("profile.tabs.images") },
        { key: "Videos", title: t("profile.tabs.videos") },
    ], [t]);

    return (
        <View style={styles.headerContainer}>
            {/* We omitted the top row containing back button and music pill since classic layout handles it */}
            <View style={{ height: vm.insets.top + 12 }} />

            <SquircleView borderRadius={16} cornerSmoothing={100} preserveSmoothing style={styles.coverContainer}>
                <NitroImage
                    image={{ url: profile?.cover_url || "https://picsum.photos/1000" }}
                    style={styles.coverImage}
                    resizeMode="cover"
                />
            </SquircleView>
            <View style={styles.avatarRow}>
                <Avatar>
                    <Avatar.Image source={{ uri: profile?.avatar_url }} />
                    <Avatar.Fallback>{profile?.name?.[0] || 'U'}</Avatar.Fallback>
                </Avatar>
                <View className="flex-row gap-2">
                    <Button variant="secondary" isIconOnly onPress={() => onPresentSheet?.(briefSheetRef as React.RefObject<any>)}>
                        <NotesBold color={vm.colors.text} size={34} />
                    </Button>
                    <SquircleView borderRadius={999} cornerSmoothing={100} preserveSmoothing style={styles.editButton}>
                        <TouchableOpacity>
                            <FlexText style={{ color: '#fff', fontWeight: "bold", fontSize: 16 }}>{t("profile.header.actions.addLove")}</FlexText>
                        </TouchableOpacity>
                    </SquircleView>
                </View>
            </View>
            <View className="flex-row items-center gap-1 mb-1">
                <FlexText style={[vm.common.headline, { fontWeight: 'bold' }]}>{profile?.name}</FlexText>
                {profile?.is_verified && <VerifiedIcon size={16} backgroundColor={vm.colors.verify} />}
                {flagCode && <CountryFlag isoCode={flagCode} size={14} style={{ borderRadius: 2 }} />}
            </View>
            {!!profile?.username && (
                <FlexText style={[vm.common.body, { color: vm.colors.muted, marginBottom: 8 }]}>@{profile.username}</FlexText>
            )}
            {!!profile?.bio && (
                <FlexText style={[vm.common.body, { marginBottom: 8 }]}>{profile.bio}</FlexText>
            )}

            {profile && (
                <FamilyStackSection
                    vm={vm}
                    profile={profile}
                    onPress={() => onPresentSheet?.(familySheetRef as React.RefObject<any>)}
                />
            )}

            {(!!profile?.birthday || !!(profile as any)?.has_facebook || socialLinks.length > 0 || addresses.length > 0 || workplaces.length > 0) && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={headerStyles.cardsScroll}
                    contentContainerStyle={headerStyles.cardsScrollContent}
                >
                    {profile?.birthday && <BirthdayCard birthday={profile.birthday} />}

                    {(profile as any)?.has_facebook && (
                        <HeaderInfoCard
                            onPress={() => router.push({ pathname: '/fprofile', params: { profile: JSON.stringify(profile) } })}
                            backgroundColor="#1877F2"
                            textColor="#FFF"
                            labelStyle={vm.common.label}
                            leading={(
                                <View style={headerStyles.facebookIconBubble}>
                                    <Ionicons name="logo-facebook" size={28} color="#FFF" />
                                </View>
                            )}
                        >
                            {t('profile.header.cards.facebookProfile')}
                        </HeaderInfoCard>
                    )}

                    {socialLinks.length > 0 && (
                        <HeaderInfoCard
                            onPress={() => onPresentSheet?.(socialSheetRef as React.RefObject<any>)}
                            backgroundColor={vm.colors.card}
                            backgroundImageUri={SOCIAL_BG_URL}
                            showDimOverlay
                            textColor="white"
                            centerText
                            labelStyle={vm.common.label}
                        >
                            {socialLinks.length} {t('profile.header.countSocialLinks', { count: socialLinks.length })}
                        </HeaderInfoCard>
                    )}

                    {addresses.length > 0 && (
                        <HeaderInfoCard
                            onPress={() => onPresentSheet?.(addressSheetRef as React.RefObject<any>)}
                            backgroundColor={vm.colors.card}
                            showTintOverlay={vm.colors.text}
                            labelStyle={vm.common.label}
                            leading={(
                                <View style={[headerStyles.iconBubble, { backgroundColor: vm.colors.card }]}>
                                    <PointOnMapBold size={28} color={vm.colors.text} />
                                </View>
                            )}
                        >
                            {addresses.length} {t('profile.header.countAddresses', { count: addresses.length })}
                        </HeaderInfoCard>
                    )}

                    {workplaces.length > 0 && (
                        <HeaderInfoCard
                            onPress={() => onPresentSheet?.(workplaceSheetRef as React.RefObject<any>)}
                            backgroundColor={vm.colors.card}
                            showTintOverlay={vm.colors.text}
                            labelStyle={vm.common.label}
                            leading={(
                                <View style={[headerStyles.iconBubble, { backgroundColor: vm.colors.card }]}>
                                    <CaseMinimalisticBold size={28} color={vm.colors.text} />
                                </View>
                            )}
                        >
                            {workplaces.length} {t('profile.header.countWorkplaces', { count: workplaces.length })}
                        </HeaderInfoCard>
                    )}
                </ScrollView>
            )}

            <View className="flex-row gap-2" style={{ marginBottom: 12 }}>
                <FlexText style={{ color: vm.colors.text }}>{postCount} <FlexText style={{ fontWeight: 'bold', color: vm.colors.muted, textTransform: 'capitalize' }}>{t("profile.header.countPosts", { count: postCount })}</FlexText></FlexText>
                <FlexText style={{ color: vm.colors.text }}>{imageCount} <FlexText style={{ fontWeight: 'bold', color: vm.colors.muted, textTransform: 'capitalize' }}>{t("profile.header.countImages", { count: imageCount })}</FlexText></FlexText>
                <FlexText style={{ color: vm.colors.text }}>{videoCount} <FlexText style={{ fontWeight: 'bold', color: vm.colors.muted, textTransform: 'capitalize' }}>{t("profile.header.countVideos", { count: videoCount })}</FlexText></FlexText>
            </View>

            {/* Tabs UI from ProfileNew */}
            <Tabs
                value={activeTab}
                onValueChange={(val: any) => onTabChange(val)}
                style={{ paddingHorizontal: 0, marginBottom: 16 }}
            >
                <Tabs.List>
                    <Tabs.ScrollView scrollAlign="center">
                        <Tabs.Indicator />
                        {routes.map((route) => (
                            <Tabs.Trigger key={route.key} value={route.key}>
                                <Tabs.Label>{route.title}</Tabs.Label>
                            </Tabs.Trigger>
                        ))}
                    </Tabs.ScrollView>
                </Tabs.List>
            </Tabs>
        </View>
    );
});

const styles = StyleSheet.create({
    headerContainer: {
        paddingHorizontal: 12,
    },
    coverContainer: {
        overflow: "hidden",
        width: '100%',
        marginBottom: 32,
    },
    coverImage: {
        height: 150,
        width: '100%',
    },
    avatarRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    editButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 32,
        justifyContent: "center",
        alignItems: "center",
    },
});

export default ProfileHeaderV3;
