import { Ionicons } from "@expo/vector-icons";
import * as Device from 'expo-device';
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { FormikHelpers, useFormik } from "formik";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    NativeScrollEvent,
    NativeSyntheticEvent,
    TouchableOpacity,
    View
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Yup from "yup";

// Components
import { AlertDialog, Host, TextButton, Text as UIText } from '@expo/ui/jetpack-compose';
import {
    ContentInput,
    CreateActionBar,
    CreateProfileHeader,
    CreateScreenHeader,
    createStyles,
    LinksSection,
    LocationInput,
    MediaSection,
    MusicSection,
    SelectedMedia,
} from "../../components/create";


// Context & Services
import { useThemeContext } from "../../context/ThemeContext";
import { DeezerTrack, useDeezerSearch } from "../../services/deezer";
import { FileAsset, useUploadMultipleMedia } from "../../services/mediaUpload";
import { CreatePostInput, useCreatePost } from "../../services/post";
import { useProfile } from "../../services/userprofile";
import { useScrollStore } from "../../stores/scroll";
import { createCommonStyles } from "../../styles/common";
import { Link } from "../../types/post";

// ============================================================================
// Form Types & Validation Schema
// ============================================================================

interface CreatePostFormValues {
    content: string;
    location: string;
    selectedMedia: SelectedMedia[];
    links: Link[];
    isGhost: boolean;
    isAdult: boolean;
    selectedTrack: DeezerTrack | null;
}

const createPostValidationSchema = Yup.object().shape({
    content: Yup.string().max(2000, "create.validation.contentTooLong"),
    location: Yup.string().max(200, "create.validation.locationTooLong"),
    selectedMedia: Yup.array(),
    links: Yup.array().of(
        Yup.object().shape({
            label: Yup.string().when('url', {
                is: (url: string) => url && url.trim().length > 0,
                then: (schema) => schema.required("create.validation.linkLabelRequired"),
                otherwise: (schema) => schema,
            }),
            url: Yup.string().when('label', {
                is: (label: string) => label && label.trim().length > 0,
                then: (schema) => schema.required("create.validation.urlRequired").url("create.validation.urlInvalid"),
                otherwise: (schema) => schema,
            }),
        }, [['label', 'url']])
    ),
    isGhost: Yup.boolean(),
    isAdult: Yup.boolean(),
    selectedTrack: Yup.object().nullable(),
}).test(
    'content-or-media-required',
    'create.validation.contentOrMediaRequired',
    function (values) {
        const { content, selectedMedia } = values;
        return (content && content.trim().length > 0) || (selectedMedia && selectedMedia.length > 0);
    }
);

// ============================================================================
// Main Component
// ============================================================================

