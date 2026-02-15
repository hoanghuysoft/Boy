import { Ionicons } from '@expo/vector-icons';
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import React, { forwardRef, memo, useCallback } from "react";
import { FlatList, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TurboImage from 'react-native-turbo-image';
import { useThemeContext } from "../../../context/ThemeContext";
import { useAudioStore } from '../../../stores/audio';
import { createCommonStyles } from "../../../styles/common";
import { ProfileMusic } from '../../../types/profilemusic';

interface MusicSheetProps {
    data: ProfileMusic[];
    onEndReached?: () => void;
}

const MusicItem = memo(({
    item,
    colors,
    common,
}: {
    item: ProfileMusic,
    colors: any,
    common: any,
}) => {
    const { currentlyPlayingId, playTrack, stopPlayback } = useAudioStore();

    const trackId = `music-sheet-${item.id}`;
    const isPlaying = currentlyPlayingId === trackId;

    const toggleMusic = useCallback(() => {
        if (!item.preview_url) return;

        if (isPlaying) {
            stopPlayback();
        } else {
            playTrack(trackId, item.preview_url, {
                title: item.title,
                artist: item.artist,
                coverUrl: item.cover_url,
            });
        }
    }, [item, trackId, isPlaying, playTrack, stopPlayback]);

    const handleOpenLink = useCallback(() => {
        if (item.url) Linking.openURL(item.url);
    }, [item.url]);

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
                <TurboImage
                    source={{ uri: item.cover_url }}
                    style={styles.artwork}
                    resizeMode="cover"
                />
                {/* Overlay */}
                <View style={[StyleSheet.absoluteFill, styles.artworkOverlay]}>
                    <View style={[styles.playIconWrapper, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
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

export const MusicSheet = memo(forwardRef<TrueSheet, MusicSheetProps>(({ data, onEndReached }, ref) => {
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const inset = useSafeAreaInsets();
    const { stopPlayback } = useAudioStore();

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
            onDidDismiss={() => stopPlayback()}
        >
            <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 24 }}>

                {/* Header */}
                <View style={{ marginBottom: 24 }}>
                    <Text style={[common.heading, { fontSize: 24 }]}>Music</Text>
                    <Text style={[common.bodySmall, { color: colors.muted, marginTop: 4 }]}>
                        Listen to my favorite tracks
                    </Text>
                </View>

                {/* List */}
                <FlatList
                    nestedScrollEnabled={true}
                    onEndReached={onEndReached}
                    onEndReachedThreshold={0.5}
                    data={data}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <MusicItem
                            key={item.id}
                            item={item}
                            colors={colors}
                            common={common}
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