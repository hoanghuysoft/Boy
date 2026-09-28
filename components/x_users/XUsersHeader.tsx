import { FlexText } from '@/components/FlexText';
import { useThemeContext } from '@/context/ThemeContext';
import Ionicons from '@react-native-vector-icons/ionicons/static';
import { useRouter } from 'expo-router';
import { Spinner } from 'panelui-native';
import React, { memo } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

const HORIZONTAL_PADDING = 12;

interface XUsersHeaderProps {
  topInset: number;
  rootUsername: string | null;
  isFetching: boolean;
  onOpenRootDialog: () => void;
  onRefresh: () => void;
  onOpenAddUserDialog: () => void;
}

export const XUsersHeader = memo(function XUsersHeader({
  topInset,
  rootUsername,
  isFetching,
  onOpenRootDialog,
  onRefresh,
  onOpenAddUserDialog,
}: XUsersHeaderProps) {
  const router = useRouter();
  const { colors } = useThemeContext();

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: topInset + 8,
          backgroundColor: colors.surface,
        },
      ]}
    >
      <View style={styles.headerLeft}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.iconButton, { backgroundColor: colors.surfaceContainerHigh }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={20} color={colors.onSurface} />
        </TouchableOpacity>

        <View style={{ gap: 2 }}>
          <FlexText style={[styles.headerTitle, { color: colors.onSurface }]}>
            Your X
          </FlexText>
          {rootUsername ? (
            <TouchableOpacity
              onPress={onOpenRootDialog}
              style={styles.rootChip}
            >
              <Ionicons name="logo-twitter" size={12} color="#1d9bf0" />
              <FlexText style={[styles.rootChipText, { color: colors.primary }]}>
                @{rootUsername}
              </FlexText>
              <Ionicons name="pencil-outline" size={11} color={colors.outline} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={onOpenRootDialog}
              style={[styles.rootChip, { backgroundColor: colors.errorContainer }]}
            >
              <Ionicons name="alert-circle-outline" size={12} color={colors.onErrorContainer} />
              <FlexText
                style={[styles.rootChipText, { color: colors.onErrorContainer }]}
              >
                Set X Handle
              </FlexText>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.headerActions}>
        {/* Refresh / Sync Button */}
        <TouchableOpacity
          onPress={onRefresh}
          disabled={isFetching}
          style={[
            styles.iconButton,
            { backgroundColor: colors.surfaceContainerHigh },
          ]}
        >
          {isFetching ? (
            <Spinner size="sm" color={colors.primary} />
          ) : (
            <Ionicons name="sync-outline" size={18} color={colors.onSurface} />
          )}
        </TouchableOpacity>

        {/* Add Custom User Button */}
        <TouchableOpacity
          onPress={onOpenAddUserDialog}
          style={[styles.addButton, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="add" size={18} color={colors.onPrimary} />
          <FlexText style={[styles.addButtonText, { color: colors.onPrimary }]}>
            Add
          </FlexText>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  rootChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1d9bf015',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  rootChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
