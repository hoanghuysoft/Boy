import emojiRegex from 'emoji-regex-xs';
import React from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';
import ParsedText from 'react-native-parsed-text';

const EMOJI_PATTERN = emojiRegex();

interface FlexTextProps extends TextProps {
  bold?: boolean;
  medium?: boolean;
  light?: boolean;
  thin?: boolean;
  extraLight?: boolean;
  parse?: any[];
  lite?: boolean;
}

const FONT_MAP: Record<string, string> = {
  '100': 'GoogleSansFlexThin',
  '200': 'GoogleSansFlexExtraLight',
  '300': 'GoogleSansFlexLight',
  '400': 'GoogleSansFlexRegular',
  'normal': 'GoogleSansFlexRegular',
  '500': 'GoogleSansFlexMedium',
  '600': 'GoogleSansFlexMedium',
  '700': 'GoogleSansFlexBold',
  'bold': 'GoogleSansFlexBold',
};

export function FlexText(props: FlexTextProps) {
  const { style, children, bold, medium, light, thin, extraLight, parse, lite = true, ...rest } = props;

  let selectedFont = '';
  if (bold) selectedFont = 'GoogleSansFlexBold';
  else if (medium) selectedFont = 'GoogleSansFlexMedium';
  else if (light) selectedFont = 'GoogleSansFlexLight';
  else if (thin) selectedFont = 'GoogleSansFlexThin';
  else if (extraLight) selectedFont = 'GoogleSansFlexExtraLight';

  if (!selectedFont) {
    const flattenedStyle = StyleSheet.flatten(style) || {};
    const weight = flattenedStyle.fontWeight?.toString() || 'normal';
    selectedFont = FONT_MAP[weight] || 'GoogleSansFlexRegular';
  }

  const isLite = lite && !parse;

  if (isLite) {
    return (
      <Text
        {...rest}
        style={[style, { fontFamily: selectedFont }]}
      >
        {children}
      </Text>
    );
  }

  const defaultParse = [
    {
      pattern: EMOJI_PATTERN,
      style: styles.emojiFont, 
    },
  ];

  const mergedParse = parse ? [...defaultParse, ...parse] : defaultParse;

  return (
    <ParsedText
      {...rest}
      style={[style, { fontFamily: selectedFont }]}
      parse={mergedParse}
    >
      {children}
    </ParsedText>
  );
}

const styles = StyleSheet.create({
  emojiFont: {
    fontFamily: "FluentEmoji",
    fontWeight: 'normal', 
  },
});
