import { FlexText } from '@/components/FlexText';
import { useThemeContext } from '@/context/ThemeContext';
import { Button } from 'heroui-native/button';
import { Dialog } from 'heroui-native/dialog';
import { Spinner } from 'panelui-native';
import React, { memo } from 'react';
import {
  Dimensions,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface XAddUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  addUserInput: string;
  onChangeAddUserInput: (text: string) => void;
  isAddingUser: boolean;
  onAdd: () => void;
  onCancel: () => void;
}

export const XAddUserDialog = memo(function XAddUserDialog({
  isOpen,
  onOpenChange,
  addUserInput,
  onChangeAddUserInput,
  isAddingUser,
  onAdd,
  onCancel,
}: XAddUserDialogProps) {
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
              Thêm Custom User
            </Dialog.Title>
          </View>
          <Dialog.Description style={{ color: colors.onSurfaceVariant, marginBottom: 16 }}>
            Nhập username X của bất kỳ tài khoản nào bạn muốn thêm vào danh sách quản lý.
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
              <FlexText style={{ color: colors.tertiary, fontWeight: '700', fontSize: 16 }}>
                @
              </FlexText>
              <TextInput
                placeholder="nhập handle (vd: sama)"
                placeholderTextColor={colors.onSurfaceVariant}
                value={addUserInput}
                onChangeText={onChangeAddUserInput}
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.dialogTextInput, { color: colors.onSurface }]}
              />
            </View>
          </View>

          <View style={styles.dialogButtonRow}>
            <Button
              variant="ghost"
              onPress={onCancel}
              isDisabled={isAddingUser}
              style={{ flex: 1 }}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              onPress={onAdd}
              isDisabled={isAddingUser || !addUserInput.trim()}
              style={{ flex: 1 }}
            >
              {isAddingUser ? <Spinner size="sm" color={colors.onPrimary} /> : 'Thêm User'}
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
