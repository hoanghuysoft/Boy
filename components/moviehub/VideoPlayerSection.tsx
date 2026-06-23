import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { VideoView } from 'expo-video';
import Ionicons from '@react-native-vector-icons/ionicons/static';

interface VideoPlayerSectionProps {
  player: any;
  resolvedUri: string;
  posterUrl?: string;
  width: number;
  videoHeight: number;
}

export const VideoPlayerSection = ({
  player,
  resolvedUri,
  posterUrl,
  width,
  videoHeight,
}: VideoPlayerSectionProps) => {
  return (
    <View style={{ width, height: videoHeight, backgroundColor: "#000" }}>
      {resolvedUri ? (
        <VideoView
          player={player}
          style={{ width: "100%", height: "100%" }}
          nativeControls
        />
      ) : (
        <View style={styles.placeholderContainer}>
          {posterUrl ? (
            <ExpoImage
              source={{ uri: posterUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          ) : null}
          <View style={styles.loadingOverlay}>
            <Ionicons name="play-circle" size={56} color="rgba(255,255,255,0.7)" />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  placeholderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
});
