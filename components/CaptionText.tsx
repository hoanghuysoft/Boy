import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface CaptionTextProps {
  caption: string;
  colors: any;
  common: any;
  maxLines?: number;
}

// Simple text parsing for hashtags, mentions, and links
const parseCaption = (text: string) => {
  const regex = /(#\w+|@\w+|https?:\/\/[^\s]+)/g;
  const parts: { type: 'text' | 'tag' | 'mention' | 'link'; text: string }[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push({ type: 'text', text: text.slice(lastIndex, match.index) });
    }

    // Determine type and add the match
    const matchedText = match[0];
    if (matchedText.startsWith('#')) {
      parts.push({ type: 'tag', text: matchedText });
    } else if (matchedText.startsWith('@')) {
      parts.push({ type: 'mention', text: matchedText });
    } else {
      parts.push({ type: 'link', text: matchedText });
    }

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({ type: 'text', text: text.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: 'text' as const, text }];
};

const CaptionText = ({ caption, colors, common, maxLines = 3 }: CaptionTextProps) => {
  const [expanded, setExpanded] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);

  // Use character count heuristic instead of layout measurement
  // This is more reliable with RecyclerListView
  const CHARACTER_THRESHOLD = 150; // Approximate characters for 3 lines

  // Determine if text needs "Read more" based on character count
  const needsReadMore = caption.length > CHARACTER_THRESHOLD;

  // Parse caption for highlights
  const parsedParts = parseCaption(caption);

  const renderText = () => {
    return parsedParts.map((part, index) => {
      const isHighlight = part.type !== 'text';
      return (
        <Text
          key={index}
          style={isHighlight ? { color: colors.verify, fontWeight: '500' } : undefined}
        >
          {part.text}
        </Text>
      );
    });
  };

  // Truncate text if not expanded
  const displayText = !expanded && needsReadMore
    ? caption.slice(0, CHARACTER_THRESHOLD) + '...'
    : caption;

  const renderTruncatedText = () => {
    if (!expanded && needsReadMore) {
      const truncatedCaption = caption.slice(0, CHARACTER_THRESHOLD) + '...';
      const truncatedParts = parseCaption(truncatedCaption);
      return truncatedParts.map((part, index) => {
        const isHighlight = part.type !== 'text';
        return (
          <Text
            key={index}
            style={isHighlight ? { color: colors.verify, fontWeight: '500' } : undefined}
          >
            {part.text}
          </Text>
        );
      });
    }
    return renderText();
  };

  return (
    <View>
      <Text
        style={[common.body, { color: colors.text, marginTop: 10, marginBottom: needsReadMore ? 0 : 10, fontSize: 14 }]}
      >
        {renderTruncatedText()}
      </Text>
      {needsReadMore && (
        <TouchableOpacity onPress={() => setExpanded(!expanded)}>
          <Text style={[common.body, { color: colors.verify, marginTop: 4, fontWeight: '600', fontSize: 14, marginBottom: 10 }]}>
            {expanded ? 'Read less' : 'Read more'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default CaptionText;
