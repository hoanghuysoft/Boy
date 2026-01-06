import FastImage from '@d11/react-native-fast-image';
import { Ionicons } from '@expo/vector-icons';
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { useAudioPlayer } from 'expo-audio';
import React, { forwardRef, memo, useEffect, useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from "../../../context/ThemeContext";
import { createCommonStyles } from "../../../styles/common";
import { ProfileMusic } from '../../../types/profilemusic';

interface MusicSheetProps {
    data: ProfileMusic[];
}

const MusicItem = memo(({ item, colors, common, playingId, setPlayingId }: { item: ProfileMusic, colors: any, common: any, playingId: string | null, setPlayingId: (id: string | null) => void }) => {
    const player = useAudioPlayer({ uri: item.preview_url || "" });
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        if (playingId !== item.id && isPlaying) {
            player.pause();
            player.seekTo(0);
            setIsPlaying(false);
        }
    }, [playingId]);

    const toggleMusic = () => {
        if (!item.preview_url) return;

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

    return (
        <TouchableOpacity
            onPress={toggleMusic}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
        >
            <View style={{ width: 50, height: 50 }}>
                <FastImage
                    source={{ uri: item.cover_url }}
                    style={{ width: 50, height: 50, borderRadius: 8 }}
                />
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons
                        name={isPlaying ? 'pause' : 'play'}
                        size={20}
                        color="white"
                    />
                </View>
            </View>

            <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={common.heading}>{item.title}</Text>
                <Text style={common.bodySmall}>{item.artist}</Text>
            </View>

            <TouchableOpacity
                onPress={() => item.url && Linking.openURL(item.url)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Ionicons name="open-outline" size={20} color={colors.text} />
            </TouchableOpacity>
        </TouchableOpacity>
    );
});

export const MusicSheet = memo(forwardRef<TrueSheet, MusicSheetProps>(({ data }, ref) => {
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const inset = useSafeAreaInsets();
    const [playingId, setPlayingId] = useState<string | null>(null);

    return (
        <TrueSheet
            ref={ref}
            scrollable={true}
            cornerRadius={24}
            backgroundColor={theme === 'dark' ? colors.containerContent : 'white'}
            grabberOptions={{
                color: colors.text
            }}
            onDidDismiss={() => setPlayingId(null)}
        >
            <View style={{ flex: 1, padding: 24, paddingBottom: inset.bottom + 20 }}>
                <Text style={[common.heading, { marginBottom: 16 }]}>Music</Text>
                <ScrollView nestedScrollEnabled={true}>
                    {data.map((item) => (
                        <MusicItem
                            key={item.id}
                            item={item}
                            colors={colors}
                            common={common}
                            playingId={playingId}
                            setPlayingId={setPlayingId}
                        />
                    ))}
                </ScrollView>
            </View>
        </TrueSheet>
    );
}));
