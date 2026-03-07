import VerifiedIcon from '@/icons/verified';
import FastImage from '@d11/react-native-fast-image';
import { Ionicons } from '@expo/vector-icons';
import { MeshGradient } from '@kuss/react-native-mesh-gradient';
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { Galeria } from '@nandorojo/galeria';
import { CaseMinimalisticBold, ChatSquareLikeBold, HeartAngleBold, HeartBold, PlayCircleBold, PlayCircleOutline, PointOnMapBold } from '@solar-icons/react-native';
import { useRouter } from 'expo-router';
import { SquircleView } from 'expo-squircle-view';
import React, { memo, useMemo } from "react";
import {
    Animated,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import CountryFlag from "react-native-country-flag";
import TurboImage from 'react-native-turbo-image';
import { ProfileAddress } from "../../types/profileaddress";
import { ProfileDetail } from "../../types/profiledetail";
import { ProfileLink } from "../../types/profilelink";
import { ProfileMusic } from "../../types/profilemusic";
import { Workplace } from "../../types/profileworplace";
import { getFamilyAvatarSource } from "../../utils/familyAvatar";
import { useProfileHeaderViewModel } from "../../viewmodels/ProfileHeaderViewModel";
import BirthdayCard from './BirthdayCard';
import DynamicAvatar from './DynamicAvatar';
import QuickPreviewModal from './QuickPreviewModal';

const COVER_HEIGHT = 280;
const AnimatedTurboImage = Animated.createAnimatedComponent(TurboImage);

type TabType = "Information" | "Images" | "Videos" | "Feed";

interface ProfileHeaderProps {
    scrollY: Animated.Value;
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    tabContent?: React.ReactNode;
    profile?: ProfileDetail | null;
    isMe?: boolean;
    musicSheetRef?: React.RefObject<TrueSheet | null>;
    socialSheetRef?: React.RefObject<TrueSheet | null>;
    addressSheetRef?: React.RefObject<TrueSheet | null>;
    workplaceSheetRef?: React.RefObject<TrueSheet | null>;
    familySheetRef?: React.RefObject<TrueSheet | null>;
    briefSheetRef?: React.RefObject<TrueSheet | null>;
    workplaces?: Workplace[];
    music?: ProfileMusic[];
    socialLinks?: ProfileLink[];
    addresses?: ProfileAddress[];
    onMusicEndReached?: () => void;
    onSocialEndReached?: () => void;
    onAddressesEndReached?: () => void;
    onWorkplacesEndReached?: () => void;
    imageCount?: number;
    videoCount?: number;
    postCount?: number;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = memo(({
    scrollY,
    activeTab,
    onTabChange,
    tabContent,
    profile,
    musicSheetRef,
    socialSheetRef,
    addressSheetRef,
    workplaceSheetRef,
    familySheetRef,
    briefSheetRef,
    workplaces = [],
    music = [],
    socialLinks = [],
    addresses = [],
    imageCount = 0,
    videoCount = 0,
    postCount = 0,
    isMe = false,
}) => {
    const vm = useProfileHeaderViewModel({
        scrollY,
        activeTab,
        onTabChange,
        profile,
        isMe,
        music,
        addresses,
    });
    const router = useRouter();

    const style = componentStyles(vm.colors);

    // Parse metadata to check for facebook section
    const hasFacebook = useMemo(() => {
        if (!profile?.metadata) return false;
        try {
            const meta = typeof profile.metadata === 'string'
                ? JSON.parse(profile.metadata)
                : profile.metadata;
            return !!meta?.facebook;
        } catch {
            return false;
        }
    }, [profile?.metadata]);

    return (
        <>
            {vm.hasCover ? (
                <AnimatedTurboImage
                    source={{
                        uri: profile?.cover_url || '',
                    }}
                    style={[
                        style.coverImage,
                        {
                            transform: [{ translateY: vm.coverTranslateY }],
                        },
                    ]}
                    resizeMode="cover"
                />
            ) : (
                <Animated.View
                    style={[
                        style.coverImage,
                        {
                            transform: [{ translateY: vm.coverTranslateY }],
                        },
                    ]}
                >
                    {vm.gradientColors.length === 4 && (
                        <MeshGradient
                            brightness={vm.meshGradientDefaults.brightness}
                            contrast={vm.meshGradientDefaults.contrast}
                            speed={vm.meshGradientDefaults.speed}
                            colors={vm.gradientColors}
                            frequency={vm.meshGradientDefaults.frequency}
                            amplitude={vm.meshGradientDefaults.amplitude}
                            style={style.meshGradient}
                        />
                    )}
                </Animated.View>
            )}
            <SquircleView cornerSmoothing={100} preserveSmoothing style={{
                borderRadius: 28,
                marginTop: -70,
                backgroundColor: vm.colors.background,
            }}>

                <View style={vm.common.screenPadding}>
                    <View style={[vm.common.row, { marginTop: -40, gap: 12, alignItems: 'stretch' }]}>
                        {vm.threedEmoji ? (
                            <>
                                <Pressable
                                    onLongPress={vm.showAvatarPreview}
                                    onPressOut={vm.hideAvatarPreview}
                                    delayLongPress={200}
                                >
                                    <DynamicAvatar
                                        uri={vm.currentAvatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                        threedEmoji={vm.threedEmoji}
                                        styles={vm.common.avatarLarge}
                                    />
                                </Pressable>
                                <QuickPreviewModal
                                    visible={vm.avatarPreviewVisible}
                                    imageUrl={vm.currentAvatar}
                                    onClose={vm.hideAvatarPreview}
                                />
                            </>
                        ) : vm.currentAvatar ? (
                            <Galeria urls={[vm.currentAvatar]}>
                                <Galeria.Image>
                                    <Image
                                        source={{ uri: vm.currentAvatar }}
                                        resizeMode="cover"
                                        style={vm.common.avatarLarge}
                                    />
                                </Galeria.Image>
                            </Galeria>
                        ) : vm.genderFallbackSource ? (
                            <FastImage
                                source={vm.genderFallbackSource}
                                resizeMode={FastImage.resizeMode.cover}
                                style={vm.common.avatarLarge}
                            />
                        ) : (
                            <FastImage
                                source={{ uri: "https://cdn-icons-png.flaticon.com/512/149/149071.png" }}
                                resizeMode={FastImage.resizeMode.cover}
                                style={vm.common.avatarLarge}
                            />
                        )}
                        <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 10 }}>
                            <View style={[vm.common.row, { gap: 4 }]}>
                                <Text style={[vm.common.heading, { fontWeight: '700' }]}>{profile?.name || "Boy not found"}</Text>
                                {profile?.is_verified && <VerifiedIcon size={14} backgroundColor={vm.colors.verify} />}
                                {vm.flagCode && <CountryFlag isoCode={vm.flagCode} size={12} style={{ borderRadius: 2, marginLeft: 4 }} />}
                            </View>
                            <View style={[vm.common.row, { gap: 6, marginTop: 2 }]}>
                                <Text style={vm.common.bodySmall}>
                                    <Text style={{ fontWeight: '700' }}>{imageCount}</Text> images
                                </Text>
                                <Text style={[vm.common.bodySmall, { color: vm.colors.muted }]}>·</Text>
                                <Text style={vm.common.bodySmall}>
                                    <Text style={{ fontWeight: '700' }}>{videoCount}</Text> videos
                                </Text>
                                <Text style={[vm.common.bodySmall, { color: vm.colors.muted }]}>·</Text>
                                <Text style={vm.common.bodySmall}>
                                    <Text style={{ fontWeight: '700' }}>{postCount}</Text> posts
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View>
                        {profile?.username && (
                            <Text style={[{ fontSize: 12, marginTop: 8, fontWeight: '700', color: vm.colors.text }]}>
                                @{profile.username}
                            </Text>
                        )}
                        {profile?.pronouns && (
                            <Text style={[vm.common.muted, { fontSize: 12, marginTop: 8 }]}>
                                {profile.pronouns}
                            </Text>
                        )}
                        {profile?.bio && (
                            <Text style={[vm.common.bodySmall, { paddingTop: 8 }]}>
                                {profile.bio}
                            </Text>
                        )}

                        {/* Action buttons — FProfile style */}
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
                            <SquircleView cornerSmoothing={100} preserveSmoothing borderRadius={8}
                                style={{ flex: 1, backgroundColor: '#1877F2' }}>
                                <TouchableOpacity style={{ borderRadius: 8, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, flex: 1 }}>
                                    <HeartAngleBold size={22} color="#fff" />
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Add love</Text>
                                </TouchableOpacity>
                            </SquircleView>
                            <SquircleView cornerSmoothing={100} preserveSmoothing borderRadius={8}
                                style={{ flex: 1, backgroundColor: vm.colors.card }}>
                                <TouchableOpacity
                                    onPress={() => briefSheetRef?.current?.present()}
                                    style={{ borderRadius: 8, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, flex: 1 }}
                                >
                                    <ChatSquareLikeBold size={22} color={vm.colors.text} />
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: vm.colors.text }}>Know me</Text>
                                </TouchableOpacity>
                            </SquircleView>
                        </View>

                        {/* Family stacked avatars — FProfile style */}
                        {profile?.loved_ones && profile.loved_ones.length > 0 && (
                            <TouchableOpacity
                                onPress={() => familySheetRef?.current?.present()}
                                activeOpacity={0.7}
                                style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 10 }}
                            >
                                <View style={{ flexDirection: 'row' }}>
                                    {profile.loved_ones.slice(0, 4).map((person, i) => (
                                            <View
                                                key={`fam-${i}`}
                                                style={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: 18,
                                                    overflow: 'hidden',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    marginLeft: i === 0 ? 0 : -10,
                                                    borderWidth: 2,
                                                    borderColor: vm.colors.background,
                                                    zIndex: 10 - i,
                                                }}
                                            >
                                                <Image
                                                    source={getFamilyAvatarSource(person.label)}
                                                    style={{ width: 36, height: 36 }}
                                                    resizeMode="cover"
                                                />
                                            </View>
                                        ))}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: vm.colors.text }} numberOfLines={1}>
                                        {profile.loved_ones.length} family member{profile.loved_ones.length > 1 ? 's' : ''}
                                    </Text>
                                </View>
                                <HeartBold size={18} color={vm.colors.muted} />
                            </TouchableOpacity>
                        )}

                        <ScrollView
                            style={{ marginTop: 16, marginHorizontal: -16 }}
                            contentContainerStyle={{ paddingHorizontal: 16 }}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                        >

                            {profile?.birthday && (
                                <BirthdayCard birthday={profile.birthday} />
                            )}
                            {vm.currentMusic && isMe && (
                                <TouchableOpacity
                                    onPress={() => musicSheetRef?.current?.present()}
                                    activeOpacity={0.9}
                                    style={{ height: 70, backgroundColor: vm.colors.card, width: 170, borderRadius: 100, overflow: "hidden", justifyContent: "space-between", alignItems: "center", flexDirection: "row", marginRight: 8 }}
                                >
                                    <FastImage
                                        source={{ uri: vm.currentMusic.cover_url }}
                                        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                                        resizeMode={FastImage.resizeMode.cover}
                                    />
                                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />
                                    <TouchableOpacity onPress={vm.toggleMusic} style={{ borderRadius: 999, padding: 6, backgroundColor: vm.colors.card, justifyContent: "center", alignItems: "center", marginLeft: 8 }}>
                                        {vm.isPlaying ? <PlayCircleBold size={20} color={vm.colors.text} /> : <PlayCircleOutline size={20} color={vm.colors.text} />}
                                    </TouchableOpacity>
                                    <Text numberOfLines={2} style={[vm.common.bodySmall, { marginLeft: 8, marginRight: 4, flex: 1, color: 'white' }]}>
                                        {vm.currentMusic.artist} - {vm.currentMusic.title}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {hasFacebook && profile && (
                                <TouchableOpacity
                                    onPress={() => {
                                        router.push({
                                            pathname: '/fprofile',
                                            params: { profile: JSON.stringify(profile) },
                                        });
                                    }}
                                    activeOpacity={0.9}
                                    style={{ height: 70, backgroundColor: '#1877F2', width: 170, borderRadius: 100, overflow: "hidden", justifyContent: "space-between", alignItems: "center", flexDirection: "row", marginRight: 8 }}
                                >
                                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginLeft: 12 }}>
                                        <Ionicons name="logo-facebook" size={22} color="#FFF" />
                                    </View>
                                    <Text numberOfLines={2} style={[vm.common.label, { marginHorizontal: 10, flex: 1, color: '#FFF' }]}>
                                        Facebook Profile
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {socialLinks && socialLinks.length > 0 && (
                                <TouchableOpacity
                                    onPress={() => socialSheetRef?.current?.present()}
                                    style={{ height: 70, backgroundColor: vm.colors.card, width: 170, borderRadius: 100, overflow: "hidden", justifyContent: "space-between", alignItems: "center", flexDirection: "row", marginRight: 8 }}
                                >
                                    <FastImage
                                        source={{ uri: "https://womendobusiness.eu/wp-content/uploads/social-media.jpg" }}
                                        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                                        resizeMode={FastImage.resizeMode.cover}
                                    />
                                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />
                                    <Text numberOfLines={2} style={[vm.common.label, { marginHorizontal: 10, flex: 1, color: 'white', textAlign: 'center' }]}>
                                        {socialLinks.length} social link{socialLinks.length > 1 ? 's' : ''}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {addresses && addresses.length > 0 && (
                                <TouchableOpacity
                                    onPress={() => addressSheetRef?.current?.present()}
                                    style={{ height: 70, backgroundColor: vm.colors.card, width: 170, borderRadius: 100, overflow: "hidden", justifyContent: "space-between", alignItems: "center", flexDirection: "row", marginRight: 8 }}
                                >
                                    <View style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, backgroundColor: vm.colors.text, opacity: 0.1 }} />
                                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: vm.colors.card, justifyContent: 'center', alignItems: 'center', marginLeft: 12 }}>
                                        <PointOnMapBold size={20} color={vm.colors.text} />
                                    </View>
                                    <Text numberOfLines={2} style={[vm.common.label, { marginHorizontal: 10, flex: 1 }]}>
                                        {addresses.length} address{addresses.length > 1 ? 'es' : ''}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {workplaces.length > 0 && (
                                <TouchableOpacity
                                    onPress={() => workplaceSheetRef?.current?.present()}
                                    style={{ height: 70, backgroundColor: vm.colors.card, width: 170, borderRadius: 100, overflow: "hidden", justifyContent: "space-between", alignItems: "center", flexDirection: "row", marginRight: 8 }}
                                >
                                    <View style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, backgroundColor: vm.colors.text, opacity: 0.1 }} />
                                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: vm.colors.card, justifyContent: 'center', alignItems: 'center', marginLeft: 12 }}>
                                        <CaseMinimalisticBold size={20} color={vm.colors.text} />
                                    </View>
                                    <Text numberOfLines={2} style={[vm.common.label, { marginHorizontal: 10, flex: 1 }]}>
                                        {workplaces.length} workplace{workplaces.length > 1 ? 's' : ''}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </ScrollView>

                        <View style={{ flexDirection: 'row', gap: 6, marginTop: 16, marginHorizontal: -16, paddingHorizontal: 16, paddingVertical: 8 }}>
                            {vm.tabs.map((tab) => {
                                const isActive = activeTab === tab.name;
                                const pt = vm.colors.pillTab;
                                return (
                                    <TouchableOpacity
                                        key={tab.name}
                                        onPress={tab.onClick}
                                        style={{
                                            paddingHorizontal: 16,
                                            paddingVertical: 6,
                                            borderRadius: 999,
                                            backgroundColor: isActive ? pt.activeBg : pt.inactiveBg,
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={{
                                            fontSize: 14,
                                            fontWeight: '600',
                                            color: isActive ? pt.activeText : pt.inactiveText,
                                        }}>
                                            {tab.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {tabContent}
                    </View>
                </View>
            </SquircleView>
        </>
    );
});

const componentStyles = (colors: any) =>
    StyleSheet.create({
        coverImage: {
            width: "100%",
            height: COVER_HEIGHT,
            overflow: 'hidden',
        },
        meshGradient: {
            flex: 1,
            height: '100%',
            width: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
        },
    });

export { COVER_HEIGHT };
export default ProfileHeader;
