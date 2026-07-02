import LocationIcon from "@/assets/images/svg/location.svg";
import StickyNoteIcon from "@/assets/images/svg/sticky-note.svg";
import VerifiedIcon from '@/icons/verified';
import { MeshGradient } from '@kuss/react-native-mesh-gradient';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { SquircleView } from 'expo-squircle-view';
import { Avatar } from "heroui-native/avatar";
import { Button } from "heroui-native/button";
import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";
import React, { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import CountryFlag from 'react-native-country-flag';
import Reanimated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { ProfileAddress } from '../../types/profileaddress';
import { ProfileDetail } from '../../types/profiledetail';
import { ProfileLink } from '../../types/profilelink';
import { ProfileMusic } from '../../types/profilemusic';
import { Workplace } from '../../types/profileworplace';
import type { TabType } from '../../viewmodels/ProfileHeaderViewModel';
import { useProfileHeaderViewModel } from '../../viewmodels/ProfileHeaderViewModel';
import { FlexText } from '../FlexText';
import { usePagerHeaderContext } from '../pager/PagerHeaderContext';
import BirthdayCard from './BirthdayCard';
import { SOCIAL_BG_URL } from './header/constants';
import { FamilyStackSection, HeaderInfoCard } from './header/parts';
import { headerStyles } from './header/styles';

const CaseMinimalistic = ({ size, ...props }: any) => <Ionicons name="briefcase" size={size} {...props} />;
const PointOnMap = ({ size, ...props }: any) => <LocationIcon width={size} height={size} {...props} />;
const Notes = ({ size, color, ...props }: any) => <StickyNoteIcon width={size} height={size} color={color} {...props} />;

countries.registerLocale(en);

export const COVER_HEIGHT = 150;

interface ProfileHeaderV3Props {
    scrollY: Animated.Value;
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    profile?: ProfileDetail | null;
    isMe?: boolean;
    isOwner?: boolean;
    musicSheetRef?: React.RefObject<TrueSheet | null>;
    socialSheetRef?: React.RefObject<TrueSheet | null>;
    addressSheetRef?: React.RefObject<TrueSheet | null>;
    workplaceSheetRef?: React.RefObject<TrueSheet | null>;
    familySheetRef?: React.RefObject<TrueSheet | null>;
    briefSheetRef?: React.RefObject<any>;
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
    isOwner = false,
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

    const hometown = profile?.hometown;
    const flagCode = useMemo(() => {
        if (!hometown) return null;
        const parts = hometown.split(',');
        const potentialCountry = parts[parts.length - 1].trim();
        return countries.getAlpha2Code(potentialCountry, "en");
    }, [hometown]);



    const headerCtx = usePagerHeaderContext();
    const topInset = vm.insets.top;
    const animatedContentStyle = useAnimatedStyle(() => {
        if (!headerCtx) return { opacity: 1 };
        const { scrollY, headerHeight } = headerCtx;
        const collapseDistance = Math.max(headerHeight - (topInset + 56), 50);
        const opacity = interpolate(
            scrollY.get(),
            [0, collapseDistance * 0.6],
            [1, 0],
            'clamp'
        );
        return {
            opacity,
            transform: [
                {
                    translateY: interpolate(
                        scrollY.get(),
                        [0, collapseDistance],
                        [0, -16],
                        'clamp'
                    ),
                },
            ],
        };
    });

    return (
        <Reanimated.View pointerEvents="box-none" style={[styles.headerContainer, animatedContentStyle]}>
            {/* We omitted the top row containing back button and music pill since classic layout handles it */}
            <View pointerEvents="none" style={{ height: vm.insets.top + 70 }} />

            <SquircleView pointerEvents="none" borderRadius={36} cornerSmoothing={100} preserveSmoothing style={styles.coverContainer}>
                {profile?.cover_url ? (
                    <ExpoImage
                        source={{ uri: profile.cover_url }}
                        style={styles.coverImage}
                        contentFit="cover"
                    />
                ) : (
                    vm.gradientColors.length === 4 && (
                        <MeshGradient
                            brightness={vm.meshGradientDefaults.brightness}
                            contrast={vm.meshGradientDefaults.contrast}
                            speed={vm.meshGradientDefaults.speed}
                            colors={vm.gradientColors}
                            frequency={vm.meshGradientDefaults.frequency}
                            amplitude={vm.meshGradientDefaults.amplitude}
                            style={styles.coverImage}
                        />
                    )
                )}
            </SquircleView>
            <View pointerEvents="box-none" style={styles.avatarRow}>
                <Avatar>
                    <Avatar.Image source={{ uri: profile?.avatar_url }} />
                    <Avatar.Fallback>{profile?.name?.[0] || 'U'}</Avatar.Fallback>
                </Avatar>
                <View pointerEvents="box-none" className="flex-row gap-2">
                    <Button variant="secondary" isIconOnly onPress={() => onPresentSheet?.(briefSheetRef as React.RefObject<any>)}>
                        <Notes color={vm.colors.text} size={28} />
                    </Button>
                    <SquircleView borderRadius={999} cornerSmoothing={100} preserveSmoothing style={[styles.editButton, { backgroundColor: vm.colors.primary }]}>
                        <TouchableOpacity onPress={() => {
                            if (isOwner) {
                                router.push({
                                    pathname: '/profile/edit-profile',
                                    params: { id: profile?.id || 'me' }
                                });
                            } else {
                                // Add love action
                            }
                        }}>
                            <FlexText style={{ color: vm.colors.onPrimary, fontWeight: "bold", fontSize: 16 }}>
                                {isOwner ? t('profile.header.actions.editProfile', 'Edit Profile') : t("profile.header.actions.addLove")}
                            </FlexText>
                        </TouchableOpacity>
                    </SquircleView>
                </View>
            </View>
            <View pointerEvents="none" className="flex-row items-center gap-1 mb-1">
                <FlexText style={[vm.common.headline, { fontWeight: 'bold' }]}>{profile?.name} {profile?.is_verified && <VerifiedIcon size={24} />} {flagCode && <CountryFlag isoCode={flagCode} size={14} style={{ borderRadius: 2 }} />}</FlexText>
            </View>
            {!!profile?.username && (
                <View pointerEvents="none"><FlexText style={[vm.common.body, { color: vm.colors.muted, marginBottom: 8 }]}>@{profile.username}</FlexText></View>
            )}
            {!!profile?.bio && (
                <View pointerEvents="none"><FlexText style={[vm.common.body, { marginBottom: 8 }]}>{profile.bio}</FlexText></View>
            )}

            {profile && (
                <FamilyStackSection
                    vm={vm}
                    profile={profile}
                    onPress={() => onPresentSheet?.(familySheetRef as React.RefObject<any>)}
                />
            )}

            {(isOwner || !!profile?.birthday || !!(profile as any)?.has_facebook || socialLinks.length > 0 || addresses.length > 0 || workplaces.length > 0) && (
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

                    {(isOwner || socialLinks.length > 0) && (
                        <HeaderInfoCard
                            onPress={() => onPresentSheet?.(socialSheetRef as React.RefObject<any>)}
                            backgroundColor={vm.colors.card}
                            backgroundImageUri={SOCIAL_BG_URL}
                            showDimOverlay
                            textColor="white"
                            centerText
                            labelStyle={vm.common.label}
                        >
                            {socialLinks.length > 0
                                ? `${socialLinks.length} ${t('profile.header.countSocialLinks', { count: socialLinks.length })}`
                                : t('profile.header.cards.addSocialLinks', 'Social Links')}
                        </HeaderInfoCard>
                    )}

                    {(isOwner || addresses.length > 0) && (
                        <HeaderInfoCard
                            onPress={() => onPresentSheet?.(addressSheetRef as React.RefObject<any>)}
                            backgroundColor={vm.colors.card}
                            showTintOverlay={vm.colors.text}
                            labelStyle={vm.common.label}
                            leading={(
                                <View style={[headerStyles.iconBubble, { backgroundColor: vm.colors.card }]}>
                                    <PointOnMap size={28} color={vm.colors.text} />
                                </View>
                            )}
                        >
                            {addresses.length > 0
                                ? `${addresses.length} ${t('profile.header.countAddresses', { count: addresses.length })}`
                                : t('profile.header.cards.addAddresses', 'Addresses')}
                        </HeaderInfoCard>
                    )}

                    {(isOwner || workplaces.length > 0) && (
                        <HeaderInfoCard
                            onPress={() => onPresentSheet?.(workplaceSheetRef as React.RefObject<any>)}
                            backgroundColor={vm.colors.card}
                            showTintOverlay={vm.colors.text}
                            labelStyle={vm.common.label}
                            leading={(
                                <View style={[headerStyles.iconBubble, { backgroundColor: vm.colors.card }]}>
                                    <CaseMinimalistic size={28} color={vm.colors.text} />
                                </View>
                            )}
                        >
                            {workplaces.length > 0
                                ? `${workplaces.length} ${t('profile.header.countWorkplaces', { count: workplaces.length })}`
                                : t('profile.header.cards.addWorkplaces', 'Workplaces')}
                        </HeaderInfoCard>
                    )}
                </ScrollView>
            )}

            <View pointerEvents="none" className="flex-row gap-2" style={{ marginBottom: 12 }}>
                <FlexText style={{ color: vm.colors.text }}>{postCount} <FlexText style={{ fontWeight: 'bold', color: vm.colors.muted, textTransform: 'capitalize' }}>{t("profile.header.countPosts", { count: postCount })}</FlexText></FlexText>
                <FlexText style={{ color: vm.colors.text }}>{imageCount} <FlexText style={{ fontWeight: 'bold', color: vm.colors.muted, textTransform: 'capitalize' }}>{t("profile.header.countImages", { count: imageCount })}</FlexText></FlexText>
                <FlexText style={{ color: vm.colors.text }}>{videoCount} <FlexText style={{ fontWeight: 'bold', color: vm.colors.muted, textTransform: 'capitalize' }}>{t("profile.header.countVideos", { count: videoCount })}</FlexText></FlexText>
            </View>
        </Reanimated.View>
    );
});

ProfileHeaderV3.displayName = "ProfileHeaderV3";

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
        paddingHorizontal: 32,
        justifyContent: "center",
        alignItems: "center",
    },
});

export default ProfileHeaderV3;
