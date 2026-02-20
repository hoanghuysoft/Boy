import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { CopyBold, DangerBold, ShareBold, TrashBinTrashBold } from "@solar-icons/react-native";
import React, { forwardRef, memo, useCallback } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeContext } from "../../context/ThemeContext";
import { useDeletePost } from "../../services/post";
import { createCommonStyles } from "../../styles/common";
import { Post } from "../../types/post";

// ============================================================================
// Types
// ============================================================================

interface PostOptionsSheetProps {
    post: Post | null;
    currentProfileId: string | null;
    onDeleted?: () => void;
}

interface OptionItemProps {
    icon: React.ComponentType<any>;
    label: string;
    onPress: () => void;
    destructive?: boolean;
    colors: any;
    common: any;
}

// ============================================================================
// OptionItem Component
// ============================================================================

const OptionItem = memo(({
    icon: Icon,
    label,
    onPress,
    destructive = false,
    colors,
    common,
}: OptionItemProps) => (
    <TouchableOpacity
        style={styles.optionItem}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <View style={[
            styles.iconContainer,
            { backgroundColor: destructive ? "#EF444420" : colors.card }
        ]}>
            <Icon
                size={24}
                color={destructive ? "#EF4444" : colors.text}
            />
        </View>
        <Text style={[
            common.body,
            { color: destructive ? "#EF4444" : colors.text, fontWeight: "680" }
        ]}>
            {label}
        </Text>
    </TouchableOpacity>
));

OptionItem.displayName = "OptionItem";

// ============================================================================
// PostOptionsSheet Component
// ============================================================================

export const PostOptionsSheet = memo(forwardRef<TrueSheet, PostOptionsSheetProps>(
    ({ post, currentProfileId, onDeleted }, ref) => {
        const { colors, typography, theme } = useThemeContext();
        const common = createCommonStyles(colors, typography);
        const insets = useSafeAreaInsets();

        const isOwner = post?.profile_id === currentProfileId;
        const deletePostMutation = useDeletePost(currentProfileId || "");

        const handleDelete = useCallback(() => {
            if (!post) return;

            Alert.alert(
                "Delete Post",
                "Are you sure you want to delete this post? This action cannot be undone.",
                [
                    {
                        text: "Cancel",
                        style: "cancel",
                    },
                    {
                        text: "Delete",
                        style: "destructive",
                        onPress: async () => {
                            try {
                                await deletePostMutation.mutateAsync({
                                    postId: post.id,
                                    deleteMedia: false, // Don't delete media by default
                                });

                                // Close sheet
                                if (ref && typeof ref !== "function" && ref.current) {
                                    ref.current.dismiss();
                                }

                                onDeleted?.();

                                Alert.alert("Success", "Post deleted successfully.");
                            } catch (error: any) {
                                Alert.alert(
                                    "Error",
                                    error.message || "Failed to delete post. Please try again."
                                );
                            }
                        },
                    },
                ]
            );
        }, [post, deletePostMutation, ref, onDeleted]);

        const handleReport = useCallback(() => {
            Alert.alert("Report", "Report feature coming soon!");
            if (ref && typeof ref !== "function" && ref.current) {
                ref.current.dismiss();
            }
        }, [ref]);

        const handleShare = useCallback(() => {
            Alert.alert("Share", "Share feature coming soon!");
            if (ref && typeof ref !== "function" && ref.current) {
                ref.current.dismiss();
            }
        }, [ref]);

        const handleCopyLink = useCallback(() => {
            Alert.alert("Copy Link", "Link copied to clipboard!");
            if (ref && typeof ref !== "function" && ref.current) {
                ref.current.dismiss();
            }
        }, [ref]);

        return (
            <TrueSheet
                ref={ref}
                backgroundColor={theme === "dark" ? colors.containerContent : "#ffffff"}
                grabberOptions={{
                    color: colors.muted || "#C4C4C4",
                    height: 4,
                    width: 32,
                }}
                detents={['auto']}
            >
                <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[common.heading]}>Post </Text>
                        <Text style={common.bodySmall}>Got something on your mind?</Text>
                    </View>

                    {/* Options List */}
                    <View style={styles.optionsList}>
                        <OptionItem
                            icon={ShareBold}
                            label="Share"
                            onPress={handleShare}
                            colors={colors}
                            common={common}
                        />

                        <OptionItem
                            icon={CopyBold}
                            label="Copy Link"
                            onPress={handleCopyLink}
                            colors={colors}
                            common={common}
                        />

                        {!isOwner && (
                            <OptionItem
                                icon={DangerBold}
                                label="Report"
                                onPress={handleReport}
                                colors={colors}
                                common={common}
                            />
                        )}

                        {isOwner && (
                            <OptionItem
                                icon={TrashBinTrashBold}
                                label="Delete Post"
                                onPress={handleDelete}
                                destructive
                                colors={colors}
                                common={common}
                            />
                        )}
                    </View>
                </View>
            </TrueSheet>
        );
    }
));

PostOptionsSheet.displayName = "PostOptionsSheet";

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    header: {
        marginBottom: 20,
        paddingTop: 10,
    },
    optionsList: {
    },
    optionItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        gap: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
    },
});
