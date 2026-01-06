import FastImage from '@d11/react-native-fast-image';
import { Ionicons } from '@expo/vector-icons';
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { useAudioPlayer } from 'expo-audio';
import React, { forwardRef, memo, useEffect, useState } from "react";
import { FlatList, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from "../../../context/ThemeContext";
import { createCommonStyles } from "../../../styles/common";
import { ProfileMusic } from '../../../types/profilemusic';

interface MusicSheetProps {
    data: ProfileMusic[];
}

const MusicItem = memo(({
    item,
    colors,
    common,
    playingId,
    setPlayingId
}: {
    item: ProfileMusic,
    colors: any,
    common: any,
    playingId: string | null,
    setPlayingId: (id: string | null) => void
}) => {
    const player = useAudioPlayer({ uri: item.preview_url || "" });
    const [isPlaying, setIsPlaying] = useState(false);

    // Watch for other tracks playing to auto-pause this one
    useEffect(() => {
        if (playingId !== item.id && isPlaying) {
            player.pause();
            player.seekTo(0);
            setIsPlaying(false);
        }
    }, [playingId]);

    const toggleMusic = () => {
        if (!item.preview_url) return;

        // Check if track finished
        const isAtEnd = player.duration > 0 && (player.duration - player.currentTime < 0.2);

        if (isAtEnd) {
            player.seekTo(0);
            player.play();
            setIsPlaying(true);
            setPlayingId(item.id);
            return;
        }

        if (isPlaying) {
            player.pause();
            setIsPlaying(false);
            setPlayingId(null);
        } else {
            player.play();
            setIsPlaying(true);
            setPlayingId(item.id);
        }
    };

    const handleOpenLink = () => {
        if (item.url) Linking.openURL(item.url);
    };

    return (
        <TouchableOpacity
            onPress={toggleMusic}
            activeOpacity={0.9}
            style={[
                styles.card
            ]}
        >
            {/* Album Art & Play Overlay */}
            <View style={styles.artworkContainer}>
                <FastImage
                    source={{ uri: item.cover_url }}
                    style={styles.artwork}
                    resizeMode={FastImage.resizeMode.cover}
                />
                {/* Overlay */}
                <View style={[StyleSheet.absoluteFill, styles.artworkOverlay]}>
                    <View style={[styles.playIconWrapper, { backgroundColor: isPlaying ? colors.primary : 'rgba(0,0,0,0.6)' }]}>
                        <Ionicons
                            name={isPlaying ? 'pause' : 'play'}
                            size={16}
                            color="#ffffff"
                            style={{ marginLeft: isPlaying ? 0 : 2 }} // Optical adjustment for play triangle
                        />
                    </View>
                </View>
            </View>

            {/* Text Info */}
            <View style={styles.textContainer}>
                <Text style={[common.heading, { fontSize: 16, marginBottom: 4 }]} numberOfLines={1}>
                    {item.title}
                </Text>
                <Text style={[common.bodySmall, { color: colors.muted }]} numberOfLines={1}>
                    {item.artist}
                </Text>
            </View>

            {/* External Link Button */}
            {item.url && (
                <TouchableOpacity
                    onPress={handleOpenLink}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.linkButton}
                >
                    <Ionicons name="open-outline" size={20} color={colors.muted} />
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );
});

export const MusicSheet = memo(forwardRef<TrueSheet, MusicSheetProps>(({ data }, ref) => {
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const inset = useSafeAreaInsets();
    const [playingId, setPlayingId] = useState<string | null>(null);

    // Safety check
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
            onDidDismiss={() => setPlayingId(null)}
        >
            <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 24 }}>

                {/* Header */}
                <View style={{ marginBottom: 24 }}>
                    <Text style={[common.heading, { fontSize: 24 }]}>Music</Text>
                    <Text style={[common.bodySmall, { color: colors.muted, marginTop: 4 }]}>
                        Listen to my latest tracks
                    </Text>
                </View>

                {/* List */}
                <FlatList
                    nestedScrollEnabled={true}
                    data={data}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <MusicItem
                            item={item}
                            colors={colors}
                            common={common}
                            playingId={playingId}
                            setPlayingId={setPlayingId}
                        />
                    )}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            </View>
        </TrueSheet>
    );
}));

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        marginBottom: 12,
    },
    artworkContainer: {
        width: 56,
        height: 56,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    artwork: {
        width: '100%',
        height: '100%',
    },
    artworkOverlay: {
        backgroundColor: 'rgba(0,0,0,0.1)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    playIconWrapper: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        backdropFilter: 'blur(10px)', // IOS only property, ignored on android but nice to have
    },
    textContainer: {
        marginLeft: 16,
        flex: 1,
        justifyContent: 'center',
    },
    linkButton: {
        padding: 8,
    }
});