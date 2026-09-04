import LocationIcon from "@/assets/images/svg/location.svg";
import StickyNoteIcon from "@/assets/images/svg/sticky-note.svg";
import VerifiedIcon from '@/icons/verified';
import { MeshGradient } from '@kuss/react-native-mesh-gradient';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from 'expo-router';
import Transition from 'react-native-screen-transitions';
import { SquircleView } from 'expo-squircle-view';
import { Button } from "heroui-native/button";
import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";
import React, { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
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
import { useSettingsStore } from '@/stores/settings';
import { ADDRESS_COVER, INSTAGRAM_COVER_URL, SOCIAL_BG_URL, WORK_COVER, X_COVER_URL } from './header/constants';
import { FamilyStackSection, HeaderInfoCard } from './header/parts';
import { headerStyles } from './header/styles';
import { extractInstagramProfileInfo, extractXProfileInfo } from './header/utils';

const CaseMinimalistic = ({ size, ...props }: any) => <Ionicons name="briefcase" size={size} {...props} />;
const PointOnMap = ({ size, ...props }: any) => <LocationIcon width={size} height={size} {...props} />;
const Notes = ({ size, color, ...props }: any) => <StickyNoteIcon width={size} height={size} color={color} {...props} />;

countries.registerLocale(en);

export const COVER_HEIGHT = 260;

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
    bioSheetRef?: React.RefObject<TrueSheet | null>;
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
    bioSheetRef,
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
    const params = useLocalSearchParams<{ id?: string }>();
    const effectiveId = profile?.id ?? params?.id;

    const vm = useProfileHeaderViewModel({
        scrollY,
        activeTab,
        onTabChange,
        profile,
        isMe,
        addresses,
        music,
    });

    const socialAioClientId = useSettingsStore((s) => s.socialAioClientId);
    const xLinkInfo = useMemo(() => extractXProfileInfo(socialLinks, profile), [socialLinks, profile]);
    const igLinkInfo = useMemo(() => {
        if (!socialAioClientId) return null;
        return extractInstagramProfileInfo(socialLinks, profile);
    }, [socialLinks, profile, socialAioClientId]);

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

    const transparentColor = vm.colors.surface + "00";
    const midColor1 = vm.colors.surface + "59";
    const midColor2 = vm.colors.surface + "CC";
    const solidColor = vm.colors.surface;

    return (
        <Reanimated.View pointerEvents="box-none" style={[styles.headerContainer, animatedContentStyle]}>
            {/* Absolute Cover Background with Fade Overlay */}
            <View pointerEvents="none" style={styles.absoluteCoverContainer}>
                {profile?.cover_url ? (
                    <ExpoImage
                        source={{ uri: profile.cover_url }}
                        style={StyleSheet.absoluteFill}
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
                            style={StyleSheet.absoluteFill}
                        />
                    )
                )}
                <LinearGradient
                    colors={[transparentColor, midColor1, midColor2, solidColor]}
                    locations={[0, 0.4, 0.75, 1]}
                    style={styles.gradientOverlay}
                    pointerEvents="none"
                />
            </View>

            {/* Top space pushing avatar below header controls */}
            <View pointerEvents="none" style={{ height: vm.insets.top + 110 }} />
            <View pointerEvents="box-none" style={styles.avatarRow}>
                <Transition.Boundary
                    id={`avatar-${effectiveId}`}
                    style={{ width: 64, height: 64, borderRadius: 32, overflow: 'hidden' }}
                >
                    <ExpoImage
                        source={{ uri: profile?.avatar_url }}
                        style={{ width: 64, height: 64, borderRadius: 32 }}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                    />
                </Transition.Boundary>
                <View pointerEvents="box-none" className="flex-row gap-2">
                    <Button variant="secondary" isIconOnly onPress={() => onPresentSheet?.(briefSheetRef as React.RefObject<any>)}>
                        <ExpoImage source={require("@/assets/images/icons/info.png")} style={{ width: 36, height: 36 }} contentFit="contain"
                            tintColor={vm.colors.onSurface}
                        />
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
            <View pointerEvents="none" className="flex-row items-center gap-2 mb-1">
                <FlexText style={[vm.common.headline, { fontWeight: 'bold' }]}>{profile?.name}</FlexText>
                {profile?.is_verified && <VerifiedIcon size={24} />}
            </View>
            {!!profile?.username && (
                <View pointerEvents="none"><FlexText style={[vm.common.body, { color: vm.colors.muted, marginBottom: 8 }]}>@{profile.username}</FlexText></View>
            )}
            {!!profile?.bio && (
                <View style={{ marginBottom: 8 }}>
                    <FlexText numberOfLines={2} style={[vm.common.body]}>
                        {profile.bio}
                    </FlexText>
                    {(profile.bio.length > 70 || profile.bio.includes('\n')) && (
                        <TouchableOpacity
                            onPress={() => onPresentSheet?.(bioSheetRef as React.RefObject<any>)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            style={{ marginTop: 2, alignSelf: 'flex-start' }}
                        >
                            <FlexText style={{ color: vm.colors.primary, fontWeight: '600', fontSize: 13 }}>
                                {t('common.readMore', 'Read more')}
                            </FlexText>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {!!(profile as any)?.metadata?.employee_card && (
                <TouchableOpacity
                    onPress={() => {
                        router.push({
                            pathname: '/profile/employee-card',
                            params: { url: (profile as any).metadata.employee_card }
                        } as any);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{
                        marginTop: 12,
                        marginBottom: 4,
                        alignSelf: 'flex-start',
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: vm.colors.primary + '15',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 100,
                        gap: 6
                    }}
                >
                    <Ionicons name="id-card-outline" size={16} color={vm.colors.primary} />
                    <FlexText style={{ color: vm.colors.primary, fontWeight: '600', fontSize: 13 }}>
                        {t('profile.header.actions.viewEmployeeCard')}
                    </FlexText>
                </TouchableOpacity>
            )}

            {profile && (
                <FamilyStackSection
                    vm={vm}
                    profile={profile}
                    onPress={() => onPresentSheet?.(familySheetRef as React.RefObject<any>)}
                />
            )}

            {(isOwner || !!profile?.birthday || !!(profile as any)?.has_facebook || !!xLinkInfo || !!igLinkInfo || socialLinks.length > 0 || addresses.length > 0 || workplaces.length > 0) && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={headerStyles.cardsScroll}
                    contentContainerStyle={headerStyles.cardsScrollContent}
                >
                    {profile?.birthday && <BirthdayCard birthday={profile.birthday} />}

                    {!!xLinkInfo && (
                        <HeaderInfoCard
                            onPress={() =>
                                router.push({
                                    pathname: '/fprofile',
                                    params: {
                                        handle: xLinkInfo.handle || '',
                                        profile: profile ? JSON.stringify(profile) : '',
                                        socialLinks: JSON.stringify(socialLinks),
                                    },
                                })
                            }
                            backgroundColor="#1877F2"
                            backgroundImageUri={X_COVER_URL}
                            textColor="#FFF"
                            labelStyle={vm.common.label}
                            leading={(
                                <View style={headerStyles.facebookIconBubble}>
                                    <Ionicons name="logo-x" size={28} color="#FFF" />
                                </View>
                            )}
                        >
                            {xLinkInfo.handle ? `@${xLinkInfo.handle}` : t('profile.header.cards.xProfile')}
                        </HeaderInfoCard>
                    )}

                    {!!igLinkInfo && (
                        <HeaderInfoCard
                            onPress={() =>
                                router.push({
                                    pathname: '/iprofile',
                                    params: {
                                        url: igLinkInfo.rawUrl || igLinkInfo.handle || '',
                                        handle: igLinkInfo.handle || '',
                                        profile: profile ? JSON.stringify(profile) : '',
                                        socialLinks: JSON.stringify(socialLinks),
                                    },
                                })
                            }
                            backgroundColor="#E1306C"
                            backgroundImageUri={INSTAGRAM_COVER_URL}
                            textColor="#FFF"
                            labelStyle={vm.common.label}
                            leading={(
                                <View style={headerStyles.facebookIconBubble}>
                                    <Ionicons name="logo-instagram" size={28} color="#FFF" />
                                </View>
                            )}
                        >
                            {igLinkInfo.handle ? `@${igLinkInfo.handle}` : t('profile.header.cards.instagramProfile', 'Instagram')}
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
                            backgroundImageUri={ADDRESS_COVER}
                            // showTintOverlay={vm.colors.onSurface}
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
                            backgroundImageUri={WORK_COVER}
                            // showTintOverlay={vm.colors.onSurface}
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
        position: 'relative',
    },
    absoluteCoverContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: COVER_HEIGHT,
        overflow: "hidden",
    },
    gradientOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '85%',
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
