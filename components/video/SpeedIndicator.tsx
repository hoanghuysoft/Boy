import { MaterialIcons } from "@expo/vector-icons";
import {
  RewindForwardBold,
  RewindForwardBoldDuotone,
} from "@solar-icons/react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface SpeedIndicatorProps {
  playbackRate: number;
}

export const SpeedIndicator: React.FC<SpeedIndicatorProps> = ({
  playbackRate,
}) => {
  if (playbackRate <= 1) return null;

  return (
    <View style={styles.speedIndicator}>
      <View style={styles.speedBadge}>
        <RewindForwardBoldDuotone size={16} color="white" />
        <Text style={styles.speedText}>{playbackRate}x</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  speedIndicator: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 100,
  },
  speedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  speedText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});
