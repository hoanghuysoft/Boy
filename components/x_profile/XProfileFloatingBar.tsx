import { useThemeContext } from "@/context/ThemeContext";
import type { FxTwitterUser } from "@/services/fxtwitter/types";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { BlurView } from "expo-blur";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import { useToast } from "heroui-native/toast";
import React, { memo } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Reanimated from "react-native-reanimated";

const FALLBACK_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

export interface XProfileFloatingBarProps {
  topInset: number;
  user?: FxTwitterUser | null;
  blurTargetRef: any;
  headerAvatarContainerStyle: any;
  onScrollToTop: () => void;
}

export const XProfileFloatingBar = memo(function XProfileFloatingBar({
  topInset,
  user,
  blurTargetRef,
  headerAvatarContainerStyle,
  onScrollToTop,
}: XProfileFloatingBarProps) {
  const router = useRouter();
  const { colors, theme } = useThemeContext();
  const { toast } = useToast();

  const handleShare = () => {
    if (user?.screen_name) {
      Clipboard.setStringAsync(`https://x.com/${user.screen_name}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.show({
        label: "Profile link copied",
        description: `https://x.com/${user.screen_name}`,
        variant: "success",
      });
    }
  };

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          top: topInset + 8,
        },
      ]}
    >
      <View pointerEvents="box-none" style={styles.contentRow}>
        {/* Back Button */}
        <BlurView
          tint={theme === "dark" ? "systemMaterialDark" : "systemMaterialLight"}
          intensity={80}
          blurTarget={blurTargetRef}
          blurMethod="dimezisBlurViewSdk31Plus"
          style={styles.blurCircle}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.buttonTouch}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </BlurView>

        {/* Header Avatar — springs in when scrolled past profile avatar */}
        <Reanimated.View
          style={[
            styles.avatarSpringWrapper,
            headerAvatarContainerStyle,
          ]}
        >
          <TouchableOpacity activeOpacity={0.8} onPress={onScrollToTop}>
            <View style={styles.avatarInner}>
              <ExpoImage
                source={{ uri: user?.avatar_url || FALLBACK_AVATAR }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
            </View>
          </TouchableOpacity>
        </Reanimated.View>

        {/* Spacer */}
        <View style={{ flex: 1 }} pointerEvents="none" />

        {/* Share Button */}
        <BlurView
          tint={theme === "dark" ? "systemMaterialDark" : "systemMaterialLight"}
          intensity={80}
          blurTarget={blurTargetRef}
          blurMethod="dimezisBlurViewSdk31Plus"
          style={styles.blurCircle}
        >
          <TouchableOpacity
            onPress={handleShare}
            style={styles.buttonTouch}
          >
            <Ionicons name="share-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </BlurView>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 1,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  blurCircle: {
    borderRadius: 999,
    overflow: "hidden",
  },
  buttonTouch: {
    borderRadius: 999,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarSpringWrapper: {
    width: 40,
    height: 40,
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInner: {
    width: 40,
    height: 40,
    borderRadius: 999,
    overflow: "hidden",
  },
});

