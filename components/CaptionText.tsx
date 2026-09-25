import { useContentNavigation } from "@/hooks/useContentNavigation";
import { CaptionPart } from "@/types/post";
import React, { memo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Linking,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TextLayoutEventData,
  TouchableOpacity,
  View,
} from "react-native";
import { FlexText } from "./FlexText";

interface CaptionTextProps {
  caption: string;
  captionParts?: CaptionPart[];
  colors: any;
  common: any;
  maxLines?: number;
}

export const CaptionText = memo(({
  caption,
  captionParts,
  colors,
  common,
  maxLines = 3,
}: CaptionTextProps) => {
  const { t } = useTranslation();
  const { handleMentionPress, handleHashtagPress } = useContentNavigation();
  const [expanded, setExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const handleLinkPress = useCallback((url: string) => {
    const formattedUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    Linking.openURL(formattedUrl).catch(() => { });
  }, []);
  const handleTextLayout = useCallback((e: NativeSyntheticEvent<TextLayoutEventData>) => {
    if (maxLines && e.nativeEvent.lines.length > maxLines) {
      setHasOverflow(true);
    }
  }, [maxLines]);

  if (!caption) return null;

  const textColor = colors?.onSurface || colors?.text;
  const primaryColor = colors?.primary || colors?.verify || '#2563EB';
  const effectiveMaxLines = maxLines ? (expanded ? undefined : maxLines) : undefined;

  return (
    <View style={styles.container}>
      {/* Hidden measurement view to determine if text exceeds maxLines */}
      {!!maxLines && !hasOverflow && (
        <View
          style={{ position: 'absolute', top: 0, left: 0, right: 0, opacity: 0 }}
          pointerEvents="none"
          aria-hidden
        >
          <FlexText
            onTextLayout={handleTextLayout}
            style={[common?.body, { color: colors?.text, fontSize: 14, lineHeight: 20 }]}
          >
            {caption}
          </FlexText>
        </View>
      )}
      {/* Visible caption text */}
      {captionParts && captionParts.length > 0 ? (
        <FlexText
          numberOfLines={effectiveMaxLines}
          style={[common?.body, { color: textColor, fontSize: 14, lineHeight: 20 }]}
        >
          {captionParts.map((part, index) => {
            if (part.type === 'tag') {
              return (
                <Text
                  key={index}
                  style={{ color: primaryColor, fontWeight: '600' }}
                  onPress={() => handleHashtagPress(part.text)}
                  suppressHighlighting
                >
                  {part.text}
                </Text>
              );
            }
            if (part.type === 'mention') {
              return (
                <Text
                  key={index}
                  style={{ color: primaryColor, fontWeight: '600' }}
                  onPress={() => handleMentionPress(part.text)}
                  suppressHighlighting
                >
                  {part.text}
                </Text>
              );
            }
            if (part.type === 'link') {
              return (
                <Text
                  key={index}
                  style={{ color: primaryColor, textDecorationLine: 'underline' }}
                  onPress={() => handleLinkPress(part.text)}
                  suppressHighlighting
                >
                  {part.text}
                </Text>
              );
            }
            return part.text;
          })}
        </FlexText>
      ) : (
        <FlexText
          numberOfLines={effectiveMaxLines}
          style={[common?.body, { color: textColor, fontSize: 14, lineHeight: 20 }]}
          parse={[
            {
              pattern: /#[^\s#@!$%^&*()+,.;?]+/gu,
              style: { color: primaryColor, fontWeight: '600' },
              onPress: handleHashtagPress,
            },
            {
              pattern: /@[^\s#@!$%^&*()+,.;?]+/gu,
              style: { color: primaryColor, fontWeight: '600' },
              onPress: handleMentionPress,
            },
            {
              type: 'url',
              style: { color: primaryColor, textDecorationLine: 'underline' },
              onPress: handleLinkPress,
            }
          ]}
        >
          {caption}
        </FlexText>
      )}
      {/* Read more / Read less toggle button */}
      {hasOverflow && (
        <TouchableOpacity
          onPress={() => setExpanded(prev => !prev)}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.readMoreButton}
        >
          <FlexText
            style={[styles.readMoreText, { color: primaryColor }]}
            suppressHighlighting
          >
            {expanded ? t('post.readLess', 'Read less') : t('post.readMore', 'Read more')}
          </FlexText>
        </TouchableOpacity>
      )}
    </View>
  );
});

CaptionText.displayName = "CaptionText";

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  readMoreButton: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  readMoreText: {
    fontWeight: '700',
    fontSize: 13,
  },
});

export default CaptionText;
