import React, { memo, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  NativeSyntheticEvent,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TextLayoutEventData,
  TextProps,
  TextStyle,
  View,
} from 'react-native';
import ParsedText from 'react-native-parsed-text';
import {
  balanceDiffHelper,
  calculateSlicePositionHelper,
  calculateStringWidthHelper,
  getVisualLengthHelper,
  visualSliceHelper,
} from 'rn-show-more-text/lib/helper';

export interface RNShowMoreTextProps extends Omit<TextProps, 'children'> {
  numberOfLines: number;
  children: string;
  readMoreStyle?: StyleProp<TextStyle>;
  readMoreText?: string;
  readLessText?: string;
  readMoreTextProps?: TextProps;
  compensationSpaceIos?: number;
  compensationSpaceAndroid?: number;
  isMonospaced?: boolean;
  shortWidthCharacters?: string[];
  longWidthCharacters?: string[];
  parse?: any[];
  renderContent?: (text: string) => React.ReactNode;
}

export const RNShowMoreText = memo(({
  numberOfLines = 3,
  children,
  readMoreStyle,
  readMoreText,
  readLessText,
  readMoreTextProps,
  compensationSpaceIos = 1,
  compensationSpaceAndroid = 0,
  isMonospaced = false,
  shortWidthCharacters = [],
  longWidthCharacters = [],
  parse,
  renderContent,
  style,
  onTextLayout,
  ...rest
}: RNShowMoreTextProps) => {
  const [isNeedReadMore, setIsNeedReadMore] = useState(false);
  const [calculated, setCalculated] = useState(false);
  const [, setRenderTrigger] = useState(false);

  const isShowingFullTextRef = useRef(false);
  const fullTextRef = useRef(children);
  const truncatedTextRef = useRef(children);
  const containerWidthRef = useRef(0);
  const textLinesRef = useRef<{ text: string; width: number }[]>([]);

  const compensationSpace = Platform.OS === 'ios' ? compensationSpaceIos : compensationSpaceAndroid;
  const readMoreContent = useMemo(() => `... ${(readMoreText || 'Read more').trim()}`, [readMoreText]);

  // Reset when text, style or line limit changes
  useLayoutEffect(() => {
    fullTextRef.current = children;
    truncatedTextRef.current = children;
    textLinesRef.current = [];
    isShowingFullTextRef.current = false;
    setIsNeedReadMore(false);
    setCalculated(false);
  }, [children, numberOfLines, style]);

  const calculateTruncated = useCallback(() => {
    const lines = textLinesRef.current;
    const containerWidth = containerWidthRef.current;
    if (!lines || lines.length === 0 || containerWidth === 0) {
      return;
    }

    if (lines.length > numberOfLines) {
      let visibleText = '';
      for (let i = 0; i < numberOfLines; i++) {
        visibleText += lines[i].text;
      }

      const lastRow = lines[numberOfLines - 1];
      const lastRowText = lastRow.text.endsWith('\n') ? lastRow.text.slice(0, -1) : lastRow.text;
      const visual = getVisualLengthHelper(lastRowText, shortWidthCharacters, longWidthCharacters);

      let avgCharWidth = visual.visualLength > 0 ? (lastRow.width || 0) / visual.visualLength : 0;
      const balance = balanceDiffHelper(visual.emojiCount, visual.shortCharCount, visual.longCharCount);

      if (balance !== 0 && visual.visualLength > 0) {
        avgCharWidth = balance < 0
          ? avgCharWidth * (1 + Math.abs(balance) / visual.visualLength)
          : avgCharWidth * (1 - Math.abs(balance) / visual.visualLength);
      }

      const readMoreWidth = calculateStringWidthHelper(
        readMoreContent,
        avgCharWidth || 1,
        isMonospaced,
        shortWidthCharacters,
        longWidthCharacters
      );

      const targetLastLineWidth = containerWidth - readMoreWidth;

      if (visibleText.endsWith('\n')) {
        visibleText = visibleText.slice(0, -1);
      }

      const sliceEndOffset = lastRow.width <= targetLastLineWidth
        ? undefined
        : calculateSlicePositionHelper(
            lastRowText,
            avgCharWidth,
            readMoreWidth + compensationSpace * avgCharWidth,
            isMonospaced,
            shortWidthCharacters,
            longWidthCharacters
          );

      const truncated = visualSliceHelper(visibleText, 0, sliceEndOffset).trim();
      truncatedTextRef.current = truncated;
      fullTextRef.current = truncated;
      setIsNeedReadMore(true);
    } else {
      truncatedTextRef.current = children;
      fullTextRef.current = children;
      setIsNeedReadMore(false);
    }

    setCalculated(true);
  }, [
    children,
    numberOfLines,
    readMoreContent,
    compensationSpace,
    isMonospaced,
    shortWidthCharacters,
    longWidthCharacters,
  ]);

  const onContainerLayout = useCallback((e: any) => {
    const width = e.nativeEvent?.layout?.width || 0;
    if (width > 0) {
      containerWidthRef.current = width;
      if (textLinesRef.current.length > 0) {
        calculateTruncated();
      }
    }
  }, [calculateTruncated]);

  const onMeasurementTextLayout = useCallback((e: NativeSyntheticEvent<TextLayoutEventData>) => {
    onTextLayout?.(e);
    const lines = e.nativeEvent?.lines || [];
    if (lines.length > 0) {
      textLinesRef.current = lines;
      if (containerWidthRef.current > 0) {
        calculateTruncated();
      }
    }
  }, [onTextLayout, calculateTruncated]);

  const toggleExpansion = useCallback((event: any) => {
    if (isShowingFullTextRef.current) {
      fullTextRef.current = truncatedTextRef.current;
      isShowingFullTextRef.current = false;
    } else {
      fullTextRef.current = children;
      isShowingFullTextRef.current = true;
    }
    setRenderTrigger(prev => !prev);
    readMoreTextProps?.onPress?.(event);
  }, [children, readMoreTextProps]);

  const flattenedStyle = StyleSheet.flatten(style || {});
  const targetOpacity = flattenedStyle?.opacity ?? 1;

  const renderTextContent = () => {
    const currentText = fullTextRef.current;
    if (renderContent) {
      return renderContent(currentText);
    }
    return currentText;
  };

  const readMoreNode = calculated && isNeedReadMore ? (
    <Text
      style={[styles.readMoreText, readMoreStyle]}
      suppressHighlighting
      {...readMoreTextProps}
      onPress={toggleExpansion}
    >
      {isShowingFullTextRef.current
        ? ` ${readLessText || 'Read less'}`
        : readMoreContent}
    </Text>
  ) : null;

  return (
    <View style={styles.container} onLayout={onContainerLayout}>
      {/* Visible rendered text */}
      <Text
        {...rest}
        style={[
          styles.container,
          style,
          { opacity: calculated ? targetOpacity : 0 },
        ]}
      >
        {parse && parse.length > 0 && !renderContent ? (
          // ParsedText only parses when its children is a single string
          <ParsedText parse={parse}>{fullTextRef.current}</ParsedText>
        ) : (
          renderTextContent()
        )}
        {readMoreNode}
      </Text>

      {/* Hidden unconstrained text for line & width layout measurement */}
      {!calculated && (
        <Text
          {...rest}
          style={[styles.container, style, styles.hiddenMeasure]}
          onTextLayout={onMeasurementTextLayout}
          aria-hidden
        >
          {children}
        </Text>
      )}
    </View>
  );
});

RNShowMoreText.displayName = 'RNShowMoreText';

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  readMoreText: {
    fontFamily: 'GoogleSansFlexBold',
  },
  hiddenMeasure: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    opacity: 0,
    zIndex: -9999,
  },
});

export default RNShowMoreText;
