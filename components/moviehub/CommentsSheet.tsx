import type { IComment } from '@/services/shows';
import { LegendList } from '@legendapp/list/react-native';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import MaterialIcons from '@react-native-vector-icons/material-icons/static';
import { Image as ExpoImage } from 'expo-image';
import React, { ForwardedRef, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { FlexText } from '../FlexText';
import { CommentItem } from './CommentItem';

interface CommentsSheetProps {
  colors: any;
  insets: any;
  detentFraction: number;
  comments: IComment[];
  onAddComment: (text: string) => void;
}

export const CommentsSheet = React.forwardRef(({ colors, insets, detentFraction, comments, onAddComment }: CommentsSheetProps, ref: ForwardedRef<TrueSheet>) => {
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (!inputText.trim()) return;
    onAddComment(inputText.trim());
    setInputText('');
  };

  return (
    <TrueSheet
      ref={ref}
      detents={[detentFraction]}
      cornerRadius={24}
      grabber
      backgroundColor={colors.surface}
      dimmed={false}
      scrollable
      header={
        <View style={[styles.headerContainer, { borderBottomColor: colors.outlineVariant }]}>
          <FlexText style={[styles.headerTitle, { color: colors.onSurface }]}>
            Comments
          </FlexText>
          <TouchableOpacity onPress={() => (ref as any).current?.dismiss()}>
            <MaterialIcons name="close" size={24} color={colors.onSurface} />
          </TouchableOpacity>
        </View>
      }
      footer={
        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.outlineVariant, paddingBottom: insets.bottom + 10 }]}>
          <ExpoImage
            source={{ uri: "https://api.dicebear.com/7.x/adventurer/svg?seed=Me" }}
            style={styles.inputAvatar}
          />
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Add a comment..."
            placeholderTextColor={colors.onSurfaceVariant}
            style={[styles.input, { color: colors.onSurface, backgroundColor: colors.surfaceContainerHigh }]}
          />
          <TouchableOpacity onPress={handleSend} disabled={!inputText.trim()} style={{ opacity: inputText.trim() ? 1 : 0.4 }}>
            <MaterialIcons name="send" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      }
    >
      <LegendList
        data={comments}
        keyExtractor={(item, index) => String(item.id) + String(index)}
        renderItem={({ item }) => (
          <CommentItem
            comment={item}
            colors={colors}
          />
        )}
        recycleItems
        style={{ paddingHorizontal: 12 }}
        contentContainerStyle={{ paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      />
    </TrueSheet>
  );
});

CommentsSheet.displayName = "CommentsSheet";

const styles = StyleSheet.create({
  headerContainer: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  input: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 16,
    fontSize: 13,
  },
});
