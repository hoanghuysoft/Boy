import { FlexText } from '@/components/FlexText';
import { useSheetBackHandler } from '@/components/profile/sheets/useSheetBackHandler';
import { useThemeContext } from '@/context/ThemeContext';
import type { XStoredUser } from '@/stores/xUsers';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import Ionicons from '@react-native-vector-icons/ionicons/static';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Image as ExpoImage } from 'expo-image';
import { useToast } from 'heroui-native/toast';
import React, { memo, useEffect, useRef } from 'react';
import {
  Linking,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

const FALLBACK_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

interface XUserActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  user: XStoredUser | null;
  bottomInset: number;
  onOpenProfile: (user: XStoredUser) => void;
  onToggleUnfollow: (screen_name: string) => void;
  onRemoveUser: (screen_name: string) => void;
}

export const XUserActionSheet = memo(function XUserActionSheet({
  isOpen,
  onClose,
  user,
  bottomInset,
  onOpenProfile,
  onToggleUnfollow,
  onRemoveUser,
}: XUserActionSheetProps) {
  const { colors } = useThemeContext();
  const { toast } = useToast();

  const sheetRef = useRef<TrueSheet>(null);
  const isPresented = useRef(false);
  const cachedUser = useRef<XStoredUser | null>(user);
  const backHandler = useSheetBackHandler(sheetRef);

  if (user) {
    cachedUser.current = user;
  }
  const displayUser = user || cachedUser.current;

  useEffect(() => {
    if (isOpen && displayUser) {
      isPresented.current = true;
      sheetRef.current?.present();
    } else if (!isOpen && isPresented.current) {
      isPresented.current = false;
      sheetRef.current?.dismiss();
    }
  }, [isOpen, displayUser]);

  const handleDismiss = () => {
    isPresented.current = false;
    sheetRef.current?.dismiss();
  };

  return (
    <TrueSheet
      ref={sheetRef}
      detents={['auto']}
      cornerRadius={24}
      scrollable={false}
      backgroundColor={colors.surfaceContainerHigh}
      grabber
      grabberOptions={{
        color: colors.outlineVariant || '#8E8E93',
        height: 4,
        width: 36,
      }}
      onDidPresent={() => {
        isPresented.current = true;
        backHandler.onDidPresent();
      }}
      onDidDismiss={() => {
        isPresented.current = false;
        backHandler.onDidDismiss();
        onClose();
      }}
    >
      {displayUser ? (
        <View
          style={[
            styles.actionSheet,
            {
              paddingBottom: Math.max(bottomInset, 16) + 16,
            },
          ]}
        >
          {/* User Header */}
          <View style={styles.actionSheetHeader}>
            <ExpoImage
              source={{
                uri: displayUser.avatar_url || FALLBACK_AVATAR,
              }}
              style={styles.actionSheetAvatar}
            />
            <View style={{ flex: 1 }}>
              <FlexText
                style={[styles.actionSheetName, { color: colors.onSurface }]}
                numberOfLines={1}
              >
                {displayUser.name}
              </FlexText>
              <FlexText
                style={[
                  styles.actionSheetHandle,
                  { color: colors.onSurfaceVariant },
                ]}
                numberOfLines={1}
              >
                @{displayUser.screen_name} •{' '}
                {displayUser.source === 'custom' ? 'Custom' : 'Following'}
              </FlexText>
            </View>
          </View>

          <View
            style={[
              styles.actionDivider,
              { backgroundColor: colors.outlineVariant },
            ]}
          />

          {/* Action 1: View Profile */}
          <TouchableOpacity
            onPress={() => {
              handleDismiss();
              onOpenProfile(displayUser);
            }}
            style={styles.actionRow}
            activeOpacity={0.7}
          >
            <Ionicons name="person-outline" size={20} color={colors.primary} />
            <FlexText style={[styles.actionText, { color: colors.onSurface }]}>
              View Profile
            </FlexText>
          </TouchableOpacity>

          {/* Action 2: Toggle Unfollow / Following status */}
          <TouchableOpacity
            onPress={() => {
              const wasUnfollowed = displayUser.isUnfollowed;
              onToggleUnfollow(displayUser.screen_name);
              handleDismiss();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              toast.show({
                label: wasUnfollowed
                  ? 'Restored Following Status'
                  : 'Marked as Unfollowed (Custom)',
                description: `@${displayUser.screen_name}`,
                variant: 'default',
              });
            }}
            style={styles.actionRow}
            activeOpacity={0.7}
          >
            <Ionicons
              name={
                displayUser.isUnfollowed
                  ? 'checkmark-circle-outline'
                  : 'person-remove-outline'
              }
              size={20}
              color={displayUser.isUnfollowed ? colors.primary : colors.error}
            />
            <FlexText
              style={[
                styles.actionText,
                {
                  color: displayUser.isUnfollowed
                    ? colors.primary
                    : colors.error,
                },
              ]}
            >
              {displayUser.isUnfollowed
                ? 'Restore Following Status'
                : 'Mark as Unfollowed (Custom)'}
            </FlexText>
          </TouchableOpacity>

          {/* Action 3: Copy X Link */}
          <TouchableOpacity
            onPress={() => {
              Clipboard.setStringAsync(
                `https://x.com/${displayUser.screen_name}`
              );
              handleDismiss();
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
              toast.show({
                label: 'Link Copied',
                description: `https://x.com/${displayUser.screen_name}`,
                variant: 'success',
              });
            }}
            style={styles.actionRow}
            activeOpacity={0.7}
          >
            <Ionicons name="copy-outline" size={20} color={colors.onSurface} />
            <FlexText style={[styles.actionText, { color: colors.onSurface }]}>
              Copy X Link
            </FlexText>
          </TouchableOpacity>

          {/* Action 4: Open in X App */}
          <TouchableOpacity
            onPress={() => {
              Linking.openURL(
                `https://x.com/${displayUser.screen_name}`
              ).catch(() => {});
              handleDismiss();
            }}
            style={styles.actionRow}
            activeOpacity={0.7}
          >
            <Ionicons name="open-outline" size={20} color={colors.onSurface} />
            <FlexText style={[styles.actionText, { color: colors.onSurface }]}>
              Open in X App
            </FlexText>
          </TouchableOpacity>

          {/* Action 5: Remove from list */}
          <TouchableOpacity
            onPress={() => {
              onRemoveUser(displayUser.screen_name);
              handleDismiss();
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Warning
              );
              toast.show({
                label: 'Removed',
                description: `Removed @${displayUser.screen_name} from list`,
                variant: 'default',
              });
            }}
            style={styles.actionRow}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={20} color={colors.error} />
            <FlexText style={[styles.actionText, { color: colors.error }]}>
              Remove from Saved List
            </FlexText>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ minHeight: 80 }} />
      )}
    </TrueSheet>
  );
});

const styles = StyleSheet.create({
  actionSheet: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 4,
  },
  actionSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  actionSheetAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  actionSheetName: {
    fontSize: 16,
    fontWeight: '700',
  },
  actionSheetHandle: {
    fontSize: 13,
    marginTop: 2,
  },
  actionDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 6,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
