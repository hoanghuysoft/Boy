import EditIcon from "@/assets/images/svg/edit-1.svg";
import ImageAddIcon from "@/assets/images/svg/image-add.svg";
import SendIcon from "@/assets/images/svg/send.svg";
import { FlexText } from "@/components/FlexText";
import { EMOJI_ASSETS } from "@/utils/emojiResolver";
import { GiphyDialog, GiphyRating, GiphyThemePreset } from "@giphy/react-native-sdk";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import MaterialIcons from "@react-native-vector-icons/material-icons/static";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { SquircleView } from "expo-squircle-view";
import { Button } from "heroui-native/button";
import { Spinner } from "panelui-native";
import React, { memo, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Easing,
    Keyboard,
    LayoutAnimation,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { easeGradient } from "react-native-easing-gradient";
import { EdgeInsets } from "react-native-safe-area-context";

const Plain2 = ({ size, ...props }: any) => <SendIcon width={size} height={size} {...props} />;
const PenNewRound = ({ size, ...props }: any) => <EditIcon width={size} height={size} {...props} />;
const GalleryAdd = ({ size, ...props }: any) => <ImageAddIcon width={size} height={size} {...props} />;

export interface CommentInputBarProps {
    vm: any;
    colors: any;
    common: any;
    theme: string;
    insets: EdgeInsets;
    inputRef: React.RefObject<TextInput | null>;
    emojiSheetRef: React.RefObject<any>;
    onFocus?: () => void;
}

export const CommentInputBar = memo(({
    vm,
    colors,
    common,
    theme,
    insets,
    inputRef,
    emojiSheetRef,
    onFocus,
}: CommentInputBarProps) => {
    const { t } = useTranslation();
    const [isFocused, setIsFocused] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    // Track keyboard height smoothly for floating positioning
    useEffect(() => {
        const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

        const showSub = Keyboard.addListener(showEvent, (e) => {
            setKeyboardHeight(e.endCoordinates?.height ?? 0);
        });
        const hideSub = Keyboard.addListener(hideEvent, () => {
            setKeyboardHeight(0);
            vm.setShowUrlInput(false);
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, [vm.setShowUrlInput]);

    useEffect(() => {
        GiphyDialog.configure({
            theme: theme === "dark" ? GiphyThemePreset.Dark : GiphyThemePreset.Light,
            rating: GiphyRating.R,
        });
    }, [theme]);

    useEffect(() => {
        const listener = GiphyDialog.addListener("onMediaSelect", (e) => {
            const media = e.media;
            const images = media?.data?.images || (media as any)?.images;

            if (images && images.original && images.original.url) {
                const imageUrl = images.original.url;
                vm.setSelectedImageUrl(imageUrl);
            }
            GiphyDialog.hide();
        });
        return () => listener.remove();
    }, [vm.setSelectedImageUrl]);

    useEffect(() => {
        if (vm.replyingToComment) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setIsFocused(true);
            inputRef.current?.focus();
        }
    }, [vm.replyingToComment, inputRef]);

    useEffect(() => {
        if (vm.isEditing) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setIsFocused(true);
            inputRef.current?.focus();
        }
    }, [vm.isEditing, inputRef]);

    // Bottom fade ease gradient matching Settings search bar pattern
    const { colors: fadeColors, locations: fadeLocations } = useMemo(() => easeGradient({
        colorStops: {
            0: {
                color: colors.surface,
            },
            0.25: {
                color: colors.surface,
                easing: Easing.in(Easing.cubic),
            },
            1: {
                color: `${colors.surface}00`,
            },
        },
        extraColorStopsPerTransition: 16,
    }), [colors.surface]);

    const isExpanded = isFocused || vm.commentText.length > 0 || !!vm.selectedImageUrl || vm.isEditing || !!vm.replyingToComment || vm.showUrlInput;

    const handleFocus = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsFocused(true);
        onFocus?.();
    };

    const handleBlur = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsFocused(false);
    };

    const handleDismissKeyboard = () => {
        Keyboard.dismiss();
        setIsFocused(false);
    };

    return (
        <>
            {/* Fade overlay from solid at the bottom to transparent at the top */}
            <LinearGradient
                colors={fadeColors as [string, string, ...string[]]}
                locations={fadeLocations as [number, number, ...number[]]}
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: insets.bottom + 16 + (isFocused ? keyboardHeight : 0) + (isExpanded ? 160 : 48) + 24,
                    zIndex: 999,
                }}
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
                pointerEvents="none"
            />

            {/* Floating Morphing Comment Input Bar */}
            <View
                style={[
                    styles.floatingContainer,
                    {
                        bottom: insets.bottom + 16 + (isFocused ? keyboardHeight : 0),
                    },
                ]}
            >
                <View
                    style={[
                        isExpanded ? styles.expandedCard : styles.collapsedPill,
                        {
                            backgroundColor: colors.surfaceContainerHigh,
                            borderColor: colors.outlineVariant,
                        },
                    ]}
                >
                    {/* Banners & Previews (Rendered when expanded) */}
                    {isExpanded && (
                        <>
                            {/* Edit mode banner */}
                            {vm.isEditing && (
                                <View
                                    style={[
                                        styles.editBanner,
                                        { backgroundColor: colors.surfaceContainerHighest },
                                    ]}
                                >
                                    <MaterialIcons
                                        name="edit"
                                        size={14}
                                        color={colors.primary}
                                        style={{ marginRight: 6 }}
                                    />
                                    <FlexText
                                        style={[
                                            common.bodySmall,
                                            { color: colors.onSurface, flex: 1, fontSize: 12, fontWeight: "600" },
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {t("post.commentsSheet.editingBanner", "Editing comment")}
                                    </FlexText>
                                    <TouchableOpacity
                                        onPress={() => {
                                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                            vm.handleCancelEdit();
                                        }}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <MaterialIcons name="close" size={16} color={colors.onSurfaceVariant} />
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Replying mode banner */}
                            {vm.replyingToComment && (
                                <View
                                    style={[
                                        styles.editBanner,
                                        { backgroundColor: colors.surfaceContainerHighest },
                                    ]}
                                >
                                    <MaterialIcons
                                        name="reply"
                                        size={14}
                                        color={colors.primary}
                                        style={{ marginRight: 6 }}
                                    />
                                    <FlexText
                                        lite={false}
                                        style={[
                                            common.bodySmall,
                                            { color: colors.onSurface, flex: 1, fontSize: 12, fontWeight: "600" },
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {t("post.commentsSheet.replyingTo", {
                                            name: vm.replyingToComment.profile_username
                                                ? `@${vm.replyingToComment.profile_username}`
                                                : vm.replyingToComment.profile_name,
                                        })}
                                    </FlexText>
                                    <TouchableOpacity
                                        onPress={() => {
                                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                            vm.handleCancelReply();
                                        }}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <MaterialIcons name="close" size={16} color={colors.onSurfaceVariant} />
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* URL Image Input */}
                            {vm.showUrlInput && (
                                <SquircleView
                                    cornerSmoothing={100}
                                    preserveSmoothing
                                    style={[
                                        styles.urlInputWrapper,
                                        { backgroundColor: colors.surfaceContainerHighest },
                                    ]}
                                >
                                    <MaterialIcons name="link" size={18} color={colors.onSurface} />
                                    <TextInput
                                        style={[
                                            styles.urlInput,
                                            {
                                                color: colors.onSurface,
                                            },
                                        ]}
                                        placeholder="Enter image URL..."
                                        placeholderTextColor={colors.onSurfaceVariant}
                                        value={vm.imageUrlInput}
                                        onChangeText={vm.setImageUrlInput}
                                        autoFocus
                                        autoCapitalize="none"
                                        keyboardType="url"
                                        onSubmitEditing={vm.handleAddImageUrl}
                                    />
                                    {vm.imageUrlInput.trim().length > 0 && (
                                        <TouchableOpacity onPress={vm.handleAddImageUrl} style={{ marginLeft: 8 }}>
                                            <MaterialIcons name="check-circle" size={22} color={colors.primary} />
                                        </TouchableOpacity>
                                    )}
                                </SquircleView>
                            )}

                            {/* Selected Image Preview */}
                            {vm.selectedImageUrl && (
                                <View style={styles.previewContainer}>
                                    {EMOJI_ASSETS[vm.selectedImageUrl] ? (
                                        <Image
                                            source={EMOJI_ASSETS[vm.selectedImageUrl]}
                                            style={styles.previewImage}
                                            contentFit="contain"
                                        />
                                    ) : (
                                        <Image
                                            source={{ uri: vm.selectedImageUrl }}
                                            style={styles.previewImage}
                                            contentFit="cover"
                                        />
                                    )}
                                    <TouchableOpacity
                                        style={styles.previewRemoveButton}
                                        onPress={() => vm.setSelectedImageUrl(null)}
                                    >
                                        <MaterialIcons name="close" size={14} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </>
                    )}

                    {/* Main Input Row (TextInput is ALWAYS mounted) */}
                    <View style={isExpanded ? styles.expandedInputWrapper : styles.collapsedInputWrapper}>
                        <TextInput
                            ref={inputRef}
                            style={[
                                isExpanded ? styles.textAreaInput : styles.collapsedTextInput,
                                {
                                    color: colors.onSurface,
                                },
                            ]}
                            placeholder={
                                isExpanded
                                    ? vm.isEditing
                                        ? t("post.commentsSheet.placeholderEdit", "Edit your comment...")
                                        : t("post.commentsSheet.placeholderAdd", "Thêm bình luận...")
                                    : ""
                            }
                            placeholderTextColor={colors.onSurfaceVariant}
                            value={vm.commentText}
                            onChangeText={vm.setCommentText}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            multiline={isExpanded}
                            maxLength={500}
                        />

                        {/* Collapsed Placeholder Overlay (Taps pass through via pointerEvents="none") */}
                        {!isExpanded && !vm.commentText && (
                            <View style={styles.placeholderContainer} pointerEvents="none">
                                <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.onSurfaceVariant} />
                                <FlexText style={[common.body, { color: colors.onSurfaceVariant, marginLeft: 8, fontSize: 14 }]}>
                                    {t("post.commentsSheet.placeholderAdd", "Thêm bình luận...")}
                                </FlexText>
                            </View>
                        )}

                        {/* Collapsed Quick Actions on the Right */}
                        {!isExpanded && (
                            <View style={styles.collapsedRightActions}>
                                <TouchableOpacity
                                    hitSlop={8}
                                    onPress={() => {
                                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                        setIsFocused(true);
                                        vm.setShowUrlInput(true);
                                        inputRef.current?.focus();
                                    }}
                                >
                                    <GalleryAdd size={19} color={colors.onSurfaceVariant} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    hitSlop={8}
                                    onPress={() => {
                                        emojiSheetRef.current?.present();
                                    }}
                                >
                                    <MaterialIcons name="emoji-emotions" size={20} color={colors.onSurfaceVariant} />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Expanded Bottom Action Bar (inside the card under the text area) */}
                    {isExpanded && (
                        <View style={styles.cardBottomBar}>
                            <View style={styles.mediaActions}>
                                <TouchableOpacity
                                    style={[
                                        styles.toolbarIconButton,
                                        { backgroundColor: colors.surfaceContainerHighest },
                                        vm.selectedImageUrl ? { opacity: 0.5 } : {},
                                    ]}
                                    onPress={() => vm.setShowUrlInput(!vm.showUrlInput)}
                                    disabled={!!vm.selectedImageUrl}
                                >
                                    <GalleryAdd size={20} color={colors.onSurface} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.toolbarIconButton,
                                        { backgroundColor: colors.surfaceContainerHighest },
                                        vm.selectedImageUrl ? { opacity: 0.5 } : {},
                                    ]}
                                    onPress={() => {
                                        emojiSheetRef.current?.present();
                                        Keyboard.dismiss();
                                    }}
                                    disabled={!!vm.selectedImageUrl}
                                >
                                    <MaterialIcons name="emoji-emotions" size={20} color={colors.onSurface} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.toolbarIconButton,
                                        { backgroundColor: colors.surfaceContainerHighest },
                                        vm.selectedImageUrl ? { opacity: 0.5 } : {},
                                    ]}
                                    onPress={() => GiphyDialog.show()}
                                    disabled={!!vm.selectedImageUrl}
                                >
                                    <MaterialIcons name="gif" size={20} color={colors.onSurface} />
                                </TouchableOpacity>
                            </View>

                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                {isFocused && !vm.canSubmit && (
                                    <TouchableOpacity
                                        onPress={handleDismissKeyboard}
                                        style={[
                                            styles.dismissButton,
                                            { backgroundColor: colors.surfaceContainerHighest },
                                        ]}
                                    >
                                        <Ionicons name="chevron-down" size={20} color={colors.onSurfaceVariant} />
                                    </TouchableOpacity>
                                )}

                                {vm.canSubmit && (
                                    <Button
                                        isIconOnly
                                        isDisabled={vm.isActionLoading}
                                        onPress={vm.onPrimaryAction}
                                        style={{
                                            backgroundColor: colors.primary,
                                            width: 38,
                                            height: 38,
                                            borderRadius: 19,
                                        }}
                                    >
                                        {vm.isActionLoading ? (
                                            <Spinner className="sm" color={colors.onPrimary} />
                                        ) : !vm.isEditing ? (
                                            <Plain2 size={20} color={colors.onPrimary} />
                                        ) : (
                                            <PenNewRound size={20} color={colors.onPrimary} />
                                        )}
                                    </Button>
                                )}
                            </View>
                        </View>
                    )}
                </View>
            </View>
        </>
    );
}, (prev, next) => {
    return (
        prev.colors === next.colors &&
        prev.common === next.common &&
        prev.theme === next.theme &&
        prev.insets.bottom === next.insets.bottom &&
        prev.vm.commentText === next.vm.commentText &&
        prev.vm.selectedImageUrl === next.vm.selectedImageUrl &&
        prev.vm.imageUrlInput === next.vm.imageUrlInput &&
        prev.vm.showUrlInput === next.vm.showUrlInput &&
        prev.vm.isEditing === next.vm.isEditing &&
        prev.vm.replyingToComment?.id === next.vm.replyingToComment?.id &&
        prev.vm.canSubmit === next.vm.canSubmit &&
        prev.vm.isActionLoading === next.vm.isActionLoading
    );
});

CommentInputBar.displayName = "CommentInputBar";

const styles = StyleSheet.create({
    floatingContainer: {
        position: "absolute",
        left: 16,
        right: 16,
        zIndex: 1000,
    },
    collapsedPill: {
        minHeight: 50,
        height: 50,
        borderRadius: 9999,
        justifyContent: "center",
        paddingHorizontal: 16,
        borderWidth: StyleSheet.hairlineWidth,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    collapsedInputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        position: "relative",
        height: "100%",
    },
    collapsedTextInput: {
        flex: 1,
        fontSize: 14,
        height: 48,
        paddingVertical: 0,
        paddingRight: 64,
    },
    placeholderContainer: {
        position: "absolute",
        left: 0,
        flexDirection: "row",
        alignItems: "center",
    },
    collapsedRightActions: {
        position: "absolute",
        right: 0,
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
    },
    expandedCard: {
        borderRadius: 22,
        padding: 12,
        borderWidth: StyleSheet.hairlineWidth,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
        elevation: 6,
    },
    expandedInputWrapper: {
        width: "100%",
    },
    editBanner: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginBottom: 8,
    },
    urlInputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginBottom: 8,
    },
    urlInput: {
        flex: 1,
        fontSize: 13,
        marginLeft: 6,
        paddingVertical: 2,
    },
    previewContainer: {
        alignSelf: "flex-start",
        marginBottom: 8,
        marginLeft: 4,
        position: "relative",
    },
    previewImage: {
        width: 72,
        height: 72,
        borderRadius: 10,
    },
    previewRemoveButton: {
        position: "absolute",
        top: -5,
        right: -5,
        backgroundColor: "rgba(0,0,0,0.65)",
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: "#fff",
    },
    textAreaInput: {
        fontSize: 15,
        minHeight: 46,
        maxHeight: 120,
        paddingHorizontal: 6,
        paddingTop: 4,
        paddingBottom: 4,
        textAlignVertical: "top",
    },
    cardBottomBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 8,
        paddingTop: 4,
    },
    mediaActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    toolbarIconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    dismissButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
    },
});
