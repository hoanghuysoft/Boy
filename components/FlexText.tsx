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
  renderContent?: (text: string) => React.ReactNode;
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

function getFontFamily(
  bold?: boolean,
  medium?: boolean,
  light?: boolean,
  thin?: boolean,
  extraLight?: boolean,
  style?: StyleProp<TextStyle>
): string {
  if (bold) return 'GoogleSansFlexBold';
  if (medium) return 'GoogleSansFlexMedium';
  if (light) return 'GoogleSansFlexLight';
  if (thin) return 'GoogleSansFlexThin';
  if (extraLight) return 'GoogleSansFlexExtraLight';

  if (!style) return 'GoogleSansFlexRegular';

  // Fast path for single object style
  if (!Array.isArray(style)) {
    const fw = (style as TextStyle)?.fontWeight;
    return fw ? (FONT_MAP[fw.toString()] || 'GoogleSansFlexRegular') : 'GoogleSansFlexRegular';
  }

  // Fast path for 1-element array style
  if (style.length === 1 && style[0] && !Array.isArray(style[0])) {
    const fw = (style[0] as TextStyle)?.fontWeight;
    return fw ? (FONT_MAP[fw.toString()] || 'GoogleSansFlexRegular') : 'GoogleSansFlexRegular';
  }

  // General fallback for nested/multi-element array styles
  const flattenedStyle = StyleSheet.flatten(style);
  if (!flattenedStyle) return 'GoogleSansFlexRegular';
  const weight = flattenedStyle.fontWeight?.toString() || 'normal';
  return FONT_MAP[weight] || 'GoogleSansFlexRegular';
}

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
    renderContent,
    numberOfLines,
    ...rest
  } = props;

  const selectedFont = getFontFamily(bold, medium, light, thin, extraLight, style);

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
        parse={parse}
        renderContent={renderContent}
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
