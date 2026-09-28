import { FlexText } from "@/components/FlexText";
import { useThemeContext } from "@/context/ThemeContext";
import * as Haptics from "expo-haptics";
import React, { memo } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import type { FilterCounts, FilterType } from "./types";

const HORIZONTAL_PADDING = 12;

interface XUsersFilterChipsProps {
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  counts: FilterCounts;
}

export const XUsersFilterChips = memo(function XUsersFilterChips({
  filter,
  onFilterChange,
  counts,
}: XUsersFilterChipsProps) {
  const { colors } = useThemeContext();

  const filterData: Array<{ id: FilterType; label: string }> = [
    { id: "all", label: `All (${counts.all})` },
    { id: "following", label: `Following (${counts.following})` },
    { id: "custom", label: `Custom (${counts.custom})` },
    { id: "unfollowed", label: `Unfollowed (${counts.unfollowed})` },
  ];

  return (
    <View style={styles.filterRow}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={filterData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.filterScroll}
        renderItem={({ item }) => {
          const isSelected = filter === item.id;
          return (
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                onFilterChange(item.id);
              }}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isSelected
                    ? colors.primary
                    : colors.surfaceContainerHigh,
                  borderColor: isSelected
                    ? colors.primary
                    : colors.outlineVariant,
                },
              ]}
            >
              <FlexText
                style={[
                  styles.filterChipText,
                  {
                    color: isSelected ? colors.onPrimary : colors.onSurfaceVariant,
                    fontWeight: isSelected ? "700" : "500",
                  },
                ]}
              >
                {item.label}
              </FlexText>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  filterRow: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingVertical: 6,
  },
  filterScroll: {
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  filterChipText: {
    fontSize: 12,
  },
});

