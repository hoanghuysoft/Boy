import React, { forwardRef, useCallback, useState } from 'react';
import {
    Platform,
    StyleSheet,
    TextInput,
    type TextInputContentSizeChangeEvent,
    type TextInputInstance,
    type TextInputProps,
    type TextStyle,
} from 'react-native';

export interface AutosizedTextInputProps extends Omit<TextInputProps, 'multiline'> {
    minRows?: number;
    maxRows?: number;
    onUpdateHeight?: (height: number) => void;
}

export const AutosizedTextInput = forwardRef<TextInputInstance, AutosizedTextInputProps>(
    (
        {
            minRows = 1,
            maxRows,
            onUpdateHeight,
            onContentSizeChange: outerOnContentSizeChange,
            style,
            ...rest
        },
        ref
    ) => {
        const flattenedStyle = (StyleSheet.flatten(style) || {}) as TextStyle;
        const fontSize = flattenedStyle.fontSize || 16;
        const lineHeight = flattenedStyle.lineHeight || fontSize * 1.3;
        const minHeight = minRows * lineHeight;
        const maxHeight = maxRows ? maxRows * lineHeight : undefined;

        const [height, setHeight] = useState<number | undefined>(minHeight);

        const handleContentSizeChange = useCallback(
            (e: TextInputContentSizeChangeEvent) => {
                const contentHeight = Math.ceil(e.nativeEvent.contentSize.height);
                const nextHeight = Math.max(
                    minHeight,
                    maxHeight ? Math.min(contentHeight, maxHeight) : contentHeight
                );

                if (nextHeight !== height) {
                    setHeight(nextHeight);
                    onUpdateHeight?.(nextHeight);
                }

                outerOnContentSizeChange?.(e);
            },
            [minHeight, maxHeight, height, onUpdateHeight, outerOnContentSizeChange]
        );

        return (
            <TextInput
                ref={ref}
                multiline
                scrollEnabled={maxHeight ? (height ?? 0) >= maxHeight : false}
                onContentSizeChange={handleContentSizeChange}
                style={[
                    style,
                    {
                        textAlignVertical: 'top',
                        minHeight,
                        maxHeight,
                        ...(Platform.OS === 'android' && height ? { height } : {}),
                    },
                ]}
                {...rest}
            />
        );
    }
);

AutosizedTextInput.displayName = 'AutosizedTextInput';
