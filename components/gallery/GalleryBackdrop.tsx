import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Easing, StyleSheet, View } from 'react-native';
import { easeGradient } from 'react-native-easing-gradient';

const topScrim = easeGradient({
    colorStops: {
        0: { color: 'rgba(0, 0, 0, 0.92)' },
        0.35: { color: 'rgba(0, 0, 0, 0.55)', easing: Easing.out(Easing.cubic) },
        1: { color: 'rgba(0, 0, 0, 0)' },
    },
    extraColorStopsPerTransition: 8,
});

const bottomScrim = easeGradient({
    colorStops: {
        0: { color: 'rgba(0, 0, 0, 0.96)' },
        0.35: { color: 'rgba(0, 0, 0, 0.65)', easing: Easing.out(Easing.cubic) },
        1: { color: 'rgba(0, 0, 0, 0)' },
    },
    extraColorStopsPerTransition: 8,
});

export interface GalleryBackdropProps {
    blurhash: string;
    transition?: number;
}

export const GalleryBackdrop: React.FC<GalleryBackdropProps> = ({
    blurhash,
    transition = 450,
}) => {
    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <ExpoImage
                source={{ blurhash }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={transition}
            />
            <View style={[StyleSheet.absoluteFill, styles.baseDim]} />
            <LinearGradient
                pointerEvents="none"
                colors={topScrim.colors as [string, string, ...string[]]}
                locations={topScrim.locations as [number, number, ...number[]]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.topScrim}
            />
            <LinearGradient
                pointerEvents="none"
                colors={bottomScrim.colors as [string, string, ...string[]]}
                locations={bottomScrim.locations as [number, number, ...number[]]}
                start={{ x: 0.5, y: 1 }}
                end={{ x: 0.5, y: 0 }}
                style={styles.bottomScrim}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    baseDim: {
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
    },
    topScrim: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '30%',
    },
    bottomScrim: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '34%',
    },
});

export default GalleryBackdrop;
