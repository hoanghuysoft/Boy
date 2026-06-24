import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { FlexText } from '../FlexText';

interface EpisodeSelectorSectionProps {
  episodes: { episode: number; url: string }[];
  activeEpisodeUrl: string;
  onSelectEpisode: (url: string) => void;
  colors: any;
}

export const EpisodeSelectorSection = ({
  episodes,
  activeEpisodeUrl,
  onSelectEpisode,
  colors,
}: EpisodeSelectorSectionProps) => {
  if (episodes.length <= 1) return null;

  return (
    <View style={styles.container}>
      <FlexText style={[styles.sectionLabel, { color: colors.onSurface }]}>
        Episodes
      </FlexText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {episodes.map((ep, index) => {
          const isActive = ep.url === activeEpisodeUrl;
          return (
            <TouchableOpacity
              key={`${ep.episode}-${ep.url}-${index}`}
              onPress={() => onSelectEpisode(ep.url)}
              activeOpacity={0.75}
              style={[
                styles.episodeChip,
                {
                  backgroundColor: isActive ? colors.onSurface : colors.surfaceContainerHigh,
                },
              ]}
            >
              <FlexText
                style={[
                  styles.episodeChipText,
                  { color: isActive ? colors.surface : colors.onSurface },
                ]}
              >
                {`Ep ${ep.episode}`}
              </FlexText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  scrollContent: {
    gap: 8,
    paddingTop: 8,
  },
  episodeChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  episodeChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
