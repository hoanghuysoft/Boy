import { Ionicons } from "@expo/vector-icons";
import { XmarkSolid } from "@lineiconshq/free-icons";
import { Lineicons } from "@lineiconshq/react-native-lineicons";
import React, { memo } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { ThemeColors } from "../../context/ThemeContext";
import { DeezerTrack } from "../../services/deezer";
import { createStyles } from "./styles";
import { COLORS } from "./types";

// ============================================================================
// MusicSearchResult Component
// ============================================================================

// ============================================================================
// MusicSearchResult Component
// ============================================================================

interface MusicSearchResultProps {
    track: DeezerTrack;
    isSelected: boolean;
    onSelect: () => void;
    colors: ThemeColors;
    common: any;
}

const MusicSearchResult = memo(({
    track,
    isSelected,
    onSelect,
    colors,
    common,
}: MusicSearchResultProps) => (
    <TouchableOpacity
        style={[
            createStyles.musicResultItem,
            { backgroundColor: isSelected ? COLORS.primary + "20" : colors.card },
            isSelected && { borderColor: COLORS.primary, borderWidth: 2 }
        ]}
        onPress={onSelect}
    >
        <Image source={{ uri: track.cover_url }} style={createStyles.musicCover} />
        <View style={createStyles.musicInfo}>
            <Text style={[common.subheading, createStyles.musicTitle, { color: colors.text }]} numberOfLines={1}>
                {track.title}
            </Text>
            <Text style={[common.caption, createStyles.musicArtist, { color: colors.muted }]} numberOfLines={1}>
                {track.artist}
            </Text>
        </View>
        {isSelected && (
            <View style={[createStyles.selectedIndicator, { backgroundColor: COLORS.primary }]}>
                <Ionicons name="checkmark" size={14} color="#fff" />
            </View>
        )}
    </TouchableOpacity>
));

MusicSearchResult.displayName = "MusicSearchResult";

// ============================================================================
// SelectedMusicCard Component
// ============================================================================

interface SelectedMusicCardProps {
    track: DeezerTrack;
    colors: ThemeColors;
    common: any;
    onRemove: () => void;
}

const SelectedMusicCard = memo(({
    track,
    colors,
    common,
    onRemove,
}: SelectedMusicCardProps) => (
    <View style={[createStyles.selectedMusic, { backgroundColor: COLORS.primary + "15" }]}>
        <Image
            source={{ uri: track.cover_url }}
            style={createStyles.selectedMusicCover}
        />
        <View style={createStyles.selectedMusicInfo}>
            <Text style={[common.subheading, createStyles.selectedMusicTitle, { color: colors.text }]} numberOfLines={1}>
                {track.title}
            </Text>
            <Text style={[common.caption, createStyles.selectedMusicArtist, { color: colors.muted }]} numberOfLines={1}>
                {track.artist}
            </Text>
        </View>
        <TouchableOpacity
            style={[createStyles.removeSelectedMusic, { backgroundColor: COLORS.error }]}
            onPress={onRemove}
        >
            <Lineicons icon={XmarkSolid} size={12} color="#fff" />
        </TouchableOpacity>
    </View>
));

SelectedMusicCard.displayName = "SelectedMusicCard";

// ============================================================================
// MusicSection Component
// ============================================================================

interface MusicSectionProps {
    visible: boolean;
    colors: ThemeColors;
    common: any;
    searchQuery: string;
    onSearchQueryChange: (query: string) => void;
    selectedTrack: DeezerTrack | null;
    onSelectTrack: (track: DeezerTrack | null) => void;
    musicResults: DeezerTrack[];
    isLoading: boolean;
}

export const MusicSection = memo(({
    visible,
    colors,
    common,
    searchQuery,
    onSearchQueryChange,
    selectedTrack,
    onSelectTrack,
    musicResults,
    isLoading,
}: MusicSectionProps) => {
    if (!visible) return null;

    return (
        <View style={createStyles.musicSection}>
            <Text style={[common.label, { color: colors.text, marginBottom: 12 }]}>
                Add Music
            </Text>

            {selectedTrack && (
                <SelectedMusicCard
                    track={selectedTrack}
                    colors={colors}
                    common={common}
                    onRemove={() => onSelectTrack(null)}
                />
            )}

            <View
                style={[
                    createStyles.musicSearchContainer,
                    { backgroundColor: colors.card, borderColor: colors.divider },
                ]}
            >
                <Ionicons name="musical-notes-outline" size={18} color={COLORS.primary} />
                <TextInput
                    style={[createStyles.musicSearchInput, common.body, { color: colors.text }]}
                    placeholder="Search for songs..."
                    placeholderTextColor={colors.muted}
                    value={searchQuery}
                    onChangeText={onSearchQueryChange}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => onSearchQueryChange("")}>
                        <Ionicons name="close" size={18} color={colors.muted} />
                    </TouchableOpacity>
                )}
            </View>

            {isLoading && (
                <ActivityIndicator size="small" color={COLORS.primary} style={createStyles.musicLoading} />
            )}

            {musicResults.length > 0 && (
                <FlatList
                    data={musicResults}
                    keyExtractor={(item) => item.deezer_id}
                    renderItem={({ item }) => (
                        <MusicSearchResult
                            track={item}
                            isSelected={selectedTrack?.deezer_id === item.deezer_id}
                            onSelect={() => onSelectTrack(item)}
                            colors={colors}
                            common={common}
                        />
                    )}
                    scrollEnabled={false}
                    contentContainerStyle={createStyles.musicResultsList}
                />
            )}
        </View>
    );
});

MusicSection.displayName = "MusicSection";
