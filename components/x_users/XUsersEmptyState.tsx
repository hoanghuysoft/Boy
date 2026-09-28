import { FlexText } from '@/components/FlexText';
import { useThemeContext } from '@/context/ThemeContext';
import Ionicons from '@react-native-vector-icons/ionicons/static';
import { Button } from 'heroui-native/button';
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

interface XUsersEmptyStateProps {
  searchQuery: string;
  rootUsername: string | null;
  onOpenRootDialog: () => void;
  onOpenAddUserDialog: () => void;
}

export const XUsersEmptyState = memo(function XUsersEmptyState({
  searchQuery,
  rootUsername,
  onOpenRootDialog,
  onOpenAddUserDialog,
}: XUsersEmptyStateProps) {
  const { colors } = useThemeContext();

  return (
    <View style={styles.emptyContainer}>
      <View
        style={[
          styles.emptyIconCircle,
          { backgroundColor: colors.surfaceContainerHigh },
        ]}
      >
        <Ionicons name="people-outline" size={44} color={colors.outline} />
      </View>
      <FlexText style={[styles.emptyTitle, { color: colors.onSurface }]}>
        {searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có user nào'}
      </FlexText>
      <FlexText style={[styles.emptySubtitle, { color: colors.onSurfaceVariant }]}>
        {searchQuery
          ? 'Hãy thử tìm kiếm với từ khóa khác'
          : 'Nhập tài khoản X gốc hoặc thêm tài khoản custom để theo dõi.'}
      </FlexText>
      <View style={styles.emptyActions}>
        {!rootUsername && (
          <Button
            variant="primary"
            onPress={onOpenRootDialog}
            style={{ minWidth: 140 }}
          >
            Nhập tài khoản X
          </Button>
        )}
        <Button
          variant="secondary"
          onPress={onOpenAddUserDialog}
          style={{ minWidth: 140 }}
        >
          + Thêm Custom User
        </Button>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
});
