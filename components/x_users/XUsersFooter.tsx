import { FlexText } from '@/components/FlexText';
import { useThemeContext } from '@/context/ThemeContext';
import { Spinner } from 'panelui-native';
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

interface XUsersFooterProps {
  isFetchingNextPage: boolean;
  hasNextPage?: boolean;
  hasUsers: boolean;
  hasRootUsername: boolean;
  isCustomFilter: boolean;
}

export const XUsersFooter = memo(function XUsersFooter({
  isFetchingNextPage,
  hasNextPage,
  hasUsers,
  hasRootUsername,
  isCustomFilter,
}: XUsersFooterProps) {
  const { colors } = useThemeContext();

  if (isFetchingNextPage) {
    return (
      <View style={styles.footerLoader}>
        <View
          style={[
            styles.loaderPill,
            { backgroundColor: colors.surfaceContainerHigh },
          ]}
        >
          <Spinner size="sm" color={colors.primary} />
          <FlexText style={[styles.loaderText, { color: colors.onSurfaceVariant }]}>
            Đang tải thêm...
          </FlexText>
        </View>
      </View>
    );
  }

  if (hasRootUsername && !hasNextPage && hasUsers && !isCustomFilter) {
    return (
      <View style={styles.footerLoader}>
        <FlexText style={[styles.endOfListText, { color: colors.outline }]}>
          Đã tải hết danh sách
        </FlexText>
      </View>
    );
  }

  return null;
});

const styles = StyleSheet.create({
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  loaderText: {
    fontSize: 12,
    fontWeight: '600',
  },
  endOfListText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});
