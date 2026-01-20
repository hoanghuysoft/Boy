import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    NativeScrollEvent,
    NativeSyntheticEvent,
    View
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Components
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
// Main Component
// ============================================================================

const CreateScreen = () => {
    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const insets = useSafeAreaInsets();
    const trigger = useScrollStore((state) => state.triggers['chat']);

    // Profile data
    const { data: profile } = useProfile('me', true);
    const profileId = profile?.id ?? '';

    // Mutations
    const createPostMutation = useCreatePost(profileId);
    const uploadMediaMutation = useUploadMultipleMedia(profileId);

    // Form State
    const [content, setContent] = useState("");
    const [location, setLocation] = useState("");
    const [selectedMedia, setSelectedMedia] = useState<SelectedMedia[]>([]);
    const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});
    const [links, setLinks] = useState<Link[]>([]);
    const [isGhost, setIsGhost] = useState(false);
    const [isAdult, setIsAdult] = useState(false);

    // Music State
    const [musicSearchQuery, setMusicSearchQuery] = useState("");
    const [selectedTrack, setSelectedTrack] = useState<DeezerTrack | null>(null);
    const [showMusicSearch, setShowMusicSearch] = useState(false);
    const { data: musicResults, isLoading: isMusicLoading } = useDeezerSearch(musicSearchQuery, 10);

    // UI State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [showLocationInput, setShowLocationInput] = useState(false);
    const [showActionBar, setShowActionBar] = useState(true);

    // Scroll tracking
    const scrollContentHeight = useRef(0);
    const scrollViewHeight = useRef(0);

    // Reset form when navigate to this screen
    useEffect(() => {
        if (trigger > 0) {
            resetForm();
        }
    }, [trigger]);

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
            Alert.alert("Permission Required", "Please grant media library access to pick images.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            allowsMultipleSelection: true,
            quality: 0.8,
            selectionLimit: 10 - selectedMedia.length,
        });

        if (!result.canceled && result.assets) {
            const newMedia: SelectedMedia[] = result.assets.map((asset) => ({
                uri: asset.uri,
                name: asset.fileName || `media_${Date.now()}`,
                type: asset.mimeType || (asset.type === "video" ? "video/mp4" : "image/jpeg"),
                fileSize: asset.fileSize,
                isVideo: asset.type === "video",
            }));
            setSelectedMedia((prev) => [...prev, ...newMedia].slice(0, 10));
        }
    }, [selectedMedia.length]);

    const removeMedia = useCallback((index: number) => {
        setSelectedMedia((prev) => prev.filter((_, i) => i !== index));
        setUploadProgress((prev) => {
            const newProgress = { ...prev };
            delete newProgress[index];
            return newProgress;
        });
    }, []);

    const addLink = useCallback(() => {
        setLinks((prev) => [...prev, { label: "", url: "" }]);
        setShowLinkInput(true);
    }, []);

    const updateLink = useCallback((index: number, field: keyof Link, value: string) => {
        setLinks((prev) =>
            prev.map((link, i) => (i === index ? { ...link, [field]: value } : link))
        );
    }, []);

    const removeLink = useCallback((index: number) => {
        setLinks((prev) => prev.filter((_, i) => i !== index));
        if (links.length === 1) setShowLinkInput(false);
    }, [links.length]);

    const resetForm = useCallback(() => {
        setContent("");
        setLocation("");
        setSelectedMedia([]);
        setUploadProgress({});
        setLinks([]);
        setIsGhost(false);
        setIsAdult(false);
        setSelectedTrack(null);
        setMusicSearchQuery("");
        setShowMusicSearch(false);
        setShowLinkInput(false);
        setShowLocationInput(false);
        setShowActionBar(true);
    }, []);

    const handleSubmit = useCallback(async () => {
        if (!profileId) {
            Alert.alert("Error", "Profile not loaded. Please try again.");
            return;
        }

        if (!content.trim() && selectedMedia.length === 0) {
            Alert.alert("Error", "Please add some content or media to your post.");
            return;
        }

        setIsSubmitting(true);

        try {
            let mediaIds: string[] = [];

            // Upload media first if any
            if (selectedMedia.length > 0) {
                const files: FileAsset[] = selectedMedia.map((media) => ({
                    uri: media.uri,
                    name: media.name,
                    type: media.type,
                    fileSize: media.fileSize,
                }));

                const uploadedMedia = await uploadMediaMutation.mutateAsync({
                    files,
                    onFileProgress: (index, progress) => {
                        setUploadProgress((prev) => ({ ...prev, [index]: progress }));
                    },
                    onFileComplete: (index, media) => {
                        setUploadProgress((prev) => ({ ...prev, [index]: 100 }));
                    },
                });

                mediaIds = uploadedMedia.map((m) => m.id);
            }

            // Create post with validated links
            const validLinks = links.filter((link) => link.url.trim() && link.label.trim());

            const postData: CreatePostInput = {
                content: content.trim() || undefined,
                location: location.trim() || undefined,
                deezer_id: selectedTrack?.deezer_id,
                links: validLinks.length > 0 ? validLinks : undefined,
                is_ghost: isGhost,
                is_adult: isAdult,
                media_ids: mediaIds.length > 0 ? mediaIds : undefined,
            };

            await createPostMutation.mutateAsync(postData);

            Alert.alert("Success", "Your post has been created!", [
                { text: "OK", onPress: resetForm }
            ]);
        } catch (error: any) {
            console.error("Error creating post:", error);
            Alert.alert("Error", error.message || "Failed to create post. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }, [
        profileId,
        content,
        selectedMedia,
        location,
        selectedTrack,
        links,
        isGhost,
        isAdult,
        uploadMediaMutation,
        createPostMutation,
        resetForm,
    ]);

    // ============================================================================
    // Computed Values
    // ============================================================================

    const canSubmit = useMemo(() => {
        return (content.trim().length > 0 || selectedMedia.length > 0) && !isSubmitting;
    }, [content, selectedMedia, isSubmitting]);

    // ============================================================================
    // Render
    // ============================================================================

    return (
        <View style={[common.screen]}>
            <View style={createStyles.container}>
                {/* Header */}
                <CreateScreenHeader
                    colors={colors}
                    common={common}
                    topPadding={insets.top + 8}
                    canSubmit={canSubmit}
                    isSubmitting={isSubmitting}
                    onSubmit={handleSubmit}
                />

                <KeyboardAwareScrollView
                    style={createStyles.scrollView}
                    contentContainerStyle={[
                        createStyles.scrollContent,
                        { paddingBottom: insets.bottom + 150 },
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
                            isGhost={isGhost}
                            isAdult={isAdult}
                            onToggleGhost={() => setIsGhost(!isGhost)}
                            onToggleAdult={() => setIsAdult(!isAdult)}
                        />
                    )}

                    {/* Content Input */}
                    <ContentInput
                        content={content}
                        onContentChange={setContent}
                        colors={colors}
                        common={common}
                    />

                    {/* Location Input */}
                    <LocationInput
                        visible={showLocationInput}
                        location={location}
                        onLocationChange={setLocation}
                        onClose={() => {
                            setLocation("");
                            setShowLocationInput(false);
                        }}
                        colors={colors}
                        common={common}
                    />

                    {/* Selected Media */}
                    <MediaSection
                        selectedMedia={selectedMedia}
                        uploadProgress={uploadProgress}
                        colors={colors}
                        common={common}
                        onRemoveMedia={removeMedia}
                    />

                    {/* Links Section */}
                    <LinksSection
                        visible={showLinkInput}
                        links={links}
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
                        selectedTrack={selectedTrack}
                        onSelectTrack={setSelectedTrack}
                        musicResults={musicResults?.data || []}
                        isLoading={isMusicLoading}
                    />
                </KeyboardAwareScrollView>

                {/* Action Bar */}
                <CreateActionBar
                    colors={colors}
                    bottomPadding={insets.bottom + 80}
                    visible={showActionBar}
                    selectedMediaCount={selectedMedia.length}
                    onPickMedia={pickMedia}
                    showLocationInput={showLocationInput}
                    hasLocation={!!location}
                    onToggleLocation={() => setShowLocationInput(!showLocationInput)}
                    showMusicSearch={showMusicSearch}
                    selectedTrack={selectedTrack}
                    onToggleMusic={() => setShowMusicSearch(!showMusicSearch)}
                    linksCount={links.length}
                    onAddLink={addLink}
                />
            </View>
        </View>
    );
};

export default CreateScreen;
