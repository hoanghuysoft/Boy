import {
  PauseBold,
  PlayBold,
  Rewind5SecondsBackBold,
  Rewind5SecondsForwardBold,
} from "@solar-icons/react-native";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

interface VideoPlaybackControlsProps {
  isLandscape: boolean;
  isPaused: boolean;
  isLoading: boolean;
  videoPressed: boolean;
  commonRowStyle: ViewStyle;
  onMoveBackward: () => void;
  onTogglePlayPause: () => void;
  onMoveForward: () => void;
}

export const VideoPlaybackControls: React.FC<VideoPlaybackControlsProps> = ({
  isLandscape,
  isPaused,
  isLoading,
  videoPressed,
  commonRowStyle,
  onMoveBackward,
  onTogglePlayPause,
  onMoveForward,
}) => {
  return (
    <View
      pointerEvents={videoPressed ? "auto" : "none"}
      style={[
        commonRowStyle,
        {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          gap: isLandscape ? 64 : 48,
        },
      ]}
    >
      <TouchableOpacity onPress={onMoveBackward} style={styles.largeButton}>
        <Rewind5SecondsBackBold size={32} color={"white"} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onTogglePlayPause}
        style={styles.extraLargeButton}
      >
        {isLoading && <ActivityIndicator size="large" color="white" />}
        {!isLoading &&
          (isPaused ? (
            <PlayBold size={50} color="white" />
          ) : (
            <PauseBold size={50} color="white" />
          ))}
      </TouchableOpacity>
      <TouchableOpacity onPress={onMoveForward} style={styles.largeButton}>
        <Rewind5SecondsForwardBold size={32} color={"white"} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  largeButton: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  extraLargeButton: {
    width: 85,
    height: 85,
    borderRadius: 999,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
});
