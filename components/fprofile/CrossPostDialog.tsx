import { FlexText } from "@/components/FlexText";
import { useThemeContext } from "@/context/ThemeContext";
import { createCommonStyles } from "@/styles/common";
import { Post } from "@/types/post";
import { Profile } from "@/types/profile";
import { ProfileDetail } from "@/types/profiledetail";
import { Image as ExpoImage } from "expo-image";
import { Button } from "heroui-native/button";
import { Dialog } from "heroui-native/dialog";
import { Spinner } from "heroui-native/spinner";
import { useToast } from "heroui-native/toast";
import React, { memo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { FALLBACK_AVATAR_URL } from "../profile/header/constants";
import { CrossPostMode, executeCrossPost } from "./crossPostService";

export interface CrossPostDialogProps {
  post: Post | null;
  targetProfile?: Profile | ProfileDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (createdPost: Post) => void;
}

export const CrossPostDialog = memo(
  ({
    post,
    targetProfile,
    isOpen,
    onClose,
    onSuccess,
  }: CrossPostDialogProps) => {
    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const { toast } = useToast();

    const [isExecuting, setIsExecuting] = useState(false);
    const [progressStatus, setProgressStatus] = useState<string>("");

    if (!post) return null;

    const targetProfileId = targetProfile?.id;

    const handleSelectMode = async (mode: CrossPostMode) => {
      if (!targetProfileId) {
        toast.show({
          label: "Error",
          description: "Target profile is not loaded yet.",
          variant: "danger",
        });
        return;
      }

      setIsExecuting(true);
      setProgressStatus("Cross-posting...");

      try {
        const createdPost = await executeCrossPost(
          targetProfileId,
          post,
          mode,
          (progress) => {
            setProgressStatus(progress.statusText);
          }
        );

        toast.show({
          label: "Cross-posted Successfully",
          description: `Post published as ${targetProfile?.name || "profile"}.`,
          variant: "success",
        });

        setIsExecuting(false);
        onSuccess?.(createdPost);
        onClose();
      } catch (error: any) {
        console.error("Cross-post failed:", error);
        toast.show({
          label: "Cross-post Failed",
          description: error.message || "Failed to create post.",
          variant: "danger",
        });
        setIsExecuting(false);
      }
    };

    return (
      <Dialog isOpen={isOpen} onOpenChange={(open) => !open && !isExecuting && onClose()}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            {!isExecuting && <Dialog.Close />}

            <View style={{ marginBottom: 16, gap: 6 }}>
              <Dialog.Title>Cross-post</Dialog.Title>
              <Dialog.Description>
                Choose how to share this post to WeLove
              </Dialog.Description>
            </View>

            {/* Target Profile Identity */}
            {targetProfile && !isExecuting && (
              <View style={styles.profileRow}>
                <ExpoImage
                  source={{ uri: targetProfile.avatar_url || FALLBACK_AVATAR_URL }}
                  style={styles.profileAvatar}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <FlexText style={[common.caption, { color: colors.muted, fontSize: 11 }]}>
                    Posting to profile
                  </FlexText>
                  <FlexText
                    style={[common.bodySmall, { fontWeight: "700", color: colors.text }]}
                    numberOfLines={1}
                  >
                    {targetProfile.name}
                  </FlexText>
                </View>
              </View>
            )}

            {isExecuting ? (
              <View style={{ paddingVertical: 16, alignItems: "center", gap: 10 }}>
                <Spinner size="md" color={colors.primary} />
                <FlexText style={[common.bodySmall, { color: colors.muted }]}>
                  {progressStatus || "Publishing..."}
                </FlexText>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                <Button
                  variant="primary"
                  onPress={() => handleSelectMode("x_url")}
                >
                  Use media URL of X
                </Button>
                <Button
                  variant="outline"
                  onPress={() => handleSelectMode("third_party")}
                >
                  Upload media to third party
                </Button>
                <Button
                  variant="outline"
                  onPress={() => handleSelectMode("welove_cloud")}
                >
                  Use WeLove Cloud
                </Button>
              </View>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    );
  }
);

CrossPostDialog.displayName = "CrossPostDialog";

const styles = StyleSheet.create({
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 16,
  },
  profileAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});
