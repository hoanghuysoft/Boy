import { BorderBeam } from '@/border-beam-native/src';
import { FlexText } from '@/components/FlexText';
import { useThemeContext } from '@/context/ThemeContext';
import Ionicons from '@react-native-vector-icons/ionicons/static';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import React, { memo, useRef, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  TextInput,
  type TextInputInstance,
  TouchableOpacity,
  View,
} from 'react-native';
import type { FilterCounts, FilterType } from './types';

const HORIZONTAL_PADDING = 12;

interface XUsersSearchFilterProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  counts: FilterCounts;
  blurTargetRef?: any;
}

export const XUsersSearchFilter = memo(function XUsersSearchFilter({
  searchQuery,
  onSearchChange,
  filter,
  onFilterChange,
  counts,
  blurTargetRef,
}: XUsersSearchFilterProps) {
  const { colors, theme } = useThemeContext();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInputInstance>(null);

  const filterData: Array<{ id: FilterType; label: string }> = [
    { id: 'all', label: `All (${counts.all})` },
    { id: 'following', label: `Following (${counts.following})` },
    { id: 'custom', label: `Custom (${counts.custom})` },
    { id: 'unfollowed', label: `Unfollowed (${counts.unfollowed})` },
  ];

  return (
    <View style={[styles.searchSection, { backgroundColor: colors.surface }]}>
      {/* Exact Search Bar from Search.tsx with BorderBeam + BlurView */}
      <BorderBeam
        size={isFocused ? 'pulse-inner' : 'line'}
        colorVariant="colorful"
        theme="auto"
        borderRadius={28}
      >
        <BlurView
          blurMethod="dimezisBlurViewSdk31Plus"
          tint={theme === 'dark' ? 'systemThickMaterialDark' : 'systemThickMaterialLight'}
          intensity={80}
          blurTarget={blurTargetRef}
          style={[styles.searchBar]}
        >
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: colors.text, marginLeft: 12 }]}
            placeholder="Search name or @username..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={onSearchChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => onSearchChange('')}
              style={styles.clearButton}
            >
              <View
                style={[
                  styles.clearButtonInner,
                  { backgroundColor: colors.card },
                ]}
              >
                <Ionicons
                  name="close"
                  size={16}
                  color={colors.text}
                />
              </View>
            </TouchableOpacity>
          )}
        </BlurView>
      </BorderBeam>

      {/* Filter Chips Row */}
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
                    borderColor: isSelected ? colors.primary : colors.outlineVariant,
                  },
                ]}
              >
                <FlexText
                  style={[
                    styles.filterChipText,
                    {
                      color: isSelected ? colors.onPrimary : colors.onSurfaceVariant,
                      fontWeight: isSelected ? '700' : '500',
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
    </View>
  );
});

const styles = StyleSheet.create({
  searchSection: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 8,
    paddingBottom: 6,
    gap: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 999,
    paddingHorizontal: 6,
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 6,
  },
  clearButtonInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
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

