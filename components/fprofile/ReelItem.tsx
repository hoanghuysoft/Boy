import { FBVideoList } from '@/types/localfb';
import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import {
    Dimensions,
    Linking,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { FlexText } from '../FlexText';
import CachedImage from './CachedImage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const REEL_COLUMNS = 3;
const REEL_GAP = 2;
const REEL_WIDTH = (SCREEN_WIDTH - REEL_GAP * (REEL_COLUMNS - 1)) / REEL_COLUMNS;
const REEL_HEIGHT = REEL_WIDTH * 1.5;

const ReelItem: React.FC<{
    item: FBVideoList[0];
    formatDuration: (seconds: number) => string;
    formatCount: (count: number) => string;
}> = ({ item, formatDuration, formatCount }) => (
    <TouchableOpacity
        style={styles.reelItem}
        activeOpacity={0.85}
        onPress={() => { if (item.url) Linking.openURL(item.url); }}
    >
        <CachedImage uri={item.picture} style={styles.reelThumbnail} resizeMode="cover" />
        <View style={styles.durationBadge}>
            <FlexText style={styles.durationText}>{formatDuration(item.length)}</FlexText>
        </View>
        {item.statistics.play_count > 0 && (
            <View style={styles.playCountBadge}>
                <Ionicons name="play" size={10} color="#FFF" />
                <FlexText style={styles.playCountText}>{formatCount(item.statistics.play_count)}</FlexText>
            </View>
        )}
        <View style={styles.playOverlay}>
            <Ionicons name="play" size={24} color="rgba(255,255,255,0.9)" />
        </View>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    reelItem: {
        width: REEL_WIDTH,
        height: REEL_HEIGHT,
        position: 'relative',
        marginBottom: 1,
    },
    reelThumbnail: {
        width: '100%',
        height: '100%',
    },
    durationBadge: {
        position: 'absolute',
        bottom: 6,
        right: 6,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    durationText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '600',
    },
    playCountBadge: {
        position: 'absolute',
        bottom: 6,
        left: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    playCountText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '600',
    },
    playOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export const MemoReelItem = memo(ReelItem);
export default ReelItem;
