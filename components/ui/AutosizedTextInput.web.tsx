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

        const cssStyle: React.CSSProperties = {
            boxSizing: 'border-box',
            width: '100%',
            resize: 'none',
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            fontFamily: flattenedStyle.fontFamily || 'inherit',
            fontSize: flattenedStyle.fontSize || 16,
            fontWeight: (flattenedStyle.fontWeight as any) || 'normal',
            lineHeight: flattenedStyle.lineHeight ? `${flattenedStyle.lineHeight}px` : 'inherit',
            color: (flattenedStyle.color as string) || 'inherit',
            padding: 0,
            margin: 0,
            ...(flattenedStyle as any),
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
