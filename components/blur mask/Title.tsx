/* eslint-disable @typescript-eslint/no-var-requires */
import { GoogleSansFlex_700Bold } from '@expo-google-fonts/google-sans-flex';
import { Text, useFont } from "@shopify/react-native-skia";
import React, { useMemo } from "react";
import { useWindowDimensions } from "react-native";

const HORIZONTAL_PADDING = 24;

export const Title = ({ name, description }: { name: string, description: string }) => {
    const { width, height } = useWindowDimensions();
    const font = useFont(GoogleSansFlex_700Bold, 38);
    const subFont = useFont(GoogleSansFlex_700Bold, 16);

    // Calculate available width for text
    const maxWidth = width - (HORIZONTAL_PADDING * 2);

    // Truncate text if needed
    const { displayText, displaySubText } = useMemo(() => {
        if (!font || !subFont) {
            return { displayText: name, displaySubText: description.toUpperCase() };
        }

        let truncatedName = name;
        let truncatedDesc = description.toUpperCase();

        // Truncate name if too wide
        while (font.getTextWidth(truncatedName) > maxWidth && truncatedName.length > 3) {
            truncatedName = truncatedName.slice(0, -1);
        }
        if (truncatedName !== name && truncatedName.length > 0) {
            truncatedName = truncatedName.slice(0, -2) + '...';
        }

        // Truncate description if too wide
        while (subFont.getTextWidth(truncatedDesc) > maxWidth && truncatedDesc.length > 3) {
            truncatedDesc = truncatedDesc.slice(0, -1);
        }
        if (truncatedDesc !== description.toUpperCase() && truncatedDesc.length > 0) {
            truncatedDesc = truncatedDesc.slice(0, -2) + '...';
        }

        return { displayText: truncatedName, displaySubText: truncatedDesc };
    }, [name, description, font, subFont, maxWidth]);

    if (!font || !subFont) {
        return null;
    }

    // Calculate centered x positions with bounds checking
    const textWidth = font.getTextWidth(displayText);
    const subTextWidth = subFont.getTextWidth(displaySubText);

    const x1 = Math.max(HORIZONTAL_PADDING, (width - textWidth) / 2);
    const x2 = Math.max(HORIZONTAL_PADDING, (width - subTextWidth) / 2);

    return (
        <>
            <Text
                font={font}
                x={x1}
                y={height - 100}
                text={displayText}
                color="white"
                opacity={0.9}
            />
            <Text
                font={subFont}
                x={x2}
                y={height - 70}
                text={displaySubText}
                color="white"
                opacity={0.6}
            />
        </>
    );
};
