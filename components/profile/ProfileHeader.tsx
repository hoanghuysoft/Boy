import VerifiedIcon from '@/icons/verified';
import { getTiktokProfile } from '@/services/tiktok';
import FastImage from '@d11/react-native-fast-image';
import { Ionicons } from '@expo/vector-icons';
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { Galeria } from '@nandorojo/galeria';
import { useAudioPlayer } from 'expo-audio';
import React, { memo, useCallback, useMemo, useState } from "react";
import {
    Animated,
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { useThemeContext } from "../../context/ThemeContext";
import { createCommonStyles } from "../../styles/common";
import { ProfileAddress } from "../../types/profileaddress";
import { ProfileDetail } from "../../types/profiledetail";
import { ProfileLink } from "../../types/profilelink";
import { ProfileMusic } from "../../types/profilemusic";
import { Workplace } from "../../types/profileworplace";
import { TabPillGroup } from "../tabpill";
import BirthdayCard from './BirthdayCard';


const COVER_HEIGHT = 250;
const { height } = Dimensions.get("window");

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
    onMusicEndReached,
    onSocialEndReached,
    onAddressesEndReached,
    onWorkplacesEndReached,
}) => {
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const style = styles(colors);
    const [isPlaying, setIsPlaying] = useState(false);

    const coverTranslateY = scrollY.interpolate({
        inputRange: [0, COVER_HEIGHT],
        outputRange: [0, COVER_HEIGHT * 0.5],
        extrapolate: "clamp",
    });

    const currentMusic = music?.[0];
    const currentAvatar = profile?.avatar_url;
    const player = useAudioPlayer(currentMusic?.preview_url ? { uri: currentMusic.preview_url } : null);

    const handleInfoTab = useCallback(() => onTabChange("Information"), [onTabChange]);
    const handleImagesTab = useCallback(() => onTabChange("Images"), [onTabChange]);
    const handleVideosTab = useCallback(() => onTabChange("Videos"), [onTabChange]);
    const handleFeedTab = useCallback(() => onTabChange("Feed"), [onTabChange]);

    const toggleMusic = useCallback(() => {
        const isAtEnd = player.duration > 0 && (player.duration - player.currentTime < 0.2);

        if (isAtEnd) {
            player.seekTo(0);
            player.play();
            setIsPlaying(true);
            return;
        }

        if (player.playing) {
            player.pause();
            setIsPlaying(false);
        } else {
            player.play();
            setIsPlaying(true);
        }
    }, [player, setIsPlaying]);

    const testTiktokProfile = async () => {
        const res = await getTiktokProfile("dreww_ohi7")
    }

    const tabs = useMemo(() => [
        { name: "Images", onClick: handleImagesTab },
        { name: "Videos", onClick: handleVideosTab },
        { name: "Feed", onClick: handleFeedTab },
        { name: "Information", onClick: handleInfoTab },
    ], [handleInfoTab, handleImagesTab, handleVideosTab, handleFeedTab]);

    return (
        <>
            <Animated.Image
                source={{
                    uri: profile?.cover_url || "https://pbs.twimg.com/media/GeMS4yjWIAA14OG.jpg",
                    cache: 'force-cache'
                }}
                style={[
                    style.coverImage,
                    {
                        transform: [{ translateY: coverTranslateY }],
                    },
                ]}
                resizeMode="cover"
            />
            <View style={{
                borderRadius: 8,
                marginTop: -8,
                backgroundColor: colors.background,
            }}>

                <View style={common.screenPadding}>
                    <View style={[common.row, { marginTop: -55, gap: 5 }]}>
                        <Galeria urls={currentAvatar ? [currentAvatar] : []}>
                            <Galeria.Image>
                                <Image
                                    source={{
                                        uri: currentAvatar || "https://via.placeholder.com/150",
                                    }}
                                    resizeMode="cover"
                                    style={common.avatarLarge}
                                />
                            </Galeria.Image>
                        </Galeria>
                    </View>
                    <View>
                        <View style={[common.row, { gap: 2, marginTop: 8 }]}>
                            <Text style={common.heading}>{profile?.name || "Boy not found"}</Text>
                            {profile?.is_verified && <VerifiedIcon size={18} backgroundColor={colors.verify} />}
                        </View>
                        {profile?.pronouns && (
                            <Text style={[common.muted, { fontSize: 12 }]}>
                                {profile.pronouns}
                            </Text>
                        )}
                        {profile?.bio && (
                            <Text style={[common.bodySmall, { paddingTop: 8 }]}>
                                {profile.bio}
                            </Text>
                        )}
                        {/* <Button mode="contained" onPress={testTiktokProfile}>
                            Chat
                        </Button> */}
                        <ScrollView
                            style={{ marginTop: 16, marginHorizontal: -16 }}
                            contentContainerStyle={{ paddingHorizontal: 16 }}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                        >

                            {profile?.birthday && (
                                <BirthdayCard birthday={profile.birthday} />
                            )}
                            {currentMusic && (
                                <TouchableOpacity
                                    onPress={() => musicSheetRef?.current?.present()}
                                    activeOpacity={0.9}
                                    style={{ height: 70, backgroundColor: colors.card, width: 170, borderRadius: 100, overflow: "hidden", justifyContent: "space-between", alignItems: "center", flexDirection: "row", marginRight: 8 }}
                                >
                                    <FastImage
                                        source={{ uri: currentMusic.cover_url }}
                                        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                                        resizeMode={FastImage.resizeMode.cover}
                                    />
                                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />
                                    <TouchableOpacity onPress={toggleMusic} style={{ borderRadius: 999, padding: 6, backgroundColor: colors.card, justifyContent: "center", alignItems: "center", marginLeft: 8 }}>
                                        <Ionicons
                                            name={isPlaying ? 'musical-notes' : 'musical-notes-outline'}
                                            size={20}
                                            color={theme === "dark" ? "white" : "black"}
                                        />
                                    </TouchableOpacity>
                                    <Text numberOfLines={2} style={[common.bodySmall, { marginLeft: 8, marginRight: 4, flex: 1, color: 'white' }]}>
                                        {currentMusic.artist} - {currentMusic.title}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {socialLinks && socialLinks.length > 0 && (
                                <TouchableOpacity
                                    onPress={() => socialSheetRef?.current?.present()}
                                    style={{ height: 70, backgroundColor: colors.card, width: 170, borderRadius: 100, overflow: "hidden", justifyContent: "space-between", alignItems: "center", flexDirection: "row", marginRight: 8 }}
                                >
                                    <FastImage
                                        source={{ uri: "https://womendobusiness.eu/wp-content/uploads/social-media.jpg", }}
                                        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                                        resizeMode={FastImage.resizeMode.cover}
                                    />
                                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />
                                    <Text numberOfLines={2} style={[common.label, { marginHorizontal: 10, flex: 1, color: 'white', textAlign: 'center' }]}>
                                        {socialLinks.length} social link{socialLinks.length > 1 ? 's' : ''}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {addresses && addresses.length > 0 && (
                                <TouchableOpacity
                                    onPress={() => addressSheetRef?.current?.present()}
                                    style={{ height: 70, backgroundColor: colors.card, width: 170, borderRadius: 100, overflow: "hidden", justifyContent: "space-between", alignItems: "center", flexDirection: "row", marginRight: 8 }}
                                >
                                    <View style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, backgroundColor: colors.text, opacity: 0.1 }} />
                                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center', marginLeft: 12 }}>
                                        <Ionicons name="location" size={20} color={colors.text} />
                                    </View>
                                    <Text numberOfLines={2} style={[common.label, { marginHorizontal: 10, flex: 1 }]}>
                                        {addresses.length} address{addresses.length > 1 ? 'es' : ''}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {workplaces.length > 0 && (
                                <TouchableOpacity
                                    onPress={() => workplaceSheetRef?.current?.present()}
                                    style={{ height: 70, backgroundColor: colors.card, width: 170, borderRadius: 100, overflow: "hidden", justifyContent: "space-between", alignItems: "center", flexDirection: "row", marginRight: 8 }}
                                >
                                    <View style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, backgroundColor: colors.text, opacity: 0.1 }} />
                                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center', marginLeft: 12 }}>
                                        <Ionicons name="briefcase" size={20} color={colors.text} />
                                    </View>
                                    <Text numberOfLines={2} style={[common.label, { marginHorizontal: 10, flex: 1 }]}>
                                        {workplaces.length} workplace{workplaces.length > 1 ? 's' : ''}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </ScrollView>

                        <TabPillGroup
                            tabs={tabs}
                            activeTab={activeTab}
                            containerStyle={{ marginTop: 16, marginHorizontal: -16 }}
                            scrollViewStyle={{ paddingHorizontal: 16 }}
                            renderContent={false}
                        />

                        {tabContent}
                    </View>
                </View>
            </View>
        </>
    );
});

const styles = (colors: any) =>
    StyleSheet.create({
        coverImage: {
            width: "100%",
            height: COVER_HEIGHT,
        },
    });

export { COVER_HEIGHT };
export default ProfileHeader;

