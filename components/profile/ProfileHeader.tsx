import VerifiedIcon from '@/icons/verified';
import FastImage from '@d11/react-native-fast-image';
import { MeshGradient } from '@kuss/react-native-mesh-gradient';
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { Galeria } from '@nandorojo/galeria';
import { CaseMinimalisticBold, PlayCircleBold, PlayCircleOutline, PointOnMapBold } from '@solar-icons/react-native';
import { SquircleView } from 'expo-squircle-view';
import React, { memo } from "react";
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
import { useProfileHeaderViewModel } from "../../viewmodels/ProfileHeaderViewModel";
import { TabPillGroup } from "../tabpill";
import BirthdayCard from './BirthdayCard';
import DynamicAvatar from './DynamicAvatar';
import ProfileBriefInfo from './ProfileBriefInfo';
import QuickPreviewModal from './QuickPreviewModal';

const COVER_HEIGHT = 250;
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

    const style = componentStyles(vm.colors);

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
                borderRadius: 8,
                marginTop: -8,
                backgroundColor: vm.colors.background,
            }}>

                <View style={vm.common.screenPadding}>
                    <View style={[vm.common.row, { marginTop: -55, gap: 12, alignItems: 'stretch' }]}>
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
                        <View style={{ flex: 1, paddingTop: 10, justifyContent: 'flex-end' }}>
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

                        <ProfileBriefInfo profile={profile} workplaces={workplaces} homeInfo={vm.homeInfo} />

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

                        <TabPillGroup
                            tabs={vm.tabs}
                            activeTab={activeTab}
                            containerStyle={{ marginTop: 16, marginHorizontal: -16 }}
                            scrollViewStyle={{ paddingHorizontal: 16 }}
                            renderContent={false}
                        />

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
