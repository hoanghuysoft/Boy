import React, { forwardRef } from 'react';
import { StyleSheet, type TextInputProps, type TextStyle } from 'react-native';
import TextareaAutosize from 'react-textarea-autosize';

export interface AutosizedTextInputProps extends Omit<TextInputProps, 'multiline'> {
    minRows?: number;
    maxRows?: number;
    onUpdateHeight?: (height: number) => void;
}

export const AutosizedTextInput = forwardRef<any, AutosizedTextInputProps>(
    (
        {
            value,
            defaultValue,
            placeholder,
            placeholderTextColor: _placeholderTextColor,
            onChangeText,
            onChange,
            minRows = 1,
            maxRows,
            style,
            onUpdateHeight,
            editable = true,
            autoFocus,
            ...rest
        },
        ref
    ) => {
        const flattenedStyle = (StyleSheet.flatten(style) || {}) as TextStyle;
        const {
            lineHeight: rawLineHeight,
            fontSize: rawFontSize,
            fontWeight: rawFontWeight,
            fontFamily: rawFontFamily,
            color: rawColor,
            ...restStyle
        } = flattenedStyle;

        const cssStyle: React.CSSProperties = {
            boxSizing: 'border-box',
            width: '100%',
            resize: 'none',
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            fontFamily: rawFontFamily || 'inherit',
            fontSize: rawFontSize || 16,
            fontWeight: (rawFontWeight as any) || 'normal',
            lineHeight: rawLineHeight
                ? (typeof rawLineHeight === 'number' ? `${rawLineHeight}px` : rawLineHeight)
                : 'normal',
            color: (rawColor as string) || 'inherit',
            padding: 0,
            margin: 0,
            ...(restStyle as any),
        };

        return (
            <TextareaAutosize
                ref={ref}
                value={value}
                defaultValue={defaultValue}
                placeholder={placeholder}
                minRows={minRows}
                maxRows={maxRows}
                autoFocus={autoFocus}
                disabled={!editable}
                onChange={(e) => {
                    onChangeText?.(e.target.value);
                    onChange?.(e as any);
                }}
                onHeightChange={(height) => {
                    onUpdateHeight?.(height);
                }}
                style={cssStyle as any}
            />
        );
    }
);

AutosizedTextInput.displayName = 'AutosizedTextInput';
