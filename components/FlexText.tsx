import React from 'react';
import { StyleProp, StyleSheet, Text, TextProps, TextStyle } from 'react-native';
import ParsedText from 'react-native-parsed-text';
import RNShowMoreText from './RNShowMoreText';

export interface FlexTextProps extends TextProps {
  bold?: boolean;
  medium?: boolean;
  light?: boolean;
  thin?: boolean;
  extraLight?: boolean;
  parse?: any[];
  /** @deprecated lite is now the default mode. Standard Text is returned unless `parse` or `isExpanded` is provided. */
  lite?: boolean;
  /** When true, uses RNShowMoreText for intelligent read more / read less truncation */
  isExpanded?: boolean;
  readMoreStyle?: StyleProp<TextStyle>;
  readMoreText?: string;
  readLessText?: string;
  readMoreTextProps?: TextProps;
  compensationSpaceIos?: number;
  compensationSpaceAndroid?: number;
  isMonospaced?: boolean;
  shortWidthCharacters?: string[];
  longWidthCharacters?: string[];
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
  const {
    style,
    children,
    bold,
    medium,
    light,
    thin,
    extraLight,
    parse,
    lite,
    isExpanded,
    readMoreStyle,
    readMoreText,
    readLessText,
    readMoreTextProps,
    compensationSpaceIos,
    compensationSpaceAndroid,
    isMonospaced,
    shortWidthCharacters,
    longWidthCharacters,
    numberOfLines,
    ...rest
  } = props;

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

  if (isExpanded && typeof children === 'string') {
    return (
      <RNShowMoreText
        numberOfLines={numberOfLines ?? 3}
        readMoreStyle={readMoreStyle}
        readMoreText={readMoreText}
        readLessText={readLessText}
        readMoreTextProps={readMoreTextProps}
        compensationSpaceIos={compensationSpaceIos}
        compensationSpaceAndroid={compensationSpaceAndroid}
        isMonospaced={isMonospaced}
        shortWidthCharacters={shortWidthCharacters}
        longWidthCharacters={longWidthCharacters}
        {...rest}
        style={[style, { fontFamily: selectedFont }]}
      >
        {children}
      </RNShowMoreText>
    );
  }

  if (parse && parse.length > 0) {
    return (
      <ParsedText
        numberOfLines={numberOfLines}
        {...rest}
        style={[style, { fontFamily: selectedFont }]}
        parse={parse}
      >
        {children}
      </ParsedText>
    );
  }

  return (
    <Text
      numberOfLines={numberOfLines}
      {...rest}
      style={[style, { fontFamily: selectedFont }]}
    >
      {children}
    </Text>
  );
}
