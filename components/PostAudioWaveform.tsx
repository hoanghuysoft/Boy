import Ionicons from "@react-native-vector-icons/ionicons/static";
import { SquircleView } from 'expo-squircle-view';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSimpleAudio } from '../hooks/useSimpleAudio';
import { FlexText } from './FlexText';

interface PostAudioWaveformProps {
    postId: string;
    audioUrl: string;
    colors: {
        card: string;
        text: string;
        muted: string;
        divider: string;
        secondary?: string;
    };
    label?: string;
}

function formatDuration(secs: number): string {
    if (!secs || secs <= 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

export const PostAudioWaveform = React.memo(({
    postId,
    audioUrl,
    colors,
    label,
}: PostAudioWaveformProps) => {
    const { isPlaying, currentTime, duration, progress, toggle } = useSimpleAudio(audioUrl, {
        id: `post-audio-${postId}`,
    });

    const waveBackgroundColor = colors.divider;
    const waveProgressColor = colors.secondary ?? '#4285F4';

    return (
        <SquircleView cornerSmoothing={100} preserveSmoothing style={[styles.container, { backgroundColor: colors.card }]}>
            {/* Play / Pause Button */}
            <TouchableOpacity
                onPress={toggle}
                activeOpacity={0.7}
                style={[styles.playBtn, { backgroundColor: waveProgressColor }]}
            >
                <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={18}
                    color="#fff"
                    style={isPlaying ? undefined : { marginLeft: 2 }}
                />
            </TouchableOpacity>

            {/* Waveform + Time */}
            <View style={styles.waveWrapper}>
                <View style={[styles.iosFallbackTrack, { backgroundColor: waveBackgroundColor }]}>
                    <View
                        style={[
                            styles.iosFallbackFill,
                            { width: `${progress * 100}%` as any, backgroundColor: waveProgressColor },
                        ]}
                    />
                </View>

                {/* Duration label */}
                <FlexText style={[styles.timeLabel, { color: colors.muted }]}>
                    {isPlaying && duration > 0
                        ? `${formatDuration(currentTime)} / ${formatDuration(duration)}`
                        : formatDuration(duration > 0 ? duration : 0)}
                </FlexText>
            </View>
        </SquircleView>
    );
});

PostAudioWaveform.displayName = 'PostAudioWaveform';

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 10,
        marginBottom: 16,
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 12,
        // subtle elevation
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    playBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    waveWrapper: {
        flex: 1,
        gap: 4,
    },
    wave: {
        width: '100%',
        height: 48,
    },
    iosFallbackTrack: {
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E0E0E0',
        overflow: 'hidden',
        marginVertical: 22,
    },
    iosFallbackFill: {
        height: '100%',
        borderRadius: 2,
    },
    timeLabel: {
        fontSize: 11,
        fontVariant: ['tabular-nums'],
    },
});