const CreateScreen = () => {
    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const trigger = useScrollStore((state) => state.triggers['chat']);
    const [dialog, setDialog] = useState<{
        visible: boolean;
        title: string;
        message: string;
        onConfirm?: () => void;
    }>({ visible: false, title: "", message: "", onConfirm: undefined });

    // Profile data
    const { data: profile } = useProfile('me', true);
    const profileId = profile?.id ?? '';

    // Mutations
    const createPostMutation = useCreatePost(profileId);
    const uploadMediaMutation = useUploadMultipleMedia(profileId);


    // Music State (search query is UI state, not form value)
    const [musicSearchQuery, setMusicSearchQuery] = useState("");
    const [showMusicSearch, setShowMusicSearch] = useState(false);
    const { data: musicResults, isLoading: isMusicLoading } = useDeezerSearch(musicSearchQuery, 10);

    // UI State
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [showLocationInput, setShowLocationInput] = useState(false);
    const [showActionBar, setShowActionBar] = useState(true);

    // Scroll tracking
    const scrollContentHeight = useRef(0);
    const scrollViewHeight = useRef(0);

    // ============================================================================
    // Formik Setup
    // ============================================================================

    const formik = useFormik<CreatePostFormValues>({
        initialValues: {
            content: "",
            location: "",
            selectedMedia: [],
            links: [],
            isGhost: false,
            isAdult: false,
            selectedTrack: null,
        },
        validationSchema: createPostValidationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values: CreatePostFormValues, { resetForm: formikResetForm }: FormikHelpers<CreatePostFormValues>) => {
            if (!profileId) {
                setDialog({
                    visible: true,
                    title: t("create.dialog.errorTitle"),
                    message: t("create.dialog.profileNotLoaded"),
                });
                return;
            }

            try {
                let mediaIds: string[] = [];

                // Upload media first if any
                if (values.selectedMedia.length > 0) {
                    const files: FileAsset[] = values.selectedMedia.map((media) => ({
                        uri: media.uri,
                        name: media.name,
                        type: media.type,
                        fileSize: media.fileSize,
                    }));

                    const uploadedMedia = await uploadMediaMutation.mutateAsync({ files });

                    mediaIds = uploadedMedia.map((m) => m.id);
                }

                // Create post with validated links
                const validLinks = values.links.filter((link: Link) => link.url.trim() && link.label.trim());
                const postData: CreatePostInput = {
                    content: values.content.trim() || undefined,
                    location: values.location.trim() || undefined,
                    deezer_id: values.selectedTrack?.deezer_id,
                    links: validLinks.length > 0 ? validLinks : undefined,
                    is_ghost: values.isGhost,
                    is_adult: values.isAdult,
                    media_ids: mediaIds.length > 0 ? mediaIds : undefined,
                    device: Device.osName + " " + Device.osVersion + " " + Device.manufacturer + " " + Device.modelName,
                };

                await createPostMutation.mutateAsync(postData);

                setDialog({
                    visible: true,
                    title: t("create.dialog.successTitle"),
                    message: t("create.dialog.postCreated"),
                    onConfirm: () => {
                        formikResetForm();
                        resetUIState();
                    },
                });
            } catch (error: any) {
                console.error("Error creating post:", error);
                setDialog({
                    visible: true,
                    title: t("create.dialog.errorTitle"),
                    message: error.message || t("create.dialog.createFailed"),
                });
            }
        },
    });

    const { values, errors, isSubmitting, handleSubmit, setFieldValue, resetForm: formikResetForm } = formik;

    // ============================================================================
    // Helper Functions
    // ============================================================================

    const resetUIState = useCallback(() => {
        setMusicSearchQuery("");
        setShowMusicSearch(false);
        setShowLinkInput(false);
        setShowLocationInput(false);
        setShowActionBar(true);
    }, []);

    const resetForm = useCallback(() => {
        formikResetForm();
        resetUIState();
    }, [formikResetForm, resetUIState]);

    // Reset form when navigate to this screen
    useEffect(() => {
        if (trigger > 0) {
            resetForm();
        }
    }, [trigger, resetForm]);

    // Custom submit handler that validates first and shows errors
    const onSubmitPress = useCallback(async () => {
        try {
            // Validate the form using Yup schema
            await createPostValidationSchema.validate(values, { abortEarly: false });
            // If validation passes, call Formik's handleSubmit
            handleSubmit();
        } catch (validationError: any) {
            // Handle Yup validation error
            if (validationError.inner && validationError.inner.length > 0) {
                // Get all field-level errors
                const errorMessages = validationError.inner.map((err: any) => t(err.message as any)).join('\n');
                setDialog({ visible: true, title: t("create.dialog.screenTitle"), message: errorMessages });
            } else if (validationError.message) {
                // Form-level error (like from .test())
                setDialog({ visible: true, title: t("create.dialog.screenTitle"), message: t(validationError.message as any) });
            }
        }
    }, [values, handleSubmit, t]);

    // ============================================================================
    // Handlers
    // ============================================================================

    const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;

        scrollViewHeight.current = layoutMeasurement.height;
        scrollContentHeight.current = contentSize.height;

        // Only hide if there's enough content to scroll AND we're at the end
        const hasScrollableContent = contentSize.height > layoutMeasurement.height + 50;
        const paddingToBottom = 100;
        const isAtEnd = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;

        // Show action bar if:
        // 1. Content is not scrollable (fits in viewport), OR
        // 2. Content is scrollable but we're not at the end
        setShowActionBar(!hasScrollableContent || !isAtEnd);
    }, []);

    const pickMedia = useCallback(async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            setDialog({
                visible: true,
                title: t("create.dialog.permissionTitle"),
                message: t("create.dialog.mediaPermissionRequired"),
            });
            return;
        }

        // Small delay to ensure Android ActivityResultLauncher is registered
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images', 'videos'],
                allowsMultipleSelection: true,
                quality: 0.8,
                selectionLimit: 10 - values.selectedMedia.length,
            });

            if (!result.canceled && result.assets) {
                const newMedia: SelectedMedia[] = result.assets.map((asset) => ({
                    uri: asset.uri,
                    name: asset.fileName || `media_${Date.now()}`,
                    type: asset.mimeType || (asset.type === "video" ? "video/mp4" : "image/jpeg"),
                    fileSize: asset.fileSize,
                    isVideo: asset.type === "video",
                }));
                setFieldValue('selectedMedia', [...values.selectedMedia, ...newMedia].slice(0, 10));
            }
        } catch (error: any) {
            console.error("Error picking media:", error);
            // Retry once after a longer delay if it fails
            if (error.message?.includes('unregistered')) {
                await new Promise(resolve => setTimeout(resolve, 500));
                try {
                    const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ['images', 'videos'],
                        allowsMultipleSelection: true,
                        quality: 0.8,
                        selectionLimit: 10 - values.selectedMedia.length,
                    });

                    if (!result.canceled && result.assets) {
                        const newMedia: SelectedMedia[] = result.assets.map((asset) => ({
                            uri: asset.uri,
                            name: asset.fileName || `media_${Date.now()}`,
                            type: asset.mimeType || (asset.type === "video" ? "video/mp4" : "image/jpeg"),
                            fileSize: asset.fileSize,
                            isVideo: asset.type === "video",
                        }));
                        setFieldValue('selectedMedia', [...values.selectedMedia, ...newMedia].slice(0, 10));
                    }
                } catch (retryError) {
                    setDialog({
                        visible: true,
                        title: t("create.dialog.errorTitle"),
                        message: t("create.dialog.mediaPickerFailed"),
                    });
                }
            }
        }
    }, [values.selectedMedia, setFieldValue, t]);

    const removeMedia = useCallback((index: number) => {
        setFieldValue('selectedMedia', values.selectedMedia.filter((_: SelectedMedia, i: number) => i !== index));
    }, [values.selectedMedia, setFieldValue]);

    const addLink = useCallback(() => {
        setFieldValue('links', [...values.links, { label: "", url: "" }]);
        setShowLinkInput(true);
    }, [values.links, setFieldValue]);

    const updateLink = useCallback((index: number, field: keyof Link, value: string) => {
        const updatedLinks = values.links.map((link: Link, i: number) =>
            i === index ? { ...link, [field]: value } : link
        );
        setFieldValue('links', updatedLinks);
    }, [values.links, setFieldValue]);

    const removeLink = useCallback((index: number) => {
        const updatedLinks = values.links.filter((_: Link, i: number) => i !== index);
        setFieldValue('links', updatedLinks);
        if (values.links.length === 1) setShowLinkInput(false);
    }, [values.links, setFieldValue]);

    // ============================================================================
    // Computed Values
    // ============================================================================

    const canSubmit = (values.content.trim().length > 0 || values.selectedMedia.length > 0) && !isSubmitting;

    // ============================================================================
    // Render
    // ============================================================================

    return (
        <View style={[common.screen]}>
            <View style={createStyles.container}>
                {/* Floating back button, same pattern as Bookmarks/ShowList */}
                <View style={{ position: 'absolute', top: insets.top + 16, left: 16, zIndex: 1000 }}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{
                            backgroundColor: colors.containerContent,
                            borderRadius: 999,
                            width: 40,
                            height: 40,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <Ionicons name="chevron-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                {dialog.visible && (
                    <Host matchContents>
                        <AlertDialog onDismissRequest={() => setDialog((prev) => ({ ...prev, visible: false }))}>
                            <AlertDialog.Title>
                                <UIText style={{ typography: 'titleLarge' }}>{dialog.title}</UIText>
                            </AlertDialog.Title>
                            <AlertDialog.Text>
                                <UIText>{dialog.message}</UIText>
                            </AlertDialog.Text>
                            <AlertDialog.ConfirmButton>
                                <TextButton onClick={() => {
                                    dialog.onConfirm?.();
                                    setDialog((prev) => ({ ...prev, visible: false }));
                                }}>
                                    <UIText>{t("create.dialog.ok")}</UIText>
                                </TextButton>
                            </AlertDialog.ConfirmButton>
                        </AlertDialog>
                    </Host>
                )}
                <CreateScreenHeader
                    colors={colors}
                    common={common}
                    topPadding={insets.top + 60}
                    canSubmit={canSubmit}
                    isSubmitting={isSubmitting}
                    onSubmit={onSubmitPress}
                />

                <KeyboardAwareScrollView
                    style={createStyles.scrollView}
                    contentContainerStyle={[
                        createStyles.scrollContent,
                        { paddingBottom: insets.bottom},
                    ]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    bottomOffset={50}
                >
                    {/* Profile Info */}
                    {profile && (
                        <CreateProfileHeader
                            profile={profile}
                            colors={colors}
                            common={common}
                            isGhost={values.isGhost}
                            isAdult={values.isAdult}
                            onToggleGhost={() => setFieldValue('isGhost', !values.isGhost)}
                            onToggleAdult={() => setFieldValue('isAdult', !values.isAdult)}
                        />
                    )}

                    {/* Content Input */}
                    <ContentInput
                        content={values.content}
                        onContentChange={(text) => setFieldValue('content', text)}
                        colors={colors}
                        common={common}
                    />

                    {/* Location Input */}
                    <LocationInput
                        visible={showLocationInput}
                        location={values.location}
                        onLocationChange={(text) => setFieldValue('location', text)}
                        onClose={() => {
                            setFieldValue('location', "");
                            setShowLocationInput(false);
                        }}
                        colors={colors}
                        common={common}
                    />

                    {/* Selected Media */}
                    <MediaSection
                        selectedMedia={values.selectedMedia}
                        colors={colors}
                        common={common}
                        onRemoveMedia={removeMedia}
                    />

                    {/* Links Section */}
                    <LinksSection
                        visible={showLinkInput}
                        links={values.links}
                        colors={colors}
                        common={common}
                        onUpdateLink={updateLink}
                        onRemoveLink={removeLink}
                    />

                    {/* Music Section */}
                    <MusicSection
                        visible={showMusicSearch}
                        colors={colors}
                        common={common}
                        searchQuery={musicSearchQuery}
                        onSearchQueryChange={setMusicSearchQuery}
                        selectedTrack={values.selectedTrack}
                        onSelectTrack={(track) => setFieldValue('selectedTrack', track)}
                        musicResults={musicResults?.data || []}
                        isLoading={isMusicLoading}
                    />
                </KeyboardAwareScrollView>

                {/* Action Bar */}
                <CreateActionBar
                    colors={colors}
                    bottomPadding={insets.bottom}
                    visible={showActionBar}
                    selectedMediaCount={values.selectedMedia.length}
                    onPickMedia={pickMedia}
                    showLocationInput={showLocationInput}
                    hasLocation={!!values.location}
                    onToggleLocation={() => setShowLocationInput(!showLocationInput)}
                    showMusicSearch={showMusicSearch}
                    selectedTrack={values.selectedTrack}
                    onToggleMusic={() => setShowMusicSearch(!showMusicSearch)}
                    linksCount={values.links.length}
                    onAddLink={addLink}
                />
            </View>
        </View>
    );
};

export default CreateScreen;
