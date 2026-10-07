import { useContentNavigation } from "@/hooks/useContentNavigation";
import { CaptionPart } from "@/types/post";
import React, { memo, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Linking,
  StyleSheet,
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

  const primaryColor = colors?.primary || colors?.verify || '#2563EB';
  const textColor = colors?.onSurface || colors?.text;
  const hasParts = !!captionParts && captionParts.length > 0;

  const handleLinkPress = useCallback((url: string) => {
    const formattedUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    Linking.openURL(formattedUrl).catch(() => { });
  }, []);

  const plainText = useMemo(
    () => (hasParts ? captionParts!.map(p => p.text).join('') : caption),
    [hasParts, captionParts, caption]
  );

  // Maps a visible prefix of `plainText` back onto the server-parsed parts.
  const renderParts = useCallback((visible: string) => {
    if (!captionParts) return visible;
    // Truncation trims leading whitespace; skip the same amount in parts.
    let skip = plainText.length - plainText.trimStart().length;
    let remaining = visible.length;
    const nodes: React.ReactNode[] = [];

    for (let i = 0; i < captionParts.length && remaining > 0; i++) {
      const part = captionParts[i];
      let text = part.text;
      if (skip > 0) {
        const cut = Math.min(skip, text.length);
        text = text.slice(cut);
        skip -= cut;
        if (!text) continue;
      }
      if (text.length > remaining) text = text.slice(0, remaining);
      remaining -= text.length;

      if (part.type === 'tag' || part.type === 'mention') {
        const onPress = part.type === 'tag' ? handleHashtagPress : handleMentionPress;
        nodes.push(
          <FlexText
            key={i}
            medium
            style={{ color: primaryColor }}
            onPress={() => onPress(part.text)}
            suppressHighlighting
          >
            {text}
          </FlexText>
        );
      } else if (part.type === 'link') {
        nodes.push(
          <FlexText
            key={i}
            style={{ color: primaryColor, textDecorationLine: 'underline' }}
            onPress={() => handleLinkPress(part.text)}
            suppressHighlighting
          >
            {text}
          </FlexText>
        );
      } else {
        nodes.push(text);
      }
    }
    return nodes;
  }, [captionParts, plainText, primaryColor, handleHashtagPress, handleMentionPress, handleLinkPress]);

  // Client-side regex parsing only as a fallback when the server sent no parts.
  const parseRules = useMemo(() => hasParts ? undefined : [
    {
      pattern: /#[^\s#@!$%^&*()+,.;?]+/gu,
      style: { color: primaryColor, fontFamily: 'GoogleSansFlexMedium' },
      onPress: handleHashtagPress,
    },
    {
      pattern: /@[^\s#@!$%^&*()+,.;?]+/gu,
      style: { color: primaryColor, fontFamily: 'GoogleSansFlexMedium' },
      onPress: handleMentionPress,
    },
    {
      type: 'url',
      style: { color: primaryColor, textDecorationLine: 'underline' },
      onPress: handleLinkPress,
    },
  ], [hasParts, primaryColor, handleHashtagPress, handleMentionPress, handleLinkPress]);

  if (!plainText) return null;

  const textStyle = [common?.body, { color: textColor, fontSize: 14, lineHeight: 20 }];

  // No line limit (e.g. detail screen): render full content directly.
  if (!maxLines) {
    return (
      <View style={styles.container}>
        {hasParts ? (
          <FlexText style={textStyle}>{renderParts(plainText)}</FlexText>
        ) : (
          <FlexText style={textStyle} parse={parseRules}>{plainText}</FlexText>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlexText
        isExpanded
        numberOfLines={maxLines}
        parse={parseRules}
        renderContent={hasParts ? renderParts : undefined}
        readMoreText={t('post.readMore', 'Read more')}
        readLessText={t('post.readLess', 'Read less')}
        readMoreStyle={[styles.readMoreText, { color: primaryColor }]}
        style={textStyle}
      >
        {plainText}
      </FlexText>
    </View>
  );
});

CaptionText.displayName = "CaptionText";

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  readMoreText: {
    fontFamily: 'GoogleSansFlexBold',
    fontSize: 13,
  },
});

export default CaptionText;
