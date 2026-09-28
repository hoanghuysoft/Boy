import { FlexText } from '@/components/FlexText';
import { useThemeContext } from '@/context/ThemeContext';
import { Button } from 'heroui-native/button';
import { Dialog } from 'heroui-native/dialog';
import React, { memo } from 'react';
import {
  Dimensions,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface XRootAccountDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  rootInput: string;
  onChangeRootInput: (text: string) => void;
  onSave: () => void;
  onSkip: () => void;
}

export const XRootAccountDialog = memo(function XRootAccountDialog({
  isOpen,
  onOpenChange,
  rootInput,
  onChangeRootInput,
  onSave,
  onSkip,
}: XRootAccountDialogProps) {
  const { colors } = useThemeContext();

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay style={{ backgroundColor: colors.scrim + '80' }} />
        <Dialog.Content
          style={[
            styles.dialogContent,
            { backgroundColor: colors.surfaceContainerHigh },
          ]}
        >
          <Dialog.Close />
          <View style={{ marginBottom: 12 }}>
            <Dialog.Title style={{ color: colors.onSurface }}>
              Tài khoản X của bạn
            </Dialog.Title>
          </View>
          <Dialog.Description style={{ color: colors.onSurfaceVariant, marginBottom: 16 }}>
            Nhập username X (Twitter) để ứng dụng tự động lấy và cập nhật danh sách Following của bạn.
          </Dialog.Description>

          <View style={styles.dialogInputWrapper}>
            <View
              style={[
                styles.dialogInputContainer,
                {
                  backgroundColor: colors.surfaceContainerHighest,
                  borderColor: colors.outlineVariant,
                },
              ]}
            >
              <FlexText style={{ color: colors.primary, fontWeight: '700', fontSize: 16 }}>
                @
              </FlexText>
              <TextInput
                placeholder="ví dụ: elonmusk"
                placeholderTextColor={colors.onSurfaceVariant}
                value={rootInput}
                onChangeText={onChangeRootInput}
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.dialogTextInput, { color: colors.onSurface }]}
              />
            </View>
          </View>

          <View style={styles.dialogButtonRow}>
            <Button
              variant="ghost"
              onPress={onSkip}
              style={{ flex: 1 }}
            >
              Bỏ qua
            </Button>
            <Button
              variant="primary"
              onPress={onSave}
              style={{ flex: 1 }}
            >
              Lưu & Đồng bộ
            </Button>
          </View>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
});

const styles = StyleSheet.create({
  dialogContent: {
    borderRadius: 20,
    padding: 20,
    width: SCREEN_WIDTH * 0.88,
    alignSelf: 'center',
  },
  dialogInputWrapper: {
    marginBottom: 20,
  },
  dialogInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dialogTextInput: {
    flex: 1,
    fontSize: 15,
  },
  dialogButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
});
