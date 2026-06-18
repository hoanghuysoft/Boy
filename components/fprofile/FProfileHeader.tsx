import { Profile } from '@/types/profile';
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { LinearGradient } from 'expo-linear-gradient';
import { SquircleView } from 'expo-squircle-view';
import React, { memo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { FlexText } from '../FlexText';
import CachedImage from './CachedImage';

const COVER_HEIGHT = 190;
const AVATAR_SIZE = 104;
const AVATAR_BORDER = 4;

interface FProfileHeaderProps {
    profile: Profile;
    fbColors: any;
    insetsTop: number;
    postCount: number;
    photoCount: number;
    videoCount: number;
    onBack: () => void;
}

const FProfileHeader: React.FC<FProfileHeaderProps> = ({
    profile, fbColors: c, insetsTop, postCount, photoCount, videoCount, onBack,
}) => {
    return (
        <View>
            {/* Cover Photo */}
            <View style={styles.coverContainer}>
                {profile.cover_url ? (
                    <CachedImage uri={profile.cover_url} style={styles.coverImage} resizeMode="cover" />
                ) : (
                    <View style={[styles.coverImage, { backgroundColor: c.buttonGrayBg }]} />
                )}
                <LinearGradient
                    colors={[c.headerOverlay, c.headerOverlayEnd]}
                    style={[styles.headerOverlay, { paddingTop: insetsTop + 8 }]}
                >
                    <TouchableOpacity onPress={onBack} style={styles.headerButton} activeOpacity={0.7}>
                        <Ionicons name="chevron-back" size={28} color={c.white} />
                    </TouchableOpacity>
                    <View style={styles.headerRight}>
                        <TouchableOpacity style={styles.headerButton} activeOpacity={0.7}>
                            <Ionicons name="search-outline" size={22} color={c.white} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.headerButton} activeOpacity={0.7}>
                            <Ionicons name="ellipsis-horizontal" size={22} color={c.white} />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </View>

            {/* Main Content Card */}
            <View style={[styles.contentContainer, { backgroundColor: c.contentBg }]}>
                <View style={styles.avatarRow}>
                    <View style={[styles.avatarWrapper, { borderColor: c.avatarBorder }]}>
                        <CachedImage
                            uri={profile.avatar_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                            style={styles.avatarImage}
                            resizeMode="cover"
                        />
                    </View>
                    <View style={styles.nameContainer}>
                        <FlexText style={[styles.nameText, { color: c.primaryText }]}>{profile.name}</FlexText>
                        <FlexText style={[styles.statsText, { color: c.secondaryText }]}>
                            <FlexText style={[styles.statBold, { color: c.primaryText }]}>{postCount}</FlexText>
                            {' posts · '}
                            <FlexText style={[styles.statBold, { color: c.primaryText }]}>{photoCount}</FlexText>
                            {' photos · '}
                            <FlexText style={[styles.statBold, { color: c.primaryText }]}>{videoCount}</FlexText>
                            {' videos'}
                        </FlexText>
                    </View>
                </View>

                <View style={styles.bioSection}>
                    {profile.pronouns && (
                        <FlexText style={[styles.subtitleText, { color: c.secondaryText }]}>
                            {profile.pronouns}
                            {profile.username ? ` · @${profile.username}` : ''}
                        </FlexText>
                    )}
                    {profile.bio && (
                        <FlexText style={[styles.bioText, { color: c.primaryText }]}>{profile.bio}</FlexText>
                    )}
                </View>

                <View style={styles.badgesContainer}>
                    {profile.hometown && (
                        <View style={styles.badge}>
                            <Ionicons name="location" size={18} color={c.primaryText} />
                            <FlexText style={[styles.badgeText, { color: c.primaryText }]} numberOfLines={1}>
                                {profile.hometown}
                            </FlexText>
                        </View>
                    )}
                </View>

                <View style={styles.actionsRow}>
                    <SquircleView cornerSmoothing={100} preserveSmoothing borderRadius={8}
                        style={[styles.actionButtonFlex, { backgroundColor: c.buttonBlueBg }]}>
                        <TouchableOpacity style={[styles.actionButton, { flex: 1 }]}>
                            <Ionicons name="person-add" size={24} color={c.white} />
                            <FlexText style={[styles.actionButtonText, { color: c.white }]}>Add friend</FlexText>
                        </TouchableOpacity>
                    </SquircleView>
                    <SquircleView cornerSmoothing={100} preserveSmoothing borderRadius={8}
                        style={[styles.actionButtonFlex, { backgroundColor: c.buttonGrayBg }]}>
                        <TouchableOpacity style={[styles.actionButton, { flex: 1 }]}>
                            <Ionicons name="chatbubble-ellipses" size={24} color={c.primaryText} />
                            <FlexText style={[styles.actionButtonText, { color: c.primaryText }]}>Message</FlexText>
                        </TouchableOpacity>
                    </SquircleView>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    coverContainer: { height: COVER_HEIGHT, width: '100%', position: 'relative' },
    coverImage: { width: '100%', height: '100%' },
    headerOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0,
        paddingHorizontal: 8, paddingBottom: 12,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    headerButton: { padding: 6, borderRadius: 999 },
    headerRight: { flexDirection: 'row', gap: 16 },
    contentContainer: { borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -28, paddingBottom: 0 },
    avatarRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 4 },
    avatarWrapper: {
        marginTop: -26, width: AVATAR_SIZE, height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2, borderWidth: AVATAR_BORDER, overflow: 'hidden',
    },
    avatarImage: { width: '100%', height: '100%', borderRadius: AVATAR_SIZE / 2 },
    nameContainer: { marginLeft: 16, marginTop: 4, justifyContent: 'center', flex: 1 },
    nameText: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
    statsText: { fontSize: 13, marginTop: 4, lineHeight: 20 },
    statBold: { fontWeight: '600' },
    bioSection: { paddingHorizontal: 16, gap: 6 },
    subtitleText: { fontSize: 13 },
    bioText: { fontSize: 15, lineHeight: 21 },
    badgesContainer: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 16, rowGap: 8,
        paddingHorizontal: 16, marginTop: 10,
    },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
    badgeText: { fontSize: 14, fontWeight: '600', flexShrink: 1 },
    actionsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 10 },
    actionButton: {
        borderRadius: 8, paddingVertical: 6,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    },
    actionButtonFlex: { flex: 1 },
    actionButtonText: { fontSize: 15, fontWeight: '600' },
});

export default memo(FProfileHeader);
