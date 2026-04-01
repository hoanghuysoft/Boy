import { XmarkSolid } from "@lineiconshq/free-icons";
import { Lineicons } from "@lineiconshq/react-native-lineicons";
import { MutedBold, Pip2Bold, VolumeLoudBold } from "@solar-icons/react-native";
import React from "react";
import {
  Animated,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

interface VideoTopBarProps {
  isLandscape: boolean;
  isMute: boolean;
  topBarTranslateY: Animated.Value;
  videoPressed: boolean;
  commonRowStyle: ViewStyle;
  onClose: () => void;
  onPipMode: () => void;
  onOpenExternal: () => void;
  onMuteToggle: () => void;
}

export const VideoTopBar: React.FC<VideoTopBarProps> = ({
  isLandscape,
  isMute,
  topBarTranslateY,
  videoPressed,
  commonRowStyle,
  onClose,
  onPipMode,
  onOpenExternal,
  onMuteToggle,
}) => {
  return (
    <Animated.View
      pointerEvents={videoPressed ? "box-none" : "none"}
      style={[
        commonRowStyle,
        {
          justifyContent: "space-between",
          paddingTop: isLandscape ? 30 : 16,
          paddingRight: isLandscape ? 32 : 0,
          transform: [{ translateY: topBarTranslateY }],
        },
      ]}
    >
      <View style={[commonRowStyle, { gap: 12 }]} pointerEvents="box-none">
        <TouchableOpacity hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} onPress={onClose} style={styles.smallButton}>
          <Lineicons icon={XmarkSolid} size={24} color={"white"} strokeWidth={3} />
        </TouchableOpacity>
        <TouchableOpacity hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} style={styles.smallButton} onPress={onPipMode}>
          <Pip2Bold size={20} color={"white"} />
        </TouchableOpacity>
      </View>
      <View style={[commonRowStyle, { gap: 12 }]} pointerEvents="box-none">
        {/* <TouchableOpacity hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} style={styles.smallButton} onPress={onOpenExternal}>
          <MaterialIcons name="open-in-new" size={20} color={"white"} />
        </TouchableOpacity> */}
        <TouchableOpacity hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} style={styles.smallButton} onPress={onMuteToggle}>
          {isMute ? (
            <MutedBold size={20} color={"white"} />
          ) : (
            <VolumeLoudBold size={20} color={"white"} />
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  smallButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
});
