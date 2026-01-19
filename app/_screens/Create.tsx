import { Ionicons } from "@expo/vector-icons";
import { XmarkSolid } from "@lineiconshq/free-icons";
import { Lineicons } from "@lineiconshq/react-native-lineicons";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeContext } from "../../context/ThemeContext";
import { DeezerTrack, useDeezerSearch } from "../../services/deezer";
import { FileAsset, useUploadMultipleMedia } from "../../services/mediaUpload";
import { CreatePostInput, useCreatePost } from "../../services/post";
import { useProfile } from "../../services/userprofile";
import { useScrollStore } from "../../stores/scroll";
import { createCommonStyles } from "../../styles/common";
import { Link } from "../../types/post";

// ============================================================================
// Color Constants
// ============================================================================

const COLORS = {
    primary: "#3B82F6",
    error: "#EF4444",
    success: "#10B981",
};

// ============================================================================
// Types
// ============================================================================

interface SelectedMedia {
    uri: string;
    name?: string;
    type?: string;
    fileSize?: number;
    isVideo: boolean;
}

// ============================================================================
// Components
// ============================================================================

const MediaThumbnail = ({
    media,
    onRemove,
    colors,
    uploadProgress,
}: {
    media: SelectedMedia;
    onRemove: () => void;
    colors: any;
    uploadProgress?: number;
}) => (
    <View style={styles.mediaThumbnailContainer}>
        <Image source={{ uri: media.uri }} style={styles.mediaThumbnail} />
        {media.isVideo && (
            <View style={styles.videoIndicator}>
                <Ionicons name="play" size={16} color="#fff" />
            </View>
        )}
        {uploadProgress !== undefined && uploadProgress < 100 && (
            <View style={[styles.uploadOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                <Text style={styles.uploadProgressText}>{uploadProgress}%</Text>
            </View>
        )}
        <TouchableOpacity
            style={[styles.removeMediaButton, { backgroundColor: COLORS.error }]}
            onPress={onRemove}
        >
            <Lineicons icon={XmarkSolid} size={10} color="#fff" />
        </TouchableOpacity>
    </View>
);

const MusicSearchResult = ({
    track,
    isSelected,
    onSelect,
    colors,
}: {
    track: DeezerTrack;
    isSelected: boolean;
    onSelect: () => void;
    colors: any;
}) => (
    <TouchableOpacity
        style={[
            styles.musicResultItem,
            { backgroundColor: isSelected ? COLORS.primary + "20" : colors.card },
            isSelected && { borderColor: COLORS.primary, borderWidth: 2 }
        ]}
        onPress={onSelect}
    >
        <Image source={{ uri: track.cover_url }} style={styles.musicCover} />
        <View style={styles.musicInfo}>
            <Text style={[styles.musicTitle, { color: colors.text }]} numberOfLines={1}>
                {track.title}
            </Text>
            <Text style={[styles.musicArtist, { color: colors.muted }]} numberOfLines={1}>
                {track.artist}
            </Text>
        </View>
        {isSelected && (
            <View style={[styles.selectedIndicator, { backgroundColor: COLORS.primary }]}>
                <Ionicons name="checkmark" size={14} color="#fff" />
            </View>
        )}
    </TouchableOpacity>
);

const LinkItem = ({
    link,
    index,
    onUpdate,
    onRemove,
    colors,
}: {
    link: Link;
    index: number;
    onUpdate: (field: keyof Link, value: string) => void;
    onRemove: () => void;
    colors: any;
}) => (
    <View style={[styles.linkItemContainer, { backgroundColor: colors.card }]}>
        <View style={styles.linkInputsContainer}>
            <TextInput
                style={[styles.linkInput, { color: colors.text, borderColor: colors.divider }]}
                placeholder="Label (e.g. Website)"
                placeholderTextColor={colors.muted}
                value={link.label}
                onChangeText={(text) => onUpdate("label", text)}
            />
            <TextInput
                style={[styles.linkInput, { color: colors.text, borderColor: colors.divider }]}
                placeholder="URL (e.g. https://...)"
                placeholderTextColor={colors.muted}
                value={link.url}
                onChangeText={(text) => onUpdate("url", text)}
                keyboardType="url"
                autoCapitalize="none"
            />
        </View>
        <TouchableOpacity
            style={[styles.removeLinkButton, { backgroundColor: COLORS.error }]}
            onPress={onRemove}
        >
            <Lineicons icon={XmarkSolid} size={12} color="#fff" />
        </TouchableOpacity>
    </View>
);

// ============================================================================
// Main Component
// ============================================================================

const CreateScreen = () => {
    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const insets = useSafeAreaInsets();
    const trigger = useScrollStore((state) => state.triggers['chat']); // Still using 'chat' for scroll trigger

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

    // Animation
    const fadeAnim = useState(new Animated.Value(0))[0];

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, []);

    // Reset form when navigate to this screen
    useEffect(() => {
        if (trigger > 0) {
            resetForm();
        }
    }, [trigger]);

    // ============================================================================
    // Handlers
    // ============================================================================

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

    const characterCount = useMemo(() => content.length, [content]);

    // ============================================================================
    // Render
    // ============================================================================

    return (
        <Animated.View style={[common.screen, { opacity: fadeAnim }]}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                {/* Header */}
                <View
                    style={[
                        styles.header,
                        {
                            backgroundColor: colors.background,
                            paddingTop: insets.top + 8,
                            borderBottomColor: colors.divider,
                        },
                    ]}
                >
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Create Post</Text>
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            {
                                backgroundColor: canSubmit ? COLORS.primary : colors.divider,
                            },
                        ]}
                        onPress={handleSubmit}
                        disabled={!canSubmit}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="send" size={16} color="#fff" />
                                <Text style={styles.submitButtonText}>Post</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingBottom: insets.bottom + 100 },
                    ]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Profile Info */}
                    {profile && (
                        <View style={styles.profileRow}>
                            <Image
                                source={{ uri: profile.avatar_url }}
                                style={[styles.profileAvatar, { borderColor: colors.divider }]}
                            />
                            <View>
                                <Text style={[styles.profileName, { color: colors.text }]}>
                                    {profile.name}
                                </Text>
                                <View style={styles.postOptionsRow}>
                                    <TouchableOpacity
                                        style={[
                                            styles.optionBadge,
                                            {
                                                backgroundColor: isGhost
                                                    ? COLORS.primary + "30"
                                                    : colors.card,
                                                borderColor: isGhost ? COLORS.primary : colors.divider,
                                            },
                                        ]}
                                        onPress={() => setIsGhost(!isGhost)}
                                    >
                                        <Ionicons
                                            name={isGhost ? "eye-off" : "eye-off-outline"}
                                            size={14}
                                            color={isGhost ? COLORS.primary : colors.muted}
                                        />
                                        <Text
                                            style={[
                                                styles.optionBadgeText,
                                                { color: isGhost ? COLORS.primary : colors.muted },
                                            ]}
                                        >
                                            Ghost
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.optionBadge,
                                            {
                                                backgroundColor: isAdult
                                                    ? COLORS.error + "30"
                                                    : colors.card,
                                                borderColor: isAdult ? COLORS.error : colors.divider,
                                            },
                                        ]}
                                        onPress={() => setIsAdult(!isAdult)}
                                    >
                                        <Ionicons
                                            name="warning"
                                            size={14}
                                            color={isAdult ? COLORS.error : colors.muted}
                                        />
                                        <Text
                                            style={[
                                                styles.optionBadgeText,
                                                { color: isAdult ? COLORS.error : colors.muted },
                                            ]}
                                        >
                                            18+
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Content Input */}
                    <View style={styles.contentSection}>
                        <TextInput
                            style={[
                                styles.contentInput,
                                { color: colors.text, borderColor: colors.divider },
                            ]}
                            placeholder="What's on your mind?"
                            placeholderTextColor={colors.muted}
                            value={content}
                            onChangeText={setContent}
                            multiline
                            maxLength={2000}
                        />
                        <Text style={[styles.characterCount, { color: colors.muted }]}>
                            {characterCount}/2000
                        </Text>
                    </View>

                    {/* Location Input */}
                    {showLocationInput && (
                        <View
                            style={[
                                styles.locationSection,
                                { backgroundColor: colors.card, borderColor: colors.divider },
                            ]}
                        >
                            <Ionicons name="location-outline" size={18} color={COLORS.primary} />
                            <TextInput
                                style={[styles.locationInput, { color: colors.text }]}
                                placeholder="Add location..."
                                placeholderTextColor={colors.muted}
                                value={location}
                                onChangeText={setLocation}
                            />
                            <TouchableOpacity onPress={() => {
                                setLocation("");
                                setShowLocationInput(false);
                            }}>
                                <Ionicons name="close" size={18} color={colors.muted} />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Selected Media */}
                    {selectedMedia.length > 0 && (
                        <View style={styles.mediaSection}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                Media ({selectedMedia.length}/10)
                            </Text>
                            <FlatList
                                data={selectedMedia}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={(_, index) => index.toString()}
                                renderItem={({ item, index }) => (
                                    <MediaThumbnail
                                        media={item}
                                        onRemove={() => removeMedia(index)}
                                        colors={colors}
                                        uploadProgress={uploadProgress[index]}
                                    />
                                )}
                                contentContainerStyle={styles.mediaList}
                            />
                        </View>
                    )}

                    {/* Links Section */}
                    {showLinkInput && links.length > 0 && (
                        <View style={styles.linksSection}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                Links
                            </Text>
                            {links.map((link, index) => (
                                <LinkItem
                                    key={index}
                                    link={link}
                                    index={index}
                                    onUpdate={(field, value) => updateLink(index, field, value)}
                                    onRemove={() => removeLink(index)}
                                    colors={colors}
                                />
                            ))}
                        </View>
                    )}

                    {/* Music Section */}
                    {showMusicSearch && (
                        <View style={styles.musicSection}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                Add Music
                            </Text>
                            {selectedTrack && (
                                <View style={[styles.selectedMusic, { backgroundColor: COLORS.primary + "15" }]}>
                                    <Image
                                        source={{ uri: selectedTrack.cover_url }}
                                        style={styles.selectedMusicCover}
                                    />
                                    <View style={styles.selectedMusicInfo}>
                                        <Text style={[styles.selectedMusicTitle, { color: colors.text }]} numberOfLines={1}>
                                            {selectedTrack.title}
                                        </Text>
                                        <Text style={[styles.selectedMusicArtist, { color: colors.muted }]} numberOfLines={1}>
                                            {selectedTrack.artist}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.removeSelectedMusic, { backgroundColor: COLORS.error }]}
                                        onPress={() => setSelectedTrack(null)}
                                    >
                                        <Lineicons icon={XmarkSolid} size={12} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            )}
                            <View
                                style={[
                                    styles.musicSearchContainer,
                                    { backgroundColor: colors.card, borderColor: colors.divider },
                                ]}
                            >
                                <Ionicons name="musical-notes-outline" size={18} color={COLORS.primary} />
                                <TextInput
                                    style={[styles.musicSearchInput, { color: colors.text }]}
                                    placeholder="Search for songs..."
                                    placeholderTextColor={colors.muted}
                                    value={musicSearchQuery}
                                    onChangeText={setMusicSearchQuery}
                                />
                                {musicSearchQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => setMusicSearchQuery("")}>
                                        <Ionicons name="close" size={18} color={colors.muted} />
                                    </TouchableOpacity>
                                )}
                            </View>
                            {isMusicLoading && (
                                <ActivityIndicator size="small" color={COLORS.primary} style={styles.musicLoading} />
                            )}
                            {musicResults && musicResults.data.length > 0 && (
                                <FlatList
                                    data={musicResults.data}
                                    keyExtractor={(item) => item.deezer_id}
                                    renderItem={({ item }) => (
                                        <MusicSearchResult
                                            track={item}
                                            isSelected={selectedTrack?.deezer_id === item.deezer_id}
                                            onSelect={() => setSelectedTrack(item)}
                                            colors={colors}
                                        />
                                    )}
                                    scrollEnabled={false}
                                    contentContainerStyle={styles.musicResultsList}
                                />
                            )}
                        </View>
                    )}
                </ScrollView>

                {/* Action Bar */}
                <View
                    style={[
                        styles.actionBar,
                        {
                            backgroundColor: colors.background,
                            borderTopColor: colors.divider,
                            paddingBottom: insets.bottom + 10,
                        },
                    ]}
                >
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.card }]}
                        onPress={pickMedia}
                        disabled={selectedMedia.length >= 10}
                    >
                        <Ionicons
                            name="image-outline"
                            size={22}
                            color={selectedMedia.length > 0 ? COLORS.primary : colors.text}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.card }]}
                        onPress={() => setShowLocationInput(!showLocationInput)}
                    >
                        <Ionicons
                            name="location-outline"
                            size={22}
                            color={showLocationInput || location ? COLORS.primary : colors.text}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.card }]}
                        onPress={() => setShowMusicSearch(!showMusicSearch)}
                    >
                        <Ionicons
                            name="musical-notes-outline"
                            size={22}
                            color={showMusicSearch || selectedTrack ? COLORS.primary : colors.text}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.card }]}
                        onPress={addLink}
                    >
                        <Ionicons
                            name="link-outline"
                            size={22}
                            color={links.length > 0 ? COLORS.primary : colors.text}
                        />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Animated.View>
    );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
    },
    submitButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    submitButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 15,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    profileRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 16,
    },
    profileAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
    },
    profileName: {
        fontSize: 16,
        fontWeight: "600",
    },
    postOptionsRow: {
        flexDirection: "row",
        gap: 8,
        marginTop: 4,
    },
    optionBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
    },
    optionBadgeText: {
        fontSize: 12,
        fontWeight: "500",
    },
    contentSection: {
        marginBottom: 16,
    },
    contentInput: {
        fontSize: 16,
        lineHeight: 24,
        minHeight: 120,
        textAlignVertical: "top",
        paddingVertical: 12,
    },
    characterCount: {
        fontSize: 12,
        textAlign: "right",
    },
    locationSection: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 16,
    },
    locationInput: {
        flex: 1,
        fontSize: 15,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 12,
    },
    mediaSection: {
        marginBottom: 16,
    },
    mediaList: {
        gap: 10,
    },
    mediaThumbnailContainer: {
        position: "relative",
        width: 100,
        height: 100,
        borderRadius: 12,
        overflow: "hidden",
    },
    mediaThumbnail: {
        width: "100%",
        height: "100%",
    },
    videoIndicator: {
        position: "absolute",
        top: 8,
        left: 8,
        backgroundColor: "rgba(0,0,0,0.6)",
        borderRadius: 12,
        padding: 4,
    },
    uploadOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "center",
        alignItems: "center",
    },
    uploadProgressText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 16,
    },
    removeMediaButton: {
        position: "absolute",
        top: 6,
        right: 6,
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: "center",
        alignItems: "center",
    },
    linksSection: {
        marginBottom: 16,
    },
    linkItemContainer: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
        gap: 12,
    },
    linkInputsContainer: {
        flex: 1,
        gap: 8,
    },
    linkInput: {
        fontSize: 14,
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
    },
    removeLinkButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
    },
    musicSection: {
        marginBottom: 16,
    },
    selectedMusic: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        gap: 12,
    },
    selectedMusicCover: {
        width: 48,
        height: 48,
        borderRadius: 8,
    },
    selectedMusicInfo: {
        flex: 1,
    },
    selectedMusicTitle: {
        fontSize: 14,
        fontWeight: "600",
    },
    selectedMusicArtist: {
        fontSize: 12,
        marginTop: 2,
    },
    removeSelectedMusic: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
    },
    musicSearchContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    musicSearchInput: {
        flex: 1,
        fontSize: 15,
    },
    musicLoading: {
        marginTop: 12,
    },
    musicResultsList: {
        marginTop: 12,
        gap: 8,
    },
    musicResultItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        borderRadius: 12,
        gap: 12,
    },
    musicCover: {
        width: 48,
        height: 48,
        borderRadius: 8,
    },
    musicInfo: {
        flex: 1,
    },
    musicTitle: {
        fontSize: 14,
        fontWeight: "600",
    },
    musicArtist: {
        fontSize: 12,
        marginTop: 2,
    },
    selectedIndicator: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    actionBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        paddingTop: 12,
        paddingHorizontal: 16,
        borderTopWidth: 1,
    },
    actionButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
    },
});

export default CreateScreen;
