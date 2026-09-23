import { CaptionPart } from "@/types/post";
import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
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
  colors,
  common,
  maxLines = 3,
}: CaptionTextProps) => {
  const { t } = useTranslation();

  if (!caption) return null;

  return (
    <View style={styles.container}>
      <FlexText
        isExpanded={maxLines !== undefined && maxLines > 0}
        numberOfLines={maxLines}
        readMoreText={t('post.readMore', 'Read more')}
        readLessText={t('post.readLess', 'Read less')}
        readMoreStyle={{
          color: colors?.primary || colors?.verify || '#2563EB',
          fontWeight: '700',
        }}
        style={[common?.body, { color: colors?.text, fontSize: 14, lineHeight: 20 }]}
      >
        {caption}
      </FlexText>
    </View>
  );
});

CaptionText.displayName = "CaptionText";

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
});

export default CaptionText;
